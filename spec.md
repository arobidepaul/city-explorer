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

## Round 2 (covers R1 changed, R6, R7)

### City model
The synthetic 10x10 grid is gone. The explorable unit is now a real street segment: the stretch of an actual downtown Chicago street between two real cross streets. `cityData.js` exports `SEGMENTS`, an array of `{ id, street, crossFrom, crossTo, coords }`, where `coords` is a `[lon, lat]` polyline and `id` is the segment's own stable id from the source data. `segmentById(id)` / `streetNamesFor(id)` look a segment up by id.

### R6 - Real street-centerline data, bundled locally
`SEGMENTS` was built once from the City of Chicago's open data portal (data.cityofchicago.org, "Street Center Lines" dataset, Socrata resource id `pr57-gg9e`), filtered to a bounding box weighted toward the Loop proper (east through Grant Park to Lake Shore Dr and the Lake Michigan shoreline, north to roughly Wacker Dr, south to Roosevelt Rd, west only as far as Canal St). The west edge deliberately stops at Canal St rather than continuing to Clinton/Halsted, so the map favors the Loop and Michigan Ave/Grant Park corridor over the Near West Side, while still keeping Union Station (on Canal St) on the map.

Rather than a curated handful of arterials, the street whitelist covers *every* real named street the source data has inside that bounding box -- main streets, alleys, numbered South Loop streets, the lot -- excluding only expressway ramps/interchange connectors and lower-level duplicates of a street already mapped at surface level (Wacker Lower, Randolph Lower, Wacker Ramp). Lake Shore Dr is a divided road in the source data (separate northbound/southbound carriageways) and is kept here as two parallel streets, same as real life, running right along the shoreline instead of leaving empty space between Grant Park and the water.

The raw dataset breaks each street at every real-world node, including minor alleys/courts, which produced visually confusing mid-block "breaks" with no drawn cross street. Those sub-block pieces are merged (by shared node ids) into one segment per block between two *named* cross streets, so every clickable segment corresponds to a visible intersection on the map. For Columbus Dr and Lake Shore Dr specifically, "named cross streets" also includes Grant Park's own signed drives (Balbo, Congress, Jackson, Monroe, Roosevelt Dr) even though they are not themselves explorable streets -- without that, those two streets would merge straight through all of them into one unrealistic block spanning the entire park. The result — 400 real city blocks — is committed as static data in `cityData.js`. The app never calls a live API; this matches CLAUDE.md's "no API keys, no live services" rule the same way Round 1's bundled street-name lists did.

### Decorative: Lake Michigan
`cityData.js` also exports `LAKE_MICHIGAN_SHORELINE`, a real slice of Chicago's own open-data shoreline polygon ("Hydro" dataset, Socrata resource id `knfe-65pw` -- by far the largest polygon in that dataset, easily distinguished from every lagoon and pond by its shape area). `app.js` fills everything east of that line, out past the edge of the canvas, as water -- drawn first, as the bottom-most layer, so the river and every street draw on top of it the same way they draw on top of the land.

### R1 (changed) - Real street layout, grayscale until explored
`app.js` strokes each segment's real polyline on the canvas instead of filling a uniform grid cell. Unexplored segments are gray; explored segments are colored, same as Round 1's grid cells.

