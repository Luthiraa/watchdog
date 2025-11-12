# Repository Guidelines

## Project Structure & Module Organization
Watchdog is a Next.js 15 workspace rooted in `app/`. UI routes live in `app/(segment)/page.tsx`, server handlers in `app/api/*/route.ts`, and shared providers/styles in `app/layout.tsx`, `app/providers.tsx`, and `app/globals.css`. Reusable UI primitives sit under `components/ui`, while domain helpers (`lib/weaviate.ts`, `lib/utils.ts`) centralize data-access logic. Static assets belong in `public/`, and operational scripts (schema setup, diagnosis, sample data) live in `scripts/`. TypeScript, ESLint, Tailwind, and Next configs remain in the repo root for quick reference.

## Build, Test, and Development Commands
- `npm run dev`: Start the Turbopack dev server at `http://localhost:3000` with hot reload.
- `npm run build`: Create the production bundle; run before releasing to verify server components.
- `npm run start`: Serve the production build locally.
- `npm run lint`: Execute the Next.js ESLint suite (core-web-vitals + TypeScript) and keep it green pre-commit.
- `npm run init-weaviate`: Provision Weaviate classes defined in `scripts/init-weaviate.ts`.
- `npm run status`: Ping Google OAuth, NextAuth, and Weaviate endpoints for a fast smoke test.
- `npm run cleanup-logins` / `npm run query-users`: Housekeeping scripts for auth state—run only with valid creds loaded via `.env.local`.

## Coding Style & Naming Conventions
Use TypeScript + React function components; prefer server components unless interactivity requires `"use client"`. Keep indentation at two spaces, omit semicolons, and favor single quotes for object literals to match existing files. Components use `PascalCase` (`WatchdogHero`), route folders use lowercase/kebab (`app/search`), and shared utilities stay in `lib/*.ts`. Tailwind utility-first styling is the default; co-locate bespoke class names (such as `pixel-*`) inside `app/globals.css` or `app/fonts.ts`. Run `npm run lint` after significant changes and avoid disabling rules without inline justification.

## Testing Guidelines
There is no dedicated `npm test` yet, so rely on linting plus targeted script runs until a suite lands. When adding tests, place component specs next to the feature (`app/search/__tests__/Results.test.tsx`) and integration flows under `e2e/`. Prefer `@testing-library/react` (add it as a dev dependency) for UI behavior and mock Weaviate interactions via the helpers in `lib/weaviate.ts` to keep tests hermetic. Cover new mutations, auth guards, and cleanup scripts, and document any manual verification in PR descriptions.

## Commit & Pull Request Guidelines
History favors short, present-tense summaries (`added auth`, `extension ui update`). Follow that style: ≤50 characters, imperative voice, and scope-by-scope commits (UI, auth, scripts). Reference tickets via `[#123]` when applicable. Pull requests should include the problem statement, bullet list of changes, screenshots/GIFs for UI adjustments, env or data migration steps, and which scripts reviewers must run (e.g., `npm run init-weaviate`). Ensure `npm run lint` and `npm run build` succeed locally before requesting review.

## Security & Configuration Tips
Secrets stay in `.env.local`; seed it from `.env.local.example` and never commit the file. Use least-privilege Google OAuth and Weaviate keys, and rotate them if `scripts/reset-schema.ts` or other stateful scripts are executed. Run schema-altering scripts only against the intended cluster and callouts in the PR. Always derive `userId` from the authenticated NextAuth session on the server—never trust client-provided identifiers when writing via `lib/weaviate.ts`.
