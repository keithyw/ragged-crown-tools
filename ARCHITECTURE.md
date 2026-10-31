# Architecture

Ragged Crown Tools is an internal editor for the data that drives the Ragged Crown game (tile definitions today; zones, objects and items later).
It replaces hand-edited JSON files with a proper frontend.

This is a first draft. Sections marked **Open question** or listed under **Known gaps** are places where the code and the intent may disagree and need a decision.

---

## 1. Big picture

```
┌────────────────────┐   HTTP/JSON    ┌────────────────────┐    BSON    ┌───────────┐
│ Next.js frontend   │ ─────────────► │ Go REST API        │ ─────────► │ MongoDB   │
│ (localhost:3000)   │ ◄───────────── │ (localhost:8080)   │ ◄───────── │ (27017)   │
└────────────────────┘                └────────────────────┘            └───────────┘
```

- **Frontend** (`/frontend`): Next.js 16 (App Router, all client components), React 19, TypeScript, Tailwind v4, react-hook-form + zod, Axios, Zustand (installed, not yet used for app state).
- **Backend** (`/backend`): Go, chi router, official MongoDB driver. It is deliberately a _dumb document store_: it does not know what a tile is.
- **Database**: MongoDB. A few collections (`tile_defs`, `items`, `entities`, `zones`, plus the reserved `events`); several kinds of definition share a collection and are told apart by `kind` (see the collection table in section 3.1 and `DATA-MODEL.md`).
- **Consumer**: the game (`ragged-crown`) loads the documents this tool produces.

The core design decision: **the backend is generic; the frontend owns all domain knowledge** (shape, validation, defaults, UI). Adding a new entity should mean
adding frontend files, plus one line in the backend's collection allow-list. The idea behind the dumb backend is that there is no official backend schema and
that allows me maximum flexibility. Part of the motivation here is to make decisions via a frontend first perspective and avoid duplication validation logic
early on especially because of how there's shared codebase with two different repositories.

Also, regarding the choice of MongoDB here is to keep things relatively simple since much of the original design was done via json files. Instead of dealing
with Mysql's idiosyncrasies or another RDBMS that employs JSON columns, I wanted to minimize my own effort in querying or dealing with conversions.

---

## 2. Repository layout

```
ragged-crown-tools/
├── backend/
│   ├── cmd/api/main.go              entry point, wiring, listens on :8080
│   └── internal/
│       ├── config/mongo.go          env-based config (MONGODB_URI, MONGO_DATABASE, MONGO_TIMEOUT)
│       ├── database/mongo.go        connect/close
│       ├── server/server.go         router, CORS, routes
│       └── collection/
│           ├── middleware.go        collection allow-list
│           ├── handler.go           HTTP handlers + error mapping
│           └── repository.go        Mongo operations
├── frontend/
│   └── src/
│       ├── app/                     routes (one folder per entity)
│       ├── components/              form/, layout/, navigation/, ui/
│       ├── hooks/                   generic CRUD hooks
│       ├── schemas/                 zod schemas (one per entity)
│       └── lib/                     services/, types/, constants/, utils/
├── mcp/                             local MCP server (read-only view of the API for Claude), see section 6.1
├── .mcp.json                        registers that server for Claude Code
├── scripts/ensure-indexes.js        mongosh script: unique index on `id` per collection, see section 6.3
├── Dockerfile                       builds the Go API only
├── docker-compose.yml               mongodb + rc_tools (API)
└── Makefile                         docker-compose shortcuts
```

The frontend is run locally with `pnpm dev` (port 3000); Docker Compose runs MongoDB and the API.

---

## 3. Backend

### 3.1 Routes

All entity access goes through one generic route group:

| Method | Path                            | Handler | Result                             |
| ------ | ------------------------------- | ------- | ---------------------------------- |
| GET    | `/collection/{collection}`      | GetAll  | `200` array of documents, or `400` |
| POST   | `/collection/{collection}`      | Post    | `201` the created document         |
| GET    | `/collection/{collection}/{id}` | GetByID | `200` document, `404`, or `400`    |
| PUT    | `/collection/{collection}/{id}` | Put     | `200` the replaced document, `404` |
| DELETE | `/collection/{collection}/{id}` | Delete  | `204` no body, `404`               |
| GET    | `/references/{collection}/{id}` | GetReferrer | `200` `{"referencedBy": null}` or the first referrer, `400`, `404` |

`{collection}` must be in the allow-list in `collection/middleware.go`; otherwise `404`. **This list is the one backend change needed for each new entity type.**

The allow-list matches `DATA-MODEL.md`. The backend stays schema-less: it doesn't validate document contents and doesn't know what `kind` means.

