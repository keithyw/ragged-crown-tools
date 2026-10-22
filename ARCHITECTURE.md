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

`{collection}` must be in the allow-list in `collection/middleware.go`; otherwise `404`. **This list is the one backend change needed for each new entity type.**

The allow-list matches `DATA-MODEL.md`. The backend stays schema-less: it doesn't validate document contents and doesn't know what `kind` means.

| Collection  | Holds                                                                                  |
| ----------- | -------------------------------------------------------------------------------------- |
| `tile_defs` | Terrain definitions (`kind: 'terrain'`)                                                |
| `items`     | Item definitions (`kind: 'item'`)                                                      |
| `entities`  | Object, creature and portal definitions, told apart by `kind`; list with `?kind=`      |
| `zones`     | Zones (terrain grid, placements, exits)                                                |
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

Note: I did run a command to add an index but there is no base code to keep such a thing up to date in the way a migration file is used. At this point, I
consider this adequate since the game isn't large.

### 3.5 Other

- CORS allows `http://localhost:3000` and `http://127.0.0.1:3000` (hard-coded in `server.go`).
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

The list is a visual grid (`TileCard` + `TileGlyph`) rather than a data table, because tiles are visual. Interaction model: click selects, the right-hand inspector (`TileInspector`) shows details and Edit/Delete, double-click opens edit. The inspector column is reserved and `sticky`, so selecting never reflows the grid. `TileGlyph` is the single place that will change when sprites arrive.

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

Makefile targets: `build`, `docker-up`, `docker-down`, `docker-restart`, `rc-build`, `rc-down`, `rc-restart` (the `rc-*` ones act on the API container only).

Verification: use `pnpm exec tsc --noEmit` in `frontend/` as the source of truth for types. Editor squiggles in a monorepo can be stale TS-server project issues rather than real errors.

### 6.1 MCP server (`mcp/`)

A small local tool that lets Claude read the data in the database through the API. It is a client of the Go API over HTTP and never connects to MongoDB itself. It is **read-only by design**: GET only, no create, PUT or DELETE (PUT replaces whole documents, see Known gap 1). Tracked on the Trello list "Infrastructure" ([Infra 1] to [Infra 5]), including the planned sandbox stack, backups and integrity checks.

| Tool              | Calls                                | Notes                                                                                                                                           |
| ----------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `list_collection` | `GET /collection/{collection}`       | Optional `filters` (string equality, array = "any of"), `sort`, `limit`, `offset`. Returns `total` (from `X-Total-Count`), `returned`, `items`. |
| `get_doc`         | `GET /collection/{collection}/{_id}` | Takes the Mongo `_id` (24 hex characters), not the user-facing `id`.                                                                            |

- Code is one file, `mcp/src/index.ts`. The collection names are a copy of the backend allow-list (`middleware.go`); add a new collection to both.
- The API address comes from `RC_API_URL` (default `http://localhost:8080`). A future sandbox API would be another value here.
- No build step: Node runs the `.ts` file directly with `--experimental-strip-types` (hence `erasableSyntaxOnly` in `tsconfig.json`: no enums or other non-erasable syntax). `.mcp.json` launches it with plain `node`, which is whichever Node is first on the PATH (22.6+ needed).
- Formatting uses the frontend's Prettier config: `cd frontend && pnpm exec prettier --config .prettierrc.cjs --write ../mcp/src/index.ts`.
- Local only. The API has no auth, so this must not be exposed beyond localhost (see section 10, "Before any deploy").

```bash
cd mcp
pnpm install
pnpm typecheck    # tsc --noEmit
pnpm start        # speaks MCP over stdio; normally launched by Claude Code, not by hand
```

Claude Code reads `.mcp.json` when a session starts and asks for approval of a project server the first time; `/mcp` shows its status. The API must be running (`make docker-up`) or the tools return "Cannot reach the API".

---

## 7. Adding a new entity (checklist)

