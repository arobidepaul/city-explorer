# Spec

## Round 1 (covers R1-R5)

### City model
The city is a grid of blocks, `ROWS` x `COLS` (10x10), inspired by Chicago's numbered grid. Each block sits at the intersection of a north-south street and an east-west street, taken from two fixed name lists in `cityData.js` (real Chicago street names). A block's id is `"row,col"`.

### R1 - Grayscale map
`app.js` draws the grid on a `<canvas>`. Unexplored blocks are filled with a gray shade. This is rendering only; not unit tested.

### R2 - Starting location
The user clicks a block before any exploration has happened. `setStartLocation(state, blockId)` records it and also marks that block explored (you start standing somewhere, so it's visible). Can only be set once per game; later clicks on it are a no-op.

### R3 - Mark explored / reveal in color
`markExplored(state, blockId)` adds a block id to `state.explored` (a Set). `app.js` colors explored blocks instead of gray.

### R4 - Street names on explored areas
`streetNamesFor(blockId)` looks up the two cross-street names for a block id from the name lists. The renderer only labels blocks that are in `state.explored`.

### R5 - Save/load between sessions
`serializeState(state)` turns `{ explored: Set, start: string|null }` into a JSON string. `deserializeState(json)` reverses it. `app.js` persists to `localStorage` on every change and loads from it on page load. No server-side storage needed since this runs as a single local page.

### Out of scope for Round 1
Real map data, multiple cities, scoring, favorites/tagging of places (mentioned in problem.md's motivation, not yet a numbered requirement).
