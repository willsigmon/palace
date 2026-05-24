# PALACE design contract

_Updated: May 15, 2026_

## Product call

PALACE should feel like a calm personal command center, not a data warehouse.
The daily path is:

1. **WSIG** — ask in plain language
2. **Search** — direct lookup across the archive
3. **Timeline** — recent captured context
4. **Actions** — promises and follow-through
5. **More** — deeper exploration surfaces

People, graph, media, map, insights, and verticals remain available, but they are
not primary mobile navigation. This protects the out-and-about experience from
feeling like an admin dashboard.

## Aesthetic

**Warm noir command palette:** deep navy-black, soft glass panels, quiet amber
accent, large editorial type only where it helps hierarchy. The interface should
feel focused, premium, and forgiving.

## Visual rules

- Prefer fewer, larger decisions over many equal-weight links.
- Use rounded 2xl cards for choice surfaces.
- Use one accent per screen, not rainbow category noise unless category is the
  point of the screen.
- Keep mobile bottom navigation to five items.
- Hide novelty/exploration affordances from mobile primary UI.
- Motion should be small: opacity, subtle lift, or existing ambient drift.
- Empty states should tell the user what to do next, not just report absence.

## Implementation notes

- Primary navigation lives in `src/lib/constants.ts`.
- Mobile navigation intentionally differs from desktop: mobile uses WSIG,
  Search, Timeline, Actions, More.
- The `/more` page is the access point for exploratory routes.
- WSIG text and voice should share Marlin session context where possible.
- The `/` WSIG surface includes a compact command brief fed by stats, latest
  capture, open actions, and digest context. Keep it glanceable; mobile should
  not duplicate the bottom nav with extra shortcut cards.
- Browser-side archive reads and writes should go through the local
  `/api/wsig/*` proxy, and browser health indicators should use
  `/api/runtime-health`, so CORS or upstream status noise does not erode trust
  in the UI.
- Graph/stats surfaces must tolerate partial API payloads.