| Collection  | Holds                                                                                  |
| ----------- | -------------------------------------------------------------------------------------- |
| `tile_defs` | Terrain definitions (`kind: 'terrain'`)                                                |
| `items`     | Item definitions (`kind: 'item'`)                                                      |
| `entities`  | Object, creature and portal definitions, told apart by `kind`; list with `?kind=`      |
| `zones`     | Zones (terrain grid, placements, exits)                                                |
| `sprites`   | Sprite art: 16×16 pixel sprites that defs reference by `_id` (`DATA-MODEL.md` 1.2)     |
| `events`    | **Reserved, unused.** Kept only in case reusable interaction templates are ever saved. |

#### List query params (`GET /collection/{collection}`)

With no params it returns the whole collection, as before. The response body is always a plain JSON array; the number of documents matching the filter (ignoring `limit`/`offset`) is in the `X-Total-Count` header (exposed through CORS).

| Param               | Meaning                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| any other `field=v` | Equality match on that field. `?kind=object`. Repeat the param for "any of": `?kind=object&kind=portal`.                                |
| `sort=name`         | Sort ascending; `sort=-name` descending. One field. Default is `_id` ascending, which is also used as a tiebreaker so paging is stable. |
| `limit=n`           | Integer 1 to 1000. If omitted there is **no limit**, so existing callers are unchanged.                                                 |
| `offset=n`          | Integer >= 0.                                                                                                                           |

- Filter values are always strings straight from the URL, so they can never carry a Mongo operator. `?isWalkable=true` will **not** match a boolean field; typed matching is added when something needs it.
- Field names (filter and sort) must match `^[A-Za-z_][A-Za-z0-9_.]*$` (dotted paths allowed, no `$`).
- `_id` is the exception: its values must be valid ObjectID hex and are converted, since they are stored as ObjectIDs.
- `sort`, `limit` and `offset` are reserved, so a document field with one of those names can't be filtered on.
- Bad params return `400` with `{"error": "invalid query: ..."}`.

#### Reference check (`GET /references/{collection}/{id}`)

Answers "does any other document point at this one?" so the frontend can warn before a delete ([Backend 5], [Tools 20]). It returns `{"referencedBy": null}` or `{"referencedBy": {"collection", "_id", "id", "name"}}`: the **first** referrer found, not a list. A malformed `id` is `400`; it does not check that the document exists.

- **The backend knows the reference map** (`referenceSources` in `collection/references.go`): for each collection, which fields in which collections hold its `_id`s. This is a deliberate exception to the schema-less rule (section 10); it lists reference fields only. A schema that gains a reference field needs a line there, like the allow-list.
- Direct references only, covered today: a def's `spriteId`, and the `itemId` / `defId` inside a def's interactions (HAS_ITEM, GIVE_ITEM, TAKE_ITEM, SPAWN).
- **Not covered yet:** zones (`terrain`, `placements`). Until they are, `tile_defs`, `zones` and `events` always answer `null`, even for a tile a zone uses. Treat `null` as "no referrer among the covered fields", not "safe to delete".

### 3.2 Document identity

- The MongoDB `_id` is an **ObjectID generated by the server** on create. The URL's `{id}` segment is always that `_id` as a 24-character hex string.
- Handlers parse it with `primitive.ObjectIDFromHex`; a malformed value returns `400 invalid id`.
- The payload's own `_id` is stripped on create and replace, so clients cannot choose or change keys.
- `updated_at` is set server-side (UTC) on every write.
- PUT is a **full replacement** (`FindOneAndReplace`, returning the new document). Any field missing from the body is removed. There is no PATCH.
- There is a notion of a regular document potentially having its own "id" value. This is somewhat of a legacy element where a shorthand was used for
  things like TileDefs as opposed to a hexcode to be used in representing each terrain tile for a zone. It might seem confusing for now, but there could be
  future cases where a manually entered "id" value is required.

### 3.3 Error mapping

The repository returns sentinel errors; `handler.fail` maps them once:

| Error          | HTTP                          |
| -------------- | ----------------------------- |
| `ErrInvalidID` | 400                           |
| `ErrNotFound`  | 404                           |
| `ErrDuplicate` | 409                           |
| anything else  | 500 (logged, generic message) |

All error bodies are JSON: `{"error": "..."}`.

### 3.4 Two kinds of "id"

| Field | Who owns it        | Purpose                                                                                                                                |
| ----- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `_id` | Server (ObjectID)  | Technical key: URLs, API calls, React keys, selection state. Users never see it.                                                       |
| `id`  | User (e.g. `T001`) | Human-readable identifier that other data and the game refer to. Shown in the UI. Refer to Document identity for additional background |

`ErrDuplicate` only fires if MongoDB has a **unique index** on the user-facing `id` for that collection. The code does not create indexes today (see Known gaps).

