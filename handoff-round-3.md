# Handoff — Round 3

## Current state
Round 3 added orientation reference data on top of Round 2's real street map:
real landmarks (R8), real CTA 'L' stations color-coded by line (R9), and real
park spaces filled in (R10). All three are decorative/reference-only — not
explorable, no `id`, invisible to click hit-testing and exploration state.
Data lives in `cityData.js` as `LANDMARKS`, `STATIONS`, `CTA_LINE_COLORS`, and
`PARKS`; rendering lives in `app.js`.

## How to run
- App: `node server.js`, then open the printed local URL.
- Tests: `npm test` (runs `node --test`).

## Decisions made this round and why
- `docs/decisions/0002-curate-landmarks-by-hand.md`: the City of Chicago's
  "Individual Landmarks" dataset has far more officially-designated entries
  than a typical visitor would recognize. Landmarks shown are hand-curated
  down to a short, widely-recognizable list rather than every official entry,
  to avoid clutter at the cost of leaving some real landmarks off the map.

## Anything unresolved / warnings for the next session
- **Process note, same as Round 2's handoff**: this round's code was actually
  implemented together with Round 2's, in the same commit (`c153cb8`), before
  Round 3's requirements existed in `problem.md`. Tests and the decision
  record above were added retroactively (`020acfc`) to catch the repo up to
  where it should have been. If the next round's build order looks normal
  again, that's because this was a one-time catch-up, not the new pattern.
- Landmarks and stations are **not** strictly filtered to `BOUNDS` — e.g.
  Merchandise Mart (a station) sits slightly north of `BOUNDS.maxLat`. Don't
  assume every reference point lies inside the exact bounding rectangle used
  for street segments; the tests for R8/R9 deliberately don't assert
  bounds-containment for this reason.
- Canvas drawing has no z-index, only paint order. Landmark/station dots are
  guaranteed to stay on top of labels via a two-pass approach: reserve space
  around every dot in `placedLabelRects` *before* placing any street label,
  then draw the dots/markers themselves in one final pass after every label.
  Keep that ordering if you touch the renderer.
