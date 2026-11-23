# Handoff — Round 2

## Current state
Round 2 replaced the synthetic 10x10 grid with real downtown Chicago street
geometry (R1 changed, R6, R7). The explorable unit is now a real street
segment, not a grid cell. `cityData.js` exports `SEGMENTS` (400 real blocks),
plus decorative/reference-only data: `RIVER`, `LAKE_MICHIGAN_SHORELINE`,
`LAKE_MICHIGAN_BREAKWATERS`, `PARKS`, `LANDMARKS`, `STATIONS`,
`CTA_LINE_COLORS`, and `BOUNDS`.

The mapped area is the Loop and South Loop, bounded west at Canal St. It does
**not** reach Near West Side/UIC — R1's text originally claimed it did; that
was a documentation error, corrected in a later commit to match what was
actually built.

## How to run
- App: `node server.js`, then open the printed local URL.
- Tests: `npm test` (runs `node --test`).

## Decisions made this round and why
- `docs/decisions/0001-merge-street-segments-at-named-cross-streets.md`:
  the raw street-centerline dataset breaks at every node (including minor
  alleys); segments are merged into one per block between two *named* cross
  streets so every clickable segment matches a real, recognizable
  intersection. Grant Park's internal signed drives (Balbo, Congress, etc.)
  had to count as cross streets for Columbus Dr/Lake Shore Dr, or those two
  streets would merge into one block spanning the whole park.

## Anything unresolved / warnings for the next session
- **Process note**: this round's implementation commit (`c153cb8`) also
  included R8-R10 (Round 3's scope) before Round 3's requirements were
  written — out of order. Tests and decision records for R1/R6-R10 were
  added retroactively in a later commit (`020acfc`) to catch the repo up;
  R1's wording was also corrected (`44e8bae`). If you're picking this repo
  up for Round 4+, the history looks a little unusual around there — that's
  why.
- R7 (fixed scale, no pan/zoom) has no unit test by design — it's a rendering
  concern (the projection closes over the DOM `canvas` element), same
  exemption CLAUDE.md already applies to R1's Round 1 grayscale rendering.
- Click-to-explore now resolves to the *nearest segment* within a pixel
  threshold (point-to-polyline distance), not a grid lookup. Lives in
  `app.js`, not unit tested, consistent with the rest of the renderer.
