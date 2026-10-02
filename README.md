# Ragged Crown Tools

An internal data management and toolchain editor for the Ragged Crown RPG ecosystem. This repository contains the Go REST API backend and the Next.js (App Router) admin dashboard, orchestrated locally via Docker Compose and MongoDB.

---

## 🏗️ Architecture Overview

- **Backend (`/backend`)**: Go REST API utilizing Chi/Mux routers for handling RPG data schema, character generation rulesets, and content management endpoints.
- **Frontend (`/frontend`)**: Next.js 16 (React 19, TypeScript) application leveraging Tailwind CSS v4, Class Variance Authority (CVA), and semantic design tokens for modular UI components.
- **Database (`mongodb`)**: MongoDB instance storing non-relational document data (item catalogs, monster stats, spell schools, and template definitions).

---

## 🛠️ Stack & Tooling

- **Runtime & Package Manager**: Go 1.22+, Node.js (via `nvm`), `pnpm`
- **Frontend Specs**: Next.js 16, React 19, Tailwind CSS v4 (`@theme inline`), `cva`, `clsx`, `tailwind-merge`
- **Infrastructure**: Docker, Docker Compose, MongoDB 7.0

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Docker Desktop running
- `pnpm` installed globally
- Go 1.22+ (if running backend outside Docker)

### 1. Clone & Environment Setup

```bash
git clone https://github.com/your-username/ragged-crown-tools.git
cd ragged-crown-tools
```

Create a `.env` file in the project root if overriding default ports:

```env
PORT=8080
MONGO_URI=mongodb://root:example@localhost:27017/ragged_crown?authSource=admin
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 2. Run Infrastructure via Docker Compose

Spin up the MongoDB instance and local environment containers:

```bash
docker compose up -d
```

### 3. Frontend Setup

Navigate to the frontend workspace, install dependencies, and launch the development server:

```bash
cd frontend
pnpm install
pnpm dev
```

> **Note on Hot Module Replacement (HMR):** Next.js 16 uses Turbopack by default. If running inside nested subfolders on macOS, Webpack polling is configured via `--webpack` in `package.json` to ensure instantaneous Fast Refresh.

---

## 🎨 Design System Architecture

The frontend uses a strict separation of concerns for UI customization:

1. **Semantic Tokens (`globals.css`)**: Centralized `@theme inline` definitions map design system colors (e.g., `--color-nav-bg`, `--color-border-subtle`) directly into utility classes (`bg-nav-bg`, `border-border-subtle`).
2. **Variants (`cva`)**: Component states (`active`, `idle`, `variants`) are strictly managed using Class Variance Authority.
3. **Class Merging (`cn`)**: Utility function combining `clsx` and `tailwind-merge` to handle dynamic prop overrides safely.

---

## 📁 Repository Structure

```text
ragged-crown-tools/
├── backend/            # Go REST API service
│   ├── cmd/            # Application entrypoints
│   ├── internal/       # Core business logic, handlers, and Mongo models
│   └── Dockerfile
├── frontend/           # Next.js admin dashboard
│   ├── src/
│   │   ├── app/        # Next.js App Router pages & layouts
│   │   ├── components/ # CVA-backed UI primitives (Navbar, NavbarLink, etc.)
│   │   └── lib/        # Utility helpers (cn, API client)
│   ├── globals.css     # Tailwind v4 @theme inline tokens
│   └── package.json
├── docker-compose.yml  # Local stack orchestration
└── README.md
```

## Notes

There currently is no authentication system in place. I wanted to avoid this part for now since I'm the only
person working on the game assets which this application will produce for the game. So I am aware of the current
lack of authentication/authorization around the endpoints. I have code that I can re-use from previous projects
once I get further in and am moving to deploy this somewhere. Otherwise, I don't want friction at this stage.

---

## 📜 License

Internal toolchain developed for the Ragged Crown project. All rights reserved.
