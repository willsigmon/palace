# PALACE decision memo

_Date: April 6, 2026_

## 1. Canonical surface strategy

**Call:** Web is the canonical PALACE product. Native shells follow it.

**Why:**
- The web app is where routing, data fetching, search, graph, ask, and voice already converge.
- Keeping product logic in multiple surfaces creates drift faster than it creates value.
- iOS native, macOS, Capacitor, and Tauri still matter, but as packaging layers and platform adapters.

**Rule:**
- New feature logic starts in web unless a platform API forces a native implementation.

## 2. Canonical voice experience

**Call:** The hook-based Marlin flow is the only canonical web voice path.

**Why:**
- It removes duplicate state machines.
- It gives one place to manage recording, upload, latency timings, and error handling.
- It keeps `/ask` and dedicated voice entry points aligned instead of drifting.

**Rule:**
- Voice changes go through `src/hooks/use-marlin-voice.ts` and `src/lib/marlin.ts`.
- Do not reintroduce parallel web voice components that talk to Marlin independently.

## 3. Graph scope

**Call:** Graph is **experimental**, not core.

**Why:**
- It is valuable as an exploration surface, but it is not yet the main path for getting work done in PALACE.
- Stream, ask, people, and search are the core workflows today.
- The typed D3 adapter is worth keeping healthy, but graph expansion should wait for clear product pull.

**Rule:**
- Maintain graph quality and type safety.
- Do not prioritize major graph feature work ahead of stabilization or core retrieval flows.
