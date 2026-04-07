# PALACE

PALACE is the client for a personal memory archive built on top of the wsigomi API and Marlin voice services.

This repo is now organized around one rule: **the web app is the product, and the native apps are wrappers around that product**.

## What lives here

- `src/` — canonical Next.js 16 / React 19 web client
- `ios-native/` — native iOS shell plus a few native-only integrations
- `macos/` — macOS WebKit wrapper
- `ios/` + `capacitor.config.ts` — Capacitor wrapper for web delivery on iOS
- `src-tauri/` — Tauri wrapper for desktop packaging
- `docs/` — roadmap and product decisions

## Stability rules

- `http://localhost:3000` is the canonical dev origin
- `https://api.wsig.me` and `https://marlin.sigflix.stream` are treated as fixed external dependencies in this repo
- the TypeScript API client is the only wsig fetch boundary
- the Marlin hook is the only canonical web voice path
- new feature work stays frozen until the verification baseline stays green

## Runtime configuration

Copy `.env.example` to `.env.local` and fill in the values you need.

### Web env vars

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_WEB_ORIGIN` | Canonical web origin used by runtime config | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | wsigomi API base URL | `https://api.wsig.me` |
| `NEXT_PUBLIC_MARLIN_URL` | Marlin voice base URL | `https://marlin.sigflix.stream` |
| `NEXT_PUBLIC_API_TOKEN` | Bearer token for browser-side requests to wsigomi | unset |
| `API_TOKEN` | Server-side fallback token for route handlers / server code | unset |

### Native wrapper env vars

| Surface | Variable | Purpose |
| --- | --- | --- |
| iOS native | `PALACE_API_URL` | Override wsig API base URL |
| iOS native / macOS | `PALACE_MARLIN_URL` | Override Marlin base URL |
| macOS / Capacitor | `PALACE_WEB_URL` | Override wrapped web app URL |
| Capacitor | `CAPACITOR_SERVER_URL` | Explicit wrapper web URL override |

If you do nothing, PALACE defaults to local web on `localhost:3000` in development and the current hosted production web app in release wrappers.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification commands

### Web

```bash
npm run lint
npm run typecheck
npm run build
```

### Native

```bash
xcodebuild -project ios-native/PALACE.xcodeproj -scheme PALACE -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
swift build --package-path macos
cargo check --manifest-path src-tauri/Cargo.toml
```

### Combined

```bash
npm run verify:web
npm run verify:native
npm run verify:all
```

## Architecture notes

### Shared runtime boundary

- `src/lib/runtime-config.ts` defines the public runtime config interface
- `src/lib/api.ts` is the only wsig API client boundary
- `src/lib/marlin.ts` is the only Marlin client boundary

Do not add page-level `API_URL` constants or ad hoc `fetch()` calls to wsig or Marlin endpoints.

### Canonical web voice path

Use `src/hooks/use-marlin-voice.ts`.

If voice UX changes, update the shared hook and the web UI that consumes it. Do not introduce a second web-only voice implementation.

### Surface ownership

- **Web** owns product behavior, layout, routing, data fetching, and voice UX
- **Native wrappers** own packaging, platform permissions, windowing, and small bridge concerns only
- if a wrapper starts drifting into its own product logic, pull that logic back to web unless the platform requires otherwise

## Smoke checklist

When making stabilization changes, verify these flows before calling the repo healthy:

- ask with Marlin voice
- timeline to conversation detail
- people search
- graph load
- vault stats / discovery
- voice start and stop
- macOS wrapper load and voice navigation
- Tauri build/startup path

## Current decision baseline

See [`docs/decision-memo.md`](docs/decision-memo.md) for the current calls on surface ownership, voice, and graph scope.
