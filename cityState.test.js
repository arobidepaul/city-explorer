import test from "node:test";
import assert from "node:assert/strict";
import {
  createState, setStartLocation, markExplored, isExplored,
  serializeState, deserializeState,
} from "./cityState.js";
import { streetNamesFor, blockId } from "./cityData.js";

test("R2: setting a start location marks it explored", () => {
  let state = createState();
  state = setStartLocation(state, blockId(3, 4));
  assert.equal(state.start, "3,4");
  assert.ok(isExplored(state, "3,4"));
});

test("R2: start location can only be set once", () => {
  let state = createState();
  state = setStartLocation(state, blockId(0, 0));
  state = setStartLocation(state, blockId(5, 5));
  assert.equal(state.start, "0,0");
  assert.ok(!isExplored(state, "5,5"));
});

test("R3: marking a block explored reveals only that block", () => {
  let state = createState();
  state = markExplored(state, blockId(1, 1));
  assert.ok(isExplored(state, "1,1"));
  assert.ok(!isExplored(state, "2,2"));
});

test("R3: marking explored does not clear earlier explored blocks", () => {
  let state = createState();
  state = markExplored(state, blockId(1, 1));
  state = markExplored(state, blockId(2, 2));
  assert.ok(isExplored(state, "1,1"));
  assert.ok(isExplored(state, "2,2"));
});

test("R4: street names are derived from a block's row and column", () => {
  const names = streetNamesFor(blockId(2, 3));
  assert.equal(names.eastWest, "Adams St");
  assert.equal(names.northSouth, "LaSalle St");
});

test("R5: serializing and deserializing round-trips explored state", () => {
  let state = createState();
  state = setStartLocation(state, blockId(0, 0));
  state = markExplored(state, blockId(1, 0));
  const json = serializeState(state);
  const restored = deserializeState(json);
  assert.equal(restored.start, "0,0");
  assert.ok(isExplored(restored, "0,0"));
  assert.ok(isExplored(restored, "1,0"));
  assert.ok(!isExplored(restored, "9,9"));
});

test("R5: a fresh deserialized state is a real Set, not an array", () => {
  const json = serializeState(createState());
  const restored = deserializeState(json);
  assert.ok(restored.explored instanceof Set);
});
