import test from "node:test";
import assert from "node:assert/strict";
import {
  createState, setStartLocation, markExplored, isExplored,
  serializeState, deserializeState,
} from "./cityState.js";
import { SEGMENTS, streetNamesFor } from "./cityData.js";

const [segmentA, segmentB, segmentC] = SEGMENTS;

test("R2: setting a start location marks it explored", () => {
  let state = createState();
  state = setStartLocation(state, segmentA.id);
  assert.equal(state.start, segmentA.id);
  assert.ok(isExplored(state, segmentA.id));
});

test("R2: start location can only be set once", () => {
  let state = createState();
  state = setStartLocation(state, segmentA.id);
  state = setStartLocation(state, segmentB.id);
  assert.equal(state.start, segmentA.id);
  assert.ok(!isExplored(state, segmentB.id));
});

test("R3: marking a segment explored reveals only that segment", () => {
  let state = createState();
  state = markExplored(state, segmentA.id);
  assert.ok(isExplored(state, segmentA.id));
  assert.ok(!isExplored(state, segmentB.id));
});

test("R3: marking explored does not clear earlier explored segments", () => {
  let state = createState();
  state = markExplored(state, segmentA.id);
  state = markExplored(state, segmentB.id);
  assert.ok(isExplored(state, segmentA.id));
  assert.ok(isExplored(state, segmentB.id));
});

test("R4: street names are looked up from a segment's id", () => {
  const names = streetNamesFor(segmentA.id);
  assert.equal(names.street, segmentA.street);
  assert.equal(names.crossFrom, segmentA.crossFrom);
  assert.equal(names.crossTo, segmentA.crossTo);
});

test("R4: an unknown segment id has no street names", () => {
  assert.equal(streetNamesFor("not-a-real-id"), null);
});

test("R5: serializing and deserializing round-trips explored state", () => {
  let state = createState();
  state = setStartLocation(state, segmentA.id);
  state = markExplored(state, segmentB.id);
  const json = serializeState(state);
  const restored = deserializeState(json);
  assert.equal(restored.start, segmentA.id);
  assert.ok(isExplored(restored, segmentA.id));
  assert.ok(isExplored(restored, segmentB.id));
  assert.ok(!isExplored(restored, segmentC.id));
});

test("R5: a fresh deserialized state is a real Set, not an array", () => {
  const json = serializeState(createState());
  const restored = deserializeState(json);
  assert.ok(restored.explored instanceof Set);
});
