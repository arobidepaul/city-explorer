// Pure exploration-state logic. No DOM, no browser globals, so this can be
// unit tested directly and reused by app.js in the browser.

export function createState() {
  return { explored: new Set(), start: null };
}

// R2: starting location can only be set once per game.
export function setStartLocation(state, id) {
  if (state.start !== null) return state;
  const explored = new Set(state.explored);
  explored.add(id);
  return { explored, start: id };
}

// R3: mark a block explored, revealing it.
export function markExplored(state, id) {
  const explored = new Set(state.explored);
  explored.add(id);
  return { explored, start: state.start };
}

export function isExplored(state, id) {
  return state.explored.has(id);
}

// R5: serialize/deserialize for save-between-sessions.
export function serializeState(state) {
  return JSON.stringify({ explored: [...state.explored], start: state.start });
}

export function deserializeState(json) {
  const parsed = JSON.parse(json);
  return { explored: new Set(parsed.explored), start: parsed.start };
}
