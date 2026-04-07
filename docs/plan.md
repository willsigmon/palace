# PALACE plan

## Current baseline

As of April 6, 2026:

- web lint, typecheck, and build are green
- iOS native build is green
- macOS `swift build` is green
- Tauri `cargo check` is green
- runtime config, API access, and Marlin access have been consolidated
- web is the canonical product surface

The job now is to **keep the baseline green and stop wrapper drift**.

## Now

1. **Protect the green baseline**
   - keep `npm run verify:all` green
   - treat lint regressions as blocking
   - keep docs current with real setup and runtime assumptions

2. **Keep one config and data boundary**
   - all wsig access goes through `src/lib/api.ts`
   - all Marlin access goes through `src/lib/marlin.ts`
   - all public endpoint defaults live in `src/lib/runtime-config.ts`

3. **Keep web as the source of truth**
   - web owns UX, feature logic, and route structure
   - native shells should only adapt packaging and platform permissions
   - do not fork product logic into iOS/macOS/Tauri/Capacitor without a hard platform reason

4. **Finish smoke coverage for critical flows**
   - ask + voice
   - timeline → conversation detail
   - people search
   - graph load
   - vault discovery

5. **Freeze feature creep**
   - no speculative feature additions until stabilization holds for a few edit cycles

## Next

1. **Add repeatable smoke automation**
   - browser-driven checks for the main web flows
   - a lightweight wrapper verification checklist for macOS and Tauri

2. **Tighten native wrapper ergonomics**
   - centralize wrapper env docs
   - keep health checks and endpoint naming aligned with web runtime config
   - only add native behavior when the platform truly needs it

3. **Harden fallback UX**
   - make loading, degraded, and failed states more consistent across routes
   - standardize empty states where the API returns partial or missing data

## Later

1. **Promote or demote Graph intentionally**
   - keep the typed D3 adapter healthy
   - only invest further if graph usage proves product value

2. **Expand product features after stabilization**
   - richer synthesis / insight surfaces
   - better digests / notifications
   - deeper relationship workflows

3. **Consider deeper native affordances**
   - only after the web product is stable and clearly constrained by wrapper limitations
