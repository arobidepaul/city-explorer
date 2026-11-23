# Handoff — Round 7

## Current state
Round 7 added one requirement, R20: the user can revert an explored
segment back to unexplored, as long as it isn't the start location and
isn't currently pinned.

`cityState.js` gained `unexploreSegment(state, id)`, which removes `id`
from `state.explored`. It's a no-op in three cases: `id` isn't
explored, `id` is `state.start`, or `id` is pinned (`state.pins.has(id)`).
No other `cityState.js` function changed -- a pinned place still has to
go through the existing `unpinPlace` (R13) before it can be
un-explored, so a pin's rating/category can never disappear out from
under it implicitly.

`app.js`'s pin/rate/unpin panel gained an "Un-explore this street"
button, placed right after "Pin this place." It only appears for a
selection that's unpinned and isn't `state.start` -- the same two
conditions `unexploreSegment` itself checks, so the button simply
doesn't render rather than appearing and silently no-op'ing if clicked.
Clicking it calls `unexploreSegment`, clears `selectedId` back to
`null` (same as the existing unpin flow), and re-renders; the segment
goes back to its gray unexplored fill and loses its label.

## How to run
- App: `node server.js`, then open the printed local URL.
- Tests: `npm test` (runs `node --test`).

## Decisions made this round and why
No new decision record. Every behavioral choice (the three no-op
conditions, hiding rather than disabling the button) is a direct
restatement of what R20 itself specifies, the same way R18 needed no
decision record last round.

## Verified this round
- `npm test`: 44 passing (up from 39), including four new R20 tests:
  reverting an explored segment, a no-op on an already-unexplored one,
  the start location being un-explorable, and a pinned place being
  un-explorable until unpinned.
- A real headless-browser pass (Playwright via `npx`, same tool as
  Round 6): seeded `localStorage` with a start location, an explored
  unpinned segment, and an explored pinned segment; drove real canvas
  clicks (projected lon/lat to canvas pixels using the same formula
  `app.js` uses) to confirm the unpinned/non-start segment shows
  "Un-explore this street" while the pinned segment and the start
  location both don't; clicked it on the eligible segment and
  confirmed it actually reverted to unexplored and the panel closed.
  No console/page errors.
- Caught a bug in the *test harness*, not the app: the default
  Playwright viewport (1280x720) is shorter than the 720px-tall canvas
  plus the page's heading/status text above it, so a click computed
  for a point near the bottom of the canvas landed below the fold and
  silently did nothing, leaving the previous selection's panel on
  screen and looking like a wrong segment got selected. Fixed by
  widening the test's viewport; no app code was at fault.

## Anything unresolved / warnings for the next session
- Un-exploring a segment doesn't touch `pins` at all (can't, since a
  pinned segment is blocked from un-exploring in the first place) --
  there's no decision to make there, just confirming the invariant
  holds.
- If a future round wants pins to survive their segment becoming
  unexplored again (e.g. "remembered favorites" independent of
  exploration), that would mean relaxing R20's own wording, not just
  an `app.js`/`cityState.js` change -- flag it back to problem.md
  first.