### R7 - Fixed scale, no pan/zoom
`app.js` computes one projection from `BOUNDS` (the data's lon/lat bounding box) to canvas pixels on load: an equirectangular projection corrected for longitude compression at this latitude (`cos(avgLat)`), scaled uniformly so the entire bounding box fits inside the fixed-size canvas with padding. There are no pan or zoom controls or transforms applied after that. This is rendering/layout only (the projection is a closure over the DOM `canvas` element, same as the rest of `app.js`); not unit tested, same as R1's Round 1 note.

### R4, revisited - Street names on explored segments
`streetNamesFor(id)` now returns `{ street, crossFrom, crossTo }` for a segment instead of two grid-derived cross streets. `app.js` only labels explored segments, same as Round 1.

### Click handling
Because segments are thin lines rather than filled cells, a click is resolved to the nearest segment (point-to-polyline distance) within a small pixel threshold, rather than a grid-cell lookup. This lives in `app.js` and is not unit tested, consistent with the rest of the renderer.

### Decorative: dead ends
A few of our named streets genuinely stop partway through our mapped area in real life (e.g. W Polk St, interrupted near the old LaSalle Street Station rail corridor and again near Halsted/Desplaines). Each `SEGMENTS` entry carries `deadEndFrom`/`deadEndTo`, true only when the source data itself tags that end a literal dead end -- not when it simply runs into an untracked alley or our map's edge. `app.js` draws a short perpendicular tick across the road at any such end, always (not just once explored), so it reads as "the street really stops here" rather than a rendering glitch.

### Decorative: the Chicago River
`cityData.js` also exports `RIVER`, a set of polylines for the Chicago River's main stem and south branch, from the same dataset and bounding area as `SEGMENTS`. It is drawn once, beneath the streets, purely so the map reads like a real place (and explains the diagonal jog in the street grid, which is the real grid bending around the river bend). It is not explorable and carries no id, so it is invisible to click hit-testing and exploration state.

### Out of scope for Round 2
Street connectivity/adjacency constraints on exploration order, multiple cities, labeling rotated to match street angle.

### R10 - Park spaces, filled in
`cityData.js` exports `PARKS`: real Chicago Park District boundaries (Grant Park plus several South Loop pocket parks), downloaded once from the City of Chicago open data portal ("Parks - Chicago Park District Park Boundaries" dataset, Socrata resource id `ejsh-fztr`), filtered to this map's area. Each entry is one polygon part shaped like a GeoJSON MultiPolygon part -- `[outer ring, ...hole rings]` -- so a park with a hole in it (e.g. Grant Park around the Buckingham Fountain basin) renders correctly; `app.js` fills each with the even-odd rule for exactly that reason. Parks are drawn right after the base land fill, before the lake, river, and every street, so streets still draw crisply on top of the green the same way they already draw on top of water. Decorative only -- no id, not explorable.

## Round 3 (covers R8)

### R8 - Landmarks for orientation
`cityData.js` exports `LANDMARKS`, a short curated list of `{ name, lon, lat }` for famous real buildings in our mapped area (e.g. the Rookery Building, Union Station, the Chicago Theatre). Sourced once from the City of Chicago's "Individual Landmarks" dataset (Socrata resource id `tdab-kixi`), filtered to landmarks inside `BOUNDS` and narrowed by hand to ones a typical visitor would actually recognize, rather than every officially-designated landmark in the area.

`app.js` draws each as a small dot marker with its name labeled beside it, always -- regardless of exploration progress -- since they exist purely to help the player orient themselves on the map, same as a paper map's "you are here" reference points. Landmark labels share the same overlap-avoidance pass as street-name labels (`placedLabelRects`), so a landmark never collides with a nearby street name. Landmarks carry no id and are not part of `SEGMENTS`, so they are invisible to click hit-testing and exploration state.

Canvas drawing has no z-index, only paint order, so a label painted after a dot can visually erase it. To prevent that, a small rect around every landmark dot (and every station marker, see R9) is reserved in `placedLabelRects` *before* any street label is placed, so labels route around them; the dots/markers themselves are then drawn in one final pass after every label, guaranteeing they stay on top no matter what else was drawn.

### R9 - CTA 'L' stations, color-coded by line
`cityData.js` exports `STATIONS` (`{ name, lon, lat, lines }`, one entry per physical station, `lines` the union of every CTA line serving it) and `CTA_LINE_COLORS` (the official color per line). Sourced once from the City of Chicago's "CTA - 'L' (Rail) Stations" dataset (Socrata resource id `3tzw-cg4m`), filtered to stations inside `BOUNDS`.

`app.js` draws each station as a small circle split into one colored wedge per line it serves (a solid circle when there's only one), so a hub like Clark/Lake reads at a glance as a multi-line station the same way a real transit map would show it. Same reference-point treatment as landmarks: always visible, not explorable, no id.

## Round 4 (covers R11-R14)

### City model
`cityState.js`'s state gains `pins`, a `Map` from segment id to `{ rating }`, alongside the existing `explored` Set and `start`. A segment's presence as a key in `pins` means it's pinned; `rating` is `1`-`5` once rated, or `null` while pinned but not yet rated.

### R11 - Pin an explored place
`pinPlace(state, id)` adds `id` to `pins` with `rating: null`. It's a no-op if `id` isn't in `explored` (an unexplored segment can't be pinned) or if it's already pinned (so re-pinning never clobbers an existing rating). `isPinned(state, id)` checks membership.

### R12 - Rate a pinned place 1-5 stars
`ratePlace(state, id, rating)` sets `pins.get(id).rating`. It's a no-op if `id` isn't pinned, or if `rating` isn't an integer `1`-`5`. `ratingFor(state, id)` returns the current rating, or `null` if unrated or unpinned.

### R13 - Change or remove a pin at any time
`ratePlace` can be called again on an already-rated place to change its rating. `unpinPlace(state, id)` removes `id` from `pins` entirely, discarding its rating; pinning the same segment again afterward starts out unrated, same as a brand-new pin.

### R14 - Pins saved and loaded between sessions
`serializeState`/`deserializeState` carry `pins` as an array of `[id, { rating }]` entries (a `Map`'s own spread form), alongside `explored` and `start`, same JSON-round-trip approach as R5.

### UI: selecting a segment to pin/rate
`app.js` tracks `selectedId`, which segment (if any) the pin/rate/unpin panel below the canvas refers to. This is UI-only, not part of `cityState`'s persisted state, same treatment as the projection math in R7 — not unit tested. Clicking an already-explored segment sets `selectedId` instead of re-marking it explored (previously a no-op anyway); clicking an unexplored one still sets the start location or explores it as before. The panel shows a "Pin this place" button for an unpinned selection, or five star-toggle buttons plus "Remove pin" for a pinned one.

Pinned segments get a small gold marker (the rating, or "?" while unrated) drawn at their midpoint in the same final layer as landmark dots and station markers, so it's never lost under a road or label; a rect around each is reserved in `placedLabelRects` before street labels are placed, same two-pass approach R8/R9 already established, so a street name never overlaps a pin marker. The selected segment also gets a dashed gold highlight stroke so it's clear which segment the panel below refers to.

### UI: "My places" list
Below the map, `#placesList` lists every pinned place via `pinnedPlaces(state)` -- a `cityState.js` helper (ordering is logic, so it lives there, not in the renderer) that returns pinned places sorted highest-rated first, unrated last. Each entry is a button showing the street and cross streets with its star rating; clicking one sets `selectedId` to that place, opening the same pin/rate/unpin panel a canvas click would. Not a numbered requirement on its own -- a usability addition on top of R11-R13 so a user with several pins can review and manage them without re-finding each one on the map.

## Round 5 (covers R15-R17)

### City model
Each entry in `pins` gains a `category` field alongside `rating`: `null` while uncategorized, or one of `cityState.js`'s exported `CATEGORIES` (`"food"`, `"shopping"`, `"park"`, `"photo spot"`, `"other"`) once assigned.

### R15 - Assign a category to a pinned place
`categorizePlace(state, id, category)` sets `pins.get(id).category`. It's a no-op if `id` isn't pinned (same rule as `ratePlace`), or if `category` isn't one of `CATEGORIES`. `pinPlace` now creates a pin with `category: null`, so every newly-pinned place starts uncategorized. `categoryFor(state, id)` returns the current category, or `null` if uncategorized or unpinned.

### R16 - Change a category at any time
`categorizePlace` can be called again on an already-categorized place to change it, the same repeatable-action shape as `ratePlace` (R13) -- rating and categorizing a place are independent fields on the same pin, and setting either one leaves the other untouched.

### R17 - Categories saved and loaded between sessions
No change to `serializeState`/`deserializeState` was needed: both already carry each pin's full object (`[...state.pins]`), so `category` rides along with `rating` automatically, the same JSON round-trip R14 already established.

### UI: categorizing in the panel
The pin/rate/unpin panel (`app.js`) gains a row of category buttons below the star rating, one per `CATEGORIES` entry, with the current category (if any) highlighted. Clicking one calls `categorizePlace` and re-renders, the same pattern the star buttons already use for `ratePlace`. The "My places" list also shows each place's category (or "uncategorized") next to its star rating.

## Round 6 (covers R18, R19)

### R18 - Deselect the selected place
The pin/rate/unpin panel gains a "Close" button, shown whenever a place is selected (pinned or not). Clicking it sets `selectedId` back to `null` and re-renders, same as the existing selection logic in R11 -- it doesn't touch `state` at all, so the pin, its rating, and its category are all untouched. Purely UI state (`selectedId` was already UI-only, not part of `cityState`'s persisted state), so same test exemption as the rest of R11's panel wiring.

### R19 - Filter "My places" by category
`pinnedPlaces(state, category)` in `cityState.js` gains an optional second argument: `null` (the default, omit it entirely) returns every pinned place as before; passing one of `CATEGORIES` filters the results to only places with that category, keeping the existing highest-rated-first sort. This is core list-selection logic, so it's unit tested the same way the existing sort/exclude behavior already was.

`app.js` tracks `placesFilter`, a second piece of UI-only state (not persisted, same treatment as `selectedId`) holding the currently chosen category or `null` for "all." The "My places" list gets a row of filter buttons -- "All" plus one per `CATEGORIES` entry, with the active one highlighted -- above the list itself; clicking one sets `placesFilter` and re-renders. If the chosen filter matches no pinned places, the list shows "No places in this category." instead of silently appearing empty, so it's clear the filter (not a bug) is why nothing's shown. The filter controls still appear in that case (as long as at least one place is pinned at all) so the user can switch back without digging for a reset.