Note: I once added an index by hand on `tile_defs` only, and it is gone (the database has been flushed or recreated since). **Every collection now has a unique `id_unique` index on `id`**, in the real database and the sandbox (created with `make db-indexes` and `make sandbox-indexes`, section 6.3, [Infra 7]; checked by hand 2026-10-30). `_id` is still the real key and `id` is a legacy label filled in by hand. There is no base code to keep the indexes up to date in the way a migration file is used, so a recreated or reset database needs the make target run again.

### 3.5 Other

- CORS allows `http://localhost:3000` and `http://127.0.0.1:3000`, plus `:3001` for the sandbox UI (section 6.0). Hard-coded in `server.go`.
- No authentication. This is an internal tool.
- JSON numbers decode into `bson.M` as `float64`, so `1` is stored as the double `1.0`. It round-trips to JSON as `1`; it only matters when inspecting data in Compass or querying by integer type.

---

## 4. Frontend

### 4.1 Data layer (`lib/services`)

`client.ts` is a shared Axios instance (`NEXT_PUBLIC_API_URL`, 10 s timeout, JSON headers).

`collection.ts` exposes `collectionService`, generic over the document type:

```ts
collectionService.fetch<T>(collection); // GET list
collectionService.get<T>(collection, _id); // GET one
collectionService.create<T>(collection, data); // POST
collectionService.put<T>(collection, _id, data); // PUT (replace)
collectionService.delete(collection, _id); // DELETE
```

Every read/write returns `StoredDoc<T>` = `T & { _id: string; updated_at: string }`. One service handles every collection; the type parameter is chosen per call.

### 4.2 Generic hooks (`hooks/`)

| Hook                     | Responsibility                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `useCollection<T>(name)` | Fetch all documents on mount; exposes `items`, `isLoading`, `error`, `refresh`.                                                     |
| `useCreateRecord`        | react-hook-form + zod resolver; calls an injected `createFn`; toast, reset, redirect; maps server errors onto form fields.          |
| `useEditRecord`          | Loads one document, maps it into form values (`handleFetchCallback`), submits via an injected `updateData`, redirects.              |
| `useDeleteRecord`        | Owns the confirmation-modal state and delete call; shows toasts; calls `onSuccess` (the list page passes `refresh`). Keys on `_id`. |

The hooks take their service functions as parameters rather than importing them, so they stay entity-agnostic.

### 4.3 Configuration-as-code forms

Forms are described as data, not hand-written JSX:

1. **Schema** (`schemas/<entity>Schema.ts`): a zod schema is the source of truth for validation and the form's TypeScript type.
2. **Field config** (`app/<entity>/fields.ts`): a `FormField<T>[]` array. Each entry names a schema key and says how to render it (`type`, `label`, `placeholder`, `required`, `inputWidth`, `inputAttrs`, `colorKind`, `options`).
3. **`FormInput`** renders one field based on `type`: text/number/email/password, textarea, checkbox, select (via `Controller`), or `color` (the swatch picker, via `Controller`).
4. **Layouts**: `CreateFormLayout` (card, breadcrumbs, submit/cancel) is reused by `EditFormLayout`, which adds loading and error states.

Additional note: The idea of using Configuration-as-code form style here is that my experience with most forms has been pretty uniform when it comes to
CRUD applications. There will certainly be non-standard CRUD aspects such as the map/zone builder which require more sophisticated techniques. But for
anything dealing with basic fields and storage, the various hooks and pre-built elements will be used and/or ported over from a pre-existing codebase.

Notable conventions:

- `FormField.inputAttrs` forwards native attributes (`maxLength`, `min`, `step`, ...) to the input. `inputWidth` is a design-system choice (a CVA variant), kept separate from HTML attributes.
- Number inputs are converted with `register(..., { setValueAs })`, mapping an empty string to `undefined` so optional numbers validate cleanly. The zod schema uses plain `z.number()`, not `z.coerce`.
- Empty optional text is stored as absent (`optionalText` transforms `''` to `undefined`).

### 4.4 Tailwind colors stored as data

Tile `color` and `bg` are stored as Tailwind class strings (e.g. `text-emerald-400`, `bg-emerald-950/60`) because the game renders them directly.

- `ColorPicker` builds class names at runtime from `lib/types/colorPalette.ts` (hues, shades, opacities).
- Tailwind only emits classes it can see as whole strings, so `globals.css` has `@source inline(...)` safelist lines. **The palette file and those CSS lines must stay in sync.**
- Each `@source inline(...)` must stay on one line; Prettier's wrapping breaks Tailwind's parser, hence `/* prettier-ignore */`.
- **The game's CSS needs the same safelist**, or stored classes render uncolored there.

### 4.5 Entity UI pattern (tile definitions)

`app/tile-definitions/` is the reference implementation:

```
page.tsx            list: tile grid + sticky inspector + delete modal
create/page.tsx     create form
[id]/edit/page.tsx  edit form (the [id] segment is the document's _id)
fields.ts           shared field config for create and edit
layout.tsx          wraps the section in CrudLayout (title bar)
```

