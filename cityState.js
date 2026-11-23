// Pure exploration-state logic. No DOM, no browser globals, so this can be
// unit tested directly and reused by app.js in the browser.

export function createState() {
  return { explored: new Set(), start: null, pins: new Map() };
}

// R15: the fixed set of categories a pinned place can be assigned to.
export const CATEGORIES = ["food", "shopping", "park", "photo spot", "other"];

// R2: starting location can only be set once per game.
export function setStartLocation(state, id) {
  if (state.start !== null) return state;
  const explored = new Set(state.explored);
  explored.add(id);
  return { ...state, explored, start: id };
}

// R3: mark a block explored, revealing it.
export function markExplored(state, id) {
  const explored = new Set(state.explored);
  explored.add(id);
  return { ...state, explored };
}

export function isExplored(state, id) {
  return state.explored.has(id);
}

// R11: pin an already-explored segment as a place. A segment that hasn't
// been explored yet cannot be pinned. Pinning an already-pinned segment is a
// no-op so it never resets an existing rating.
export function pinPlace(state, id) {
  if (!state.explored.has(id) || state.pins.has(id)) return state;
  const pins = new Map(state.pins);
  pins.set(id, { rating: null, category: null });
  return { ...state, pins };
}

// R13: a pin can be removed entirely at any time; this discards its rating
// too, so re-pinning the same segment later starts out unrated.
export function unpinPlace(state, id) {
  if (!state.pins.has(id)) return state;
  const pins = new Map(state.pins);
  pins.delete(id);
  return { ...state, pins };
}

export function isPinned(state, id) {
  return state.pins.has(id);
}

// R12/R13: rate (or re-rate) a pinned place, 1-5 stars. Only a pinned place
// can be rated, and an out-of-range or non-integer rating is rejected.
export function ratePlace(state, id, rating) {
  if (!state.pins.has(id)) return state;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return state;
  const pins = new Map(state.pins);
  pins.set(id, { ...pins.get(id), rating });
  return { ...state, pins };
}

export function ratingFor(state, id) {
  const pin = state.pins.get(id);
  return pin ? pin.rating : null;
}

// R15/R16: assign (or change) a pinned place's category. Only a pinned
// place can be categorized, and only to one of CATEGORIES.
export function categorizePlace(state, id, category) {
  if (!state.pins.has(id)) return state;
  if (!CATEGORIES.includes(category)) return state;
  const pins = new Map(state.pins);
  pins.set(id, { ...pins.get(id), category });
  return { ...state, pins };
}

export function categoryFor(state, id) {
  const pin = state.pins.get(id);
  return pin ? pin.category : null;
}

// All pinned places, highest-rated first (unrated places last). R19: pass
// one of CATEGORIES to show only places in that category; omit (or pass
// null) for the default "all categories" view.
export function pinnedPlaces(state, category = null) {
  return [...state.pins.entries()]
    .map(([id, pin]) => ({ id, rating: pin.rating, category: pin.category }))
    .filter((place) => category === null || place.category === category)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
}

// R5/R14: serialize/deserialize for save-between-sessions, including pins.
export function serializeState(state) {
  return JSON.stringify({
    explored: [...state.explored],
    start: state.start,
    pins: [...state.pins],
  });
}

export function deserializeState(json) {
  const parsed = JSON.parse(json);
  return {
    explored: new Set(parsed.explored),
    start: parsed.start,
    pins: new Map(parsed.pins),
  };
}
