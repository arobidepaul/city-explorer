# Handoff — Round 4

## Current state
Round 4 added pinning/rating on top of Round 3's map. Users can pin any
already-explored street segment as a "place" (R11), rate it 1-5 stars
(R12), change the rating or remove the pin entirely at any time (R13), and
all of that persists between sessions the same way exploration progress
already did (R14).

`cityState.js` gained `pins` (a `Map<id, { rating }>`) on top of the
existing `explored`/`start`, plus `pinPlace`/`unpinPlace`/`isPinned`/
`ratePlace`/`ratingFor`. `app.js` gained a `selectedId` (UI-only, not
persisted) set by clicking an already-explored segment, and a panel below
the canvas (`#placePanel` in `index.html`) with pin/star/unpin controls for
whichever segment is selected. Pinned segments get a small gold marker
drawn in the same final layer as landmark dots and station markers.

Added after the initial R11-R14 build (same session, user-requested
follow-up, not a numbered requirement): a "My places" list (`#placesList`)
below the map, backed by a new `pinnedPlaces(state)` helper in
`cityState.js` that returns pinned places sorted highest-rated first,
unrated last. Clicking an entry in the list selects it, same as clicking
it on the map would.

## How to run
- App: `node server.js`, then open the printed local URL.
- Tests: `npm test` (runs `node --test`).

## Decisions made this round and why
- `docs/decisions/0003-pin-and-rate-are-separate-actions.md`: pinning and
  rating are two separate calls/actions rather than one combined "pin with
  a rating" step, so a user can pin a place to remember it without
  committing to a score right away, and so changing a rating later (R13)
  is the same code path as setting it the first time.

## Anything unresolved / warnings for the next session
- Clicking an already-explored segment now **selects** it instead of
  re-marking it explored (the latter was already a silent no-op, so this
  doesn't change exploration behavior, just gives that click a purpose).
  If a future round wants explored segments to do something else on
  click, it'll need to coexist with this selection behavior.
- `selectedId` is deliberately UI-only state in `app.js`, not part of
  `cityState`'s persisted shape — same treatment as the projection math
  from R7. It resets to `null` implicitly on page reload (nothing is
  selected until the user clicks something), which is intentional.
- Verified the full pin/rate/reload/re-rate/unpin flow end-to-end in a
  real headless-Chromium browser session (not just `node --test`) against
  `node server.js`, including a reload in between to confirm
  `localStorage` persistence actually round-trips through the UI, not
  just through `serializeState`/`deserializeState` directly.