The list is a visual grid (`TileCard` + `TileGlyph`) rather than a data table, because tiles are visual. Interaction model: click selects, the right-hand inspector (`TileInspector`) shows details and Edit/Delete, double-click opens edit. The inspector column is reserved and `sticky`, so selecting never reflows the grid. `TileGlyph` is the single place that draws a def: its sprite when it has a `spriteId` that exists, otherwise its glyph. It finds sprites through `SpritesProvider` (root layout), which loads the `sprites` collection once and refetches on each route change.

A text-heavy entity (e.g. characters) could reuse `useCollection` and the same create/edit pages with a table view instead of a grid.

### 4.6 Navigation

- Top-level sections live in `MainNavbar` (`URLS` constants in `lib/constants/urls.ts`).
- Create/edit screens use `Breadcrumbs` (passed down via `CreateFormLayout`/`EditFormLayout`) and a Cancel button.
- `CrudLayout` has an optional subnavbar for domains with sibling sections; unused so far.
- Subnavbar- There is a concept of a subnavbar for CRUD apps which is a carry over from an older code base that had more entities (e.g. the indentity section
  possessed users, permissions and roles). The idea can be used here if we have a domain with other entities living under it.

---

## 5. Data contract with the game

- `lib/types/map.ts` mirrors the game's `types/map.ts` (`TileDef`, `Zone`, `Placement`, `Interaction`, `Position`, ...). **The two files are copies and can drift.**
- The tool's `tileDefinitionSchema` covers a subset of `TileDef`. Not yet in the form: `type`, `spriteCoords`, `encounterTableKey`.
- Planned change: a zone's `terrain` (`string[][]`) should reference tiles by Mongo `_id`, not the legacy `T001` keys. The game's map/tile loaders will need to resolve by `_id`.
- Things on the map (objects, items) and their interactions live in a zone's `placements`, keyed by `"x,y"`, not in an `events` collection. See `DATA-MODEL.md`.

---

## 6. Running locally

```bash
# MongoDB + API (needs a .env with MONGODB_URI, MONGO_DATABASE, MONGO_TIMEOUT)
make docker-up

# Frontend
cd frontend
pnpm install
pnpm dev          # http://localhost:3000, needs NEXT_PUBLIC_API_URL=http://localhost:8080
```

Makefile targets: `build`, `docker-up`, `docker-down`, `docker-restart`, `rc-build`, `rc-down`, `rc-restart` (the `rc-*` ones act on the API container only), `db-backup` (section 6.2), `db-indexes` and `sandbox-indexes` (section 6.3), `promote-sprites` (section 6.4).

### 6.0 Sandbox stack

A second, disposable API + MongoDB that runs alongside the real one, so generated or experimental data never touches real content. It is its own compose project in `docker-compose.sandbox.yml`; the real `docker-compose.yml` is untouched.

| | Real | Sandbox |
| --- | --- | --- |
| Compose file | `docker-compose.yml` | `docker-compose.sandbox.yml` |
| Project name | `ragged-crown-tools` | `ragged-crown-tools-sandbox` |
| Containers | `rc_mongodb`, `rc_tools` | `rc_mongodb_sandbox`, `rc_tools_sandbox` |
| API port | 8080 | 8081 |
| Mongo host port | 27017 | none (reachable only from the API over the compose network) |
| Volume | `rc_mongo_data` | `rc_mongo_data_sandbox` |
| Env file | `.env` | `.env.sandbox` |