1. Backend: decide the collection. A new kind of definition (a new `kind`) belongs in `tile_defs`, `items` or `entities`, so nothing changes in the backend. Only a genuinely new top-level type needs a new collection: add it to `validCollections` (`collection/middleware.go`) and to the collection table in section 3.1.
2. Mongo: create a unique index on the user-facing `id`, if the entity has one.
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
11. **Two tile renderers.** `TileGlyph` (tile list and inspector) and `TileCell` (zone grid, tile picker) render the same symbol/bg/color stack separately and have drifted (base `bg-black` vs `bg-slate-950`, rounded vs square, `text-2xl` vs `text-xl`, only `TileCell` has a missing-tile fallback). Sprite support (section 4.5, Roadmap) would need changes in both.

Note from lead: This section is fine as-is for now. I did not want to overthink things nor get bogged down by rare conditions. As with any tech
project, there will be tech debt that gets addressed (or quickly forgotten) over time.

---

## 9. Roadmap (from the Trello board)

- Map/Zone Builder: grid editor using tile definitions as a palette, with name, danger level (bounded), start position (x/y inputs or pick from grid), and placements.
- Object and item definition builders, and the placements layer with interactions (see `DATA-MODEL.md`).
- Tile `type` / category and an indoor-outdoor style environment setting to choose default base tiles.
- Sprite support in `TileGlyph` (`spriteCoords`).

---

## 10. Future ideas

Not planned work. Notes from design discussions, kept as a reference point for when they become relevant.

- **JSON export for the game.** The tools generate JSON files that the game loads, instead of the game calling the API. This matches how the game worked before the tools existed and means the editing backend never has to be deployed.
- **Player state in localStorage as a delta.** Store only what the player changed (completed event `_id`s, flags), keyed by zone `_id`, and apply it on top of the static exported data. Avoid copying whole zones into the browser: a copy would keep stale content after a re-export, while a delta picks up fixes automatically and keeps saves small. Stable `_id` keys are what make this work.
- **Before any deploy: split reads from writes.** The generic `/collection/{collection}` API allows open PUT/DELETE and must not be exposed publicly as-is. Either deploy read-only routes for game content (or skip the API entirely via JSON export) and keep writes local, or put the tools behind a single admin credential.
- **Player accounts are a separate concern** from protecting the tools: users, characters and saves are player-written data, likely in their own collections and routes, probably using a managed auth provider.
- **Data integrity, content versions and migrations.** Definitions change while zones and saves still refer to them: a tile or item is deleted, a custom slot is ticked on a def after it was placed, a stat is renamed. This is one problem seen from several places. Notes only, nothing is planned or decided:
  - **In the tools.** Known gap 9 and [Backend 5] (deleting a def that zones use). Its owner constraints still hold: no soft deletes, no "check the whole world" scan that blocks a delete, and eventually a backend step that runs when a delete happens (an event processor of some kind), since MongoDB has no foreign keys. [Tools 16] adds a second angle: a zone validated last week is not necessarily valid after one of its defs changes, so a saved "validated" state can go stale without the zone being touched.
  - **If the game loads exported JSON** (see the first idea above) with player state in the browser, that state outlives the content it points at. It needs a **content/build version** stamped on the export and on every save, so the game can tell a save was made against older content and migrate it (or refuse it). Storing only a delta keyed by `_id` helps but doesn't remove the problem: a delta that names a placement `uid` or an interaction `id` that no longer exists is stale too.
  - **If the game runs client-server** with state in MongoDB, migrations run server-side next to the data. The schema-less store has no schema version to hang them on either, so the same version stamp is needed.
  - **Both routes need the same ingredients:** a version on content and on saves, stable ids (already there: `_id`, placement `uid`, interaction `id`), and a place for "when X changes, fix Y" (a migration, or an event on delete or update).
  - **Tracked, parked on purpose.** The Trello list "Backend: Data Integrity" holds an epic ([Integrity 1]) that collects the data types needing this treatment, each to become its own card when it actually bites: defs referenced by zones (terrain, objects, items), zone ids in portal destinations and edge exits, container contents, interaction `limit` counters keyed by (placement `uid`, interaction `id`), and custom slots on a def versus the values on its placements. The plan is to wait until a case causes real headaches before designing a fix; bulk data generation is the likeliest trigger.
  - Related: [Backend 5], [Tools 16], and the "Content delivery" open question in `DATA-MODEL.md`.
