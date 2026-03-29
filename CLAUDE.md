@AGENTS.md

# PALACE — Personal AI Life Archive & Cognitive Explorer

## Overview
Frontend for wsigomi personal knowledge system. Cinematic "Warm Noir" interface for browsing 125k+ memories, 898+ conversations, 2k+ people.

## Tech Stack
- Next.js 16.2, React 19, TypeScript strict
- Tailwind 4 with custom PALACE design tokens
- GSAP + Motion 12 for animations
- D3.js for graph visualizations (Phase 3)
- Zustand for client state

## Architecture
- Feature-organized: `src/components/{stream,search,graph,insights,layout,ui}`
- API client: `src/lib/api.ts` — typed wrapper for wsigomi REST (api.wsig.me)
- Types: `src/types/api.ts` — mirrors omi.db + enrichment.db schema
- Store: `src/stores/app-store.ts` — Zustand for UI state

## Backend
- wsigomi REST API at `https://api.wsig.me` (port 8422 on sigstudio)
- SQLite + FTS5, 12 REST endpoints
- Auth: Bearer token in `API_TOKEN` env var

## Design System ("Warm Noir")
- Dark-first: `--color-void` (deep blue-black) through `--color-text` (warm linen)
- Accent: warm orange → hot pink gradient
- Typography: Instrument Serif (editorial), Inter (body), Geist Mono (data)
- All sizes fluid via clamp()
- Glassmorphism on overlays, ambient gradient orbs on background

## Rules
- Immutable data — never mutate arrays/objects
- 800 line file limit, prefer 200-400
- No hardcoded values — use constants.ts
- Feature-organized, not type-organized