- `.env.sandbox` is created by hand (copy `.env`, then change `MONGO_DATABASE` and the Mongo credentials; the host in `MONGODB_URI` resolves inside the sandbox's own network, so `mongodb` works, but `rc_mongodb_sandbox` is preferred because it fails loudly instead of reaching real data if the API is ever attached to the wrong network). It must be git-ignored and is never read or committed by Claude.
- Targets: `make sandbox-up`, `sandbox-down`, `sandbox-restart`, `sandbox-rc-restart` (rebuild the sandbox API only) and `sandbox-reset`. **`sandbox-reset` deletes the sandbox database volume** (`down -v` on the sandbox project only; it cannot touch the real volume). Confirm before every run.
- The sandbox starts empty. Both stacks have the unique index on `id` (section 6.3), so a duplicate `id` returns `409` in either; after `sandbox-reset` run `make sandbox-indexes` again. A backup of the real database can be restored into it (section 6.2).
- **Pointing things at it:** the MCP uses `RC_API_URL=http://localhost:8081`. The sandbox UI is `pnpm dev:sandbox` (in `frontend/`), on **:3001**, so it runs next to the normal `pnpm dev` on :3000. The script points it at the sandbox API (`NEXT_PUBLIC_API_URL=http://localhost:8081`) and gives it its own build folder, `.next-sandbox` (git-ignored; set through `NEXT_DIST_DIR` in `next.config.ts`), because Next allows only one `next dev` per folder.
- **CORS for the second UI:** the API allows `localhost:3001` and `127.0.0.1:3001` as well as :3000. The list is still hard-coded in `server.go` (Known gap 6). After changing it, `make sandbox-rc-restart` rebuilds the sandbox API; the real API only picks it up on its next rebuild, and doesn't need it.
- **`tsconfig.json`** lists `.next-sandbox/types` and `.next-sandbox/dev/types` in `include`. Next adds them itself the first time the sandbox UI starts (and reformats the whole file while doing so), so they're committed to keep it from rewriting the file.

Verification: use `pnpm exec tsc --noEmit` in `frontend/` as the source of truth for types. Editor squiggles in a monorepo can be stale TS-server project issues rather than real errors.

### 6.1 MCP server (`mcp/`)

A small local tool that lets Claude read the data in the database through the API, and write to the **sandbox** only (section 6.0). It is a client of the Go API over HTTP and never connects to MongoDB itself. The read tools work on both stacks. The write tools (create and replace) exist in the code for both, but a Claude Code permission deny rule in `.claude/settings.json` (`mcp__ragged-crown__create_doc`, `mcp__ragged-crown__replace_doc`) removes them from the real server's tool list, so Claude cannot call them there. That guard covers Claude Code sessions only. There is no DELETE: cleaning up generated data is `make sandbox-reset`. Tracked on the Trello list "Infrastructure" ([Infra 1] to [Infra 10]), including the sandbox stack, backups and integrity checks.

| Tool              | Calls                                | Notes                                                                                                                                           |
| ----------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `list_collection` | `GET /collection/{collection}`       | Optional `filters` (string equality, array = "any of"), `sort`, `limit`, `offset`. Returns `total` (from `X-Total-Count`), `returned`, `items`. |
| `get_doc`         | `GET /collection/{collection}/{_id}` | Takes the Mongo `_id` (24 hex characters), not the user-facing `id`.                                                                            |
| `create_doc`      | `POST /collection/{collection}`      | Create only. Sandbox only. Validated (see below). Errors such as `409` for a duplicate `id` come back readable.                                 |
| `replace_doc`     | `PUT /collection/{collection}/{_id}` | **Replaces the whole document** (Known gap 1): send the full document, normally from `get_doc`. Sandbox only. Validated (see below).            |

- Code is one file, `mcp/src/index.ts`. The collection names are a copy of the backend allow-list (`middleware.go`); add a new collection to both.
- The API address comes from `RC_API_URL` (default `http://localhost:8080`). A future sandbox API would be another value here.
- **Write validation.** `create_doc` and `replace_doc` check the document with the frontend's zod schemas (`frontend/src/schemas/contentSchemas.ts`, `zoneSchema.ts`), imported as they are, not copied. `tile_defs` takes `kind: terrain`, `items` takes `item`, `entities` takes `object`, `creature` or `portal`; a wrong `kind` is rejected first. `sprites` uses `spriteSchema`, and `zones` uses `zoneSchema`. `events` is a placeholder and is not validated. What is sent is the parsed copy (the shape the frontend would save). **Boundary case, left as is:** zod strips unknown keys silently, so a misspelt field disappears instead of being reported; the returned stored document shows what was kept.
- **No build step, but it runs through `tsx`.** The frontend's schema files import each other without file extensions, which Node's own type stripping can't resolve, so the MCP is launched with `tsx` (a devDependency of `mcp/`). `.mcp.json` runs `node mcp/node_modules/tsx/dist/cli.mjs mcp/src/index.ts` from the repo root (that path is why it is spelled out), and `pnpm start` runs `tsx src/index.ts`. `node` is whichever Node is first on the PATH. `erasableSyntaxOnly` stays in `tsconfig.json` as a habit, no longer a requirement.
- `mcp/tsconfig.json` uses `module: esnext` / `moduleResolution: bundler` (the frontend's extensionless imports need it) and one `paths` entry mapping `@/lib/types` to `frontend/src/lib/types/map.ts`. Mapping all of `@/*` would pull the whole UI into the MCP's typecheck through the types barrel. If a schema file ever gains a *runtime* `@/` import, `tsx` won't resolve it either.
- Formatting uses the frontend's Prettier config: `cd frontend && pnpm exec prettier --config .prettierrc.cjs --write ../mcp/src/index.ts`.
- Local only. The API has no auth, so this must not be exposed beyond localhost (see section 10, "Before any deploy").

```bash
cd mcp
pnpm install
pnpm typecheck    # tsc --noEmit
pnpm start        # speaks MCP over stdio; normally launched by Claude Code, not by hand
```

Claude Code reads `.mcp.json` when a session starts and asks for approval of a project server the first time; `/mcp` shows its status. The API must be running (`make docker-up`) or the tools return "Cannot reach the API".

### 6.2 Backup and restore

```bash
make db-backup    # real database -> ~/databases/ragged-crown-tools/rc-<date>-<time>.archive.gz
```

- It runs `mongodump --archive --gzip` inside `rc_mongodb` and writes a dated BSON archive on the host, **outside the repo and outside the Docker volume**, so `docker compose down -v` cannot take it along. Override the folder with `BACKUP_DIR=...`. The archive is written as `*.partial` and renamed only if the dump succeeds.
- Every run adds a new file. Nothing is pruned; the dumps are tiny. Deleting old ones is manual.
- It dumps every database on the instance, not just `MONGO_DATABASE`.
- BSON keeps types exactly (the `float64` note in section 3.5 round-trips unchanged) and includes index definitions, so the `id_unique` indexes (section 6.3) travel with a backup.
- Backing up is read-only on the database. **Restoring is destructive; confirm every time**, and try it on the sandbox first, never first on real data.

Restore into the sandbox (the sandbox must be up):

```bash
docker exec -i rc_mongodb_sandbox mongorestore --archive --gzip \
  --nsFrom 'ragged_crown.*' --nsTo 'ragged_crown_sandbox.*' \
  < ~/databases/ragged-crown-tools/rc-<date>-<time>.archive.gz
```

- **The `--nsFrom`/`--nsTo` remap is required.** An archive stores each collection under its original namespace (`ragged_crown.tile_defs`), and `mongorestore` puts it back under that name on whichever server you point it at. Without the remap the data lands in a stray `ragged_crown` database inside the sandbox's Mongo, while the sandbox API reads `ragged_crown_sandbox` and still looks empty. (This happened on the first test.)
- The container name decides which server receives the data; the remap decides which database. Both must be right.
- Restoring over existing documents with the same `_id` skips them by default; `--drop` would replace the collections, so only add it deliberately.

### 6.3 Indexes

```bash
make db-indexes                          # real database
make sandbox-indexes                     # sandbox
make db-indexes COLLECTIONS="new_thing"  # only the named collection(s)
```

Both pipe `scripts/ensure-indexes.js` into `mongosh` inside the container (`ragged_crown` and `ragged_crown_sandbox`; override with `REAL_DB` / `SANDBOX_DB`). The backend does not create indexes, on purpose: it stays a dumb store and is often left running between changes, so it is not a good moment to hook this to.

- **What it creates:** a unique index named `id_unique` on `id`, **per collection** (not per `kind`), for `tile_defs`, `items`, `entities`, `zones` and `sprites`. `events` is skipped: it is reserved and unused.
- **Partial:** the index only covers documents whose `id` is a string. `id` is optional, and without this every document lacking one would count as `null` and collide with the others.
- **Mongo lifecycle:** a collection comes into being on first insert or first `createIndex`, so there is no "table before index" order. The script can run on a brand-new empty database, and `ErrDuplicate` starts firing as soon as the index exists.
- **Idempotent, and fails soft:** re-running does nothing. A failure on one collection (typically existing duplicate `id` values, which block building a unique index) is printed and the others still run; the exit code is 1 if anything failed. Changing an index definition later is a deliberate drop and recreate, not something the script does.
- **When to run it:** after the sandbox is created or reset, after the real database is recreated, and after adding a collection. A restore from a backup brings the indexes back with it (section 6.2), so a restore alone doesn't need it.
- **New collections:** the collection list in the script is another copy of `validCollections` (with `middleware.go` and `mcp/src/index.ts`). Adding a collection means adding it to all three; section 7 step 2 is the reminder. A shared list that all of them read (a JSON file, say) is a possible later cleanup and would touch the backend, the MCP and the script.

### 6.4 Generating content with Claude (review flow)

Agreed 2026-10-29. All four steps work for **sprites** ([Skills 4]); promoting anything that references other documents is not built ([Skills 6]).

1. **Create in the sandbox.** Claude writes through the sandbox MCP (`create_doc`, `replace_doc`), so everything is validated by the frontend's zod schemas. Each generated document gets an `id`.
2. **Review in the sandbox UI.** Claude lists the `id`s it made. You look at them in the sandbox UI (`pnpm dev:sandbox`, on :3001, running next to the normal dev server; section 6.0).
3. **Fix or approve.** A fix is Claude replacing the same sandbox document, so the reviewer judges the same item each time. Back to step 2.
4. **Promote.** Only the `id`s that were reviewed are copied into the real database, with `make promote-sprites` (below). Never "everything in the sandbox".

Why promotion is keyed on `id`: the server generates `_id` and strips any `_id` in a request, so a copied document always gets a new one, and `_id` can't link a sandbox document to its real twin.

- **Promotion is an upsert by `id`:** create it if the real database has no document with that `id`, otherwise replace that one. The unique index on `id` (section 6.3) turns an accidental duplicate into a `409`.
- **This makes `id` a cross-database key for promotion only.** Everywhere else it stays a display label (section 3.4).
- **`make promote-sprites IDS="STONE_WALL,GRASS"`** (`scripts/promote-sprites.ts`, run through the MCP's `tsx`) is a **dry run**: for each `id` it prints `CREATE`, `UPDATE` (with what differs: name, category, background, or how many pixels) or `unchanged`, and writes nothing. Add **`APPLY=1`** to write: it runs `make db-backup` first, then creates or replaces.
- **It refuses before writing anything** if an `id` isn't in the sandbox, is invalid against `spriteSchema`, matches more than one sprite on either side, or if the sandbox and real API addresses are the same. A failure part-way through a write stops and says how many were written; re-running is safe, because sprites already written show up as `unchanged`.
- **An update replaces the real sprite in place** and keeps its real `_id`, so anything referencing it keeps working. Read the dry run's `UPDATE` lines: a hand-imported sprite with the same `id` is overwritten by the sandbox's version.
- **The gate is the owner's go-ahead.** The script talks to the two APIs over HTTP, not through the MCP, so the real MCP's `create_doc` and `replace_doc` stay denied in `.claude/settings.json` and still guard the generic path. Claude runs the dry run, shows the plan, and runs `APPLY=1` only after an explicit approval. Don't add `make promote-sprites` to a permission allow list.
- The addresses come from `SANDBOX_API_URL` and `REAL_API_URL` (defaults `:8081` and `:8080`).
- **Sprites are the easy case:** they reference nothing. Defs reference sprites by `_id` and zones reference defs and tiles, so promoting those means rewriting references (sandbox `_id` to `id` to real `_id`) in dependency order. That is its own epic ([Skills 6]).

---

## 7. Adding a new entity (checklist)

1. Backend: decide the collection. A new kind of definition (a new `kind`) belongs in `tile_defs`, `items` or `entities`, so nothing changes in the backend. Only a genuinely new top-level type needs a new collection: add it to `validCollections` (`collection/middleware.go`) and to the collection table in section 3.1.
2. Mongo: if you added a **new collection**, add its name to `scripts/ensure-indexes.js` (the third copy of the collection list, see section 6.3) and run `make db-indexes` and `make sandbox-indexes`. For a new `kind` in an existing collection there is nothing to do.
3. Add the type to `lib/types` (keep it in sync with the game).
4. Add `schemas/<entity>Schema.ts` and export it.
5. Add `app/<entity>/` with `fields.ts`, `page.tsx`, `create/page.tsx`, `[id]/edit/page.tsx`, `layout.tsx`.
6. Add the URL to `URLS` and a link to `MainNavbar`.
7. Restart `pnpm dev` after creating a new route folder; Next does not always pick up new dynamic routes while running.

---

## 8. Known gaps

Things the code currently does that are worth a decision. Verified against the repo at the time of writing.

1. **Edit drops unmanaged fields.** `useEditRecord` submits only the form's values, and PUT replaces the whole document. Fields the form does not cover (`type`, `spriteCoords`, `encounterTableKey`) will be removed on the first edit. Merge the loaded document with the form values before sending.
2. **Edit page has empty config strings.** `redirectUrl: ''` and `errorLoadingMessage: ''` in `[id]/edit/page.tsx`, so a successful save or a failed load pushes to `''` rather than the list.
3. **No unique-index creation.** Nothing in the backend creates an index on `id`, so duplicate `id` values are possible and `ErrDuplicate` will not fire for them.
4. **Naming drift in the hooks.** The edit hook's `id` option is really the document `_id`, and its schema constraint (`z.ZodType<{ id: string }>`) refers to the user-facing `id`.
5. **Stale type.** `SaveResponse` in `collection.ts` is left over from the earlier upsert design and is unused.
6. **Hard-coded CORS origins** in `server.go`.
7. **Encounter rate validation** (0 to 1) is commented out in the tile schema.
8. **Shared types are copied by hand** between the tools and the game.
9. **Referential integrity.** Once zones reference tile `_id`s, deleting a tile that is in use will leave dangling references.
10. **`useCollection` has no create/delete awareness**; the list page relies on `refresh` after deletes.
11. **Two tile renderers.** _Resolved ([Debt 1])._ `TileGlyph` is now the only renderer, with a `card` variant (tile list and inspectors) and a `cell` variant (zone grid, pickers); `TileCell` is gone. The `card` base is still `bg-black` and the `cell` base `bg-slate-950`, kept as they were. Sprite support (section 4.5, Roadmap) now has one place to change.

Note from lead: This section is fine as-is for now. I did not want to overthink things nor get bogged down by rare conditions. As with any tech
project, there will be tech debt that gets addressed (or quickly forgotten) over time.

---

## 9. Roadmap (from the Trello board)

- Map/Zone Builder: grid editor using tile definitions as a palette, with name, danger level (bounded), start position (x/y inputs or pick from grid), and placements.
- Object and item definition builders, and the placements layer with interactions (see `DATA-MODEL.md`).
- Tile `type` / category and an indoor-outdoor style environment setting to choose default base tiles.
- Sprites in the tools: done. The builder (`sprites` collection, [Sprite 1]), picking a sprite on terrain, object and item defs ([Tools 17], [Tools 18]; portals wait for the portal builder), and `TileGlyph` drawing it ([Sprite 10]). Publishing sprites to the game, and the game's own update to match, come much later ([Sprite 8], [Sprite 9], [Game 6]).

---

## 10. Future ideas

Not planned work. Notes from design discussions, kept as a reference point for when they become relevant.

- **JSON export for the game.** The tools generate JSON files that the game loads, instead of the game calling the API. This matches how the game worked before the tools existed and means the editing backend never has to be deployed.
- **Player state in localStorage as a delta.** Store only what the player changed (completed event `_id`s, flags), keyed by zone `_id`, and apply it on top of the static exported data. Avoid copying whole zones into the browser: a copy would keep stale content after a re-export, while a delta picks up fixes automatically and keeps saves small. Stable `_id` keys are what make this work.
- **Before any deploy: split reads from writes.** The generic `/collection/{collection}` API allows open PUT/DELETE and must not be exposed publicly as-is. Either deploy read-only routes for game content (or skip the API entirely via JSON export) and keep writes local, or put the tools behind a single admin credential.
- **Player accounts are a separate concern** from protecting the tools: users, characters and saves are player-written data, likely in their own collections and routes, probably using a managed auth provider.
- **Data integrity, content versions and migrations.** Definitions change while zones and saves still refer to them: a tile or item is deleted, a custom slot is ticked on a def after it was placed, a stat is renamed. This is one problem seen from several places. Notes only, nothing is planned or decided except where marked:
  - **In the tools.** Known gap 9 and [Backend 5]. The owner constraints still hold: no soft deletes, and no "check the whole world" scan that blocks a delete.
    - **Decided 2026-10-30, for direct references** (a def's `spriteId`, and an interaction's `itemId` or SPAWN `defId`): a dedicated backend call ([Backend 5]) returns the first document that references a given `_id`. The delete modal calls it before deleting and warns, naming that one referrer ([Tools 20]); the MCP relays it as a read tool ([Infra 5]). It shows the first match only, with no count or list, so the designer deals with one thing at a time; deletes are meant to be a hassle. The DELETE route itself is unchanged for now.
    - **The backend owns the reference map** (which collection and field hold an `_id` of which collection). This is a deliberate exception to the dumb store: the frontend shapes the data, but MongoDB holds it, so the backend is the place that protects it once it's in. The map lists reference fields only; there is no POST/PUT validation and no second copy of the schemas. Like the collection allow-list, it needs updating when a schema gains a reference field.
    - **Not chosen:** the list filters (built for finding things, not for integrity, and they can't reach zones), and a separate store of all relationships (a second source of truth that can go stale). The earlier idea of an event processor on delete is dropped.
    - **Zones are separate and still open.** `terrain` (nested arrays) and `placements` (dynamic `"x,y"` keys) need their own design; the [Backend 5] endpoint is where it would land.
  - **Validation.** [Tools 16] adds a second angle: a zone validated last week is not necessarily valid after one of its defs changes, so a saved "validated" state can go stale without the zone being touched.
  - **If the game loads exported JSON** (see the first idea above) with player state in the browser, that state outlives the content it points at. It needs a **content/build version** stamped on the export and on every save, so the game can tell a save was made against older content and migrate it (or refuse it). Storing only a delta keyed by `_id` helps but doesn't remove the problem: a delta that names a placement `uid` or an interaction `id` that no longer exists is stale too.
  - **If the game runs client-server** with state in MongoDB, migrations run server-side next to the data. The schema-less store has no schema version to hang them on either, so the same version stamp is needed.
  - **Both routes need the same ingredients:** a version on content and on saves, stable ids (already there: `_id`, placement `uid`, interaction `id`), and a place for "when X changes, fix Y" (a migration, or an event on delete or update).
  - **Tracked, parked on purpose.** The Trello list "Backend: Data Integrity" holds an epic ([Integrity 1]) that collects the data types needing this treatment, each to become its own card when it actually bites: defs referenced by zones (terrain, objects, items), zone ids in portal destinations and edge exits, container contents, interaction `limit` counters keyed by (placement `uid`, interaction `id`), and custom slots on a def versus the values on its placements. The plan is to wait until a case causes real headaches before designing a fix; bulk data generation is the likeliest trigger.
  - Related: [Backend 5], [Tools 16], and the "Content delivery" open question in `DATA-MODEL.md`.
