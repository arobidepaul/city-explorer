import test from "node:test";
import assert from "node:assert/strict";
import {
  createState, setStartLocation, markExplored, isExplored,
  serializeState, deserializeState,
} from "./cityState.js";
import {
  SEGMENTS, LANDMARKS, STATIONS, PARKS, CTA_LINE_COLORS, streetNamesFor,
} from "./cityData.js";

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

test("R1 (changed): segments are real street geometry, not synthetic grid cells", () => {
  assert.equal(SEGMENTS.length, 400);
  for (const segment of SEGMENTS) {
    assert.ok(Array.isArray(segment.coords) && segment.coords.length >= 2);
    assert.ok(!/^\d+,\d+$/.test(segment.id));
  }
});

test("R6: every segment has a real street name and real-or-null cross streets", () => {
  for (const segment of SEGMENTS) {
    assert.ok(typeof segment.street === "string" && segment.street.length > 0);
    assert.ok(segment.crossFrom === null || typeof segment.crossFrom === "string");
    assert.ok(segment.crossTo === null || typeof segment.crossTo === "string");
  }
});

test("R6: segment ids are unique", () => {
  const ids = SEGMENTS.map((segment) => segment.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("R8: landmarks are real named points with unique names", () => {
  assert.ok(LANDMARKS.length > 0);
  for (const landmark of LANDMARKS) {
    assert.ok(typeof landmark.name === "string" && landmark.name.length > 0);
    assert.ok(typeof landmark.lon === "number" && typeof landmark.lat === "number");
  }
  const names = LANDMARKS.map((landmark) => landmark.name);
  assert.equal(new Set(names).size, names.length);
});

test("R9: every station lists at least one real CTA line with a defined color", () => {
  assert.ok(STATIONS.length > 0);
  for (const station of STATIONS) {
    assert.ok(Array.isArray(station.lines) && station.lines.length > 0);
    for (const line of station.lines) {
      assert.ok(line in CTA_LINE_COLORS);
    }
  }
});

test("R10: every park is one or more rings of real coordinates", () => {
  assert.ok(PARKS.length > 0);
  for (const park of PARKS) {
    assert.ok(Array.isArray(park) && park.length >= 1);
    for (const ring of park) {
      assert.ok(ring.length >= 3);
      for (const point of ring) {
        assert.equal(point.length, 2);
        assert.ok(typeof point[0] === "number" && typeof point[1] === "number");
      }
    }
  }
});
