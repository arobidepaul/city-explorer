import { SEGMENTS, RIVER, LAKE_MICHIGAN_SHORELINE, LAKE_MICHIGAN_BREAKWATERS, PARKS, LANDMARKS, STATIONS, CTA_LINE_COLORS, BOUNDS, streetNamesFor } from "./cityData.js";
import {
  createState, setStartLocation, markExplored, isExplored, unexploreSegment,
  pinPlace, unpinPlace, isPinned, ratePlace, ratingFor, pinnedPlaces,
  categorizePlace, categoryFor, CATEGORIES,
  serializeState, deserializeState,
} from "./cityState.js";

const STORAGE_KEY = "city-explorer-state";
const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");
const placePanel = document.getElementById("placePanel");
const placesList = document.getElementById("placesList");

// R7: the whole area is shown at a fixed scale, no pan/zoom. Project lon/lat
// to canvas pixels once, correcting for longitude compression at this
// latitude, and fit the full bounding box inside the canvas with padding.
const PADDING = 20;
const avgLatRad = ((BOUNDS.minLat + BOUNDS.maxLat) / 2) * (Math.PI / 180);
const lonScale = Math.cos(avgLatRad);
const spanX = (BOUNDS.maxLon - BOUNDS.minLon) * lonScale;
const spanY = BOUNDS.maxLat - BOUNDS.minLat;
const scale = Math.min(
  (canvas.width - 2 * PADDING) / spanX,
  (canvas.height - 2 * PADDING) / spanY,
);

function project([lon, lat]) {
  const x = PADDING + (lon - BOUNDS.minLon) * lonScale * scale;
  const y = PADDING + (BOUNDS.maxLat - lat) * scale;
  return [x, y];
}

const projectedSegments = SEGMENTS.map((segment) => ({
  id: segment.id,
  points: segment.coords.map(project),
}));

const projectedRiver = RIVER.map((piece) => piece.map(project));

// Lake Michigan: everything east of the real shoreline, out past the edge of
// the canvas, is water. Close the shoreline polyline into a fillable shape by
// running it out to a point off the right edge of the canvas and back.
const projectedShoreline = LAKE_MICHIGAN_SHORELINE.map(project);
const projectedBreakwaters = LAKE_MICHIGAN_BREAKWATERS.map((ring) => ring.map(project));
const LAKE_RIGHT_EDGE = canvas.width + 40;

// Parks: each entry is [outer ring, ...hole rings], same shape as a GeoJSON
// MultiPolygon part.
const projectedParks = PARKS.map((rings) => rings.map((ring) => ring.map(project)));

// R8: landmarks are reference points only -- not explorable, always shown.
const projectedLandmarks = LANDMARKS.map((landmark) => ({
  name: landmark.name,
  point: project([landmark.lon, landmark.lat]),
}));

// R9: CTA 'L' stations, same reference-point treatment as landmarks.
const projectedStations = STATIONS.map((station) => ({
  name: station.name,
  lines: station.lines,
  point: project([station.lon, station.lat]),
}));

// Dead ends: a short tick perpendicular to the road's own direction at the
// exact point it stops, for streets the source data tags as a genuine
// real-world dead end (not just an untracked alley or our map's edge).
function perpendicularCap(end, prev) {
  const [ex, ey] = end;
  const [px, py] = prev;
  let dx = ex - px;
  let dy = ey - py;
  const length = Math.hypot(dx, dy) || 1;
  dx /= length;
  dy /= length;
  const nx = -dy * 7;
  const ny = dx * 7;
  return { x1: ex + nx, y1: ey + ny, x2: ex - nx, y2: ey - ny };
}

const deadEndCaps = [];
SEGMENTS.forEach((segment, i) => {
  const points = projectedSegments[i].points;
  if (segment.deadEndFrom) {
    deadEndCaps.push(perpendicularCap(points[0], points[1]));
  }
  if (segment.deadEndTo) {
    deadEndCaps.push(perpendicularCap(points[points.length - 1], points[points.length - 2]));
  }
});

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return createState();
  try {
    return deserializeState(saved);
  } catch {
    return createState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, serializeState(state));
}

let state = loadState();

// R11: a segment the user has selected (by clicking it after it's already
// explored) to pin, unpin, or rate. UI-only; never persisted.
let selectedId = null;

// R19: which category "My places" is filtered to, or null for every
// category (the default). UI-only; never persisted.
let placesFilter = null;

const LABEL_FONT = "600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const LANDMARK_FONT = "italic 600 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const STATION_FONT = "600 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function drawStationMarker(x, y, lines) {
  const radius = 5;
  const slice = (Math.PI * 2) / lines.length;
  lines.forEach((line, i) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, i * slice - Math.PI / 2, (i + 1) * slice - Math.PI / 2);
    ctx.closePath();
    ctx.fillStyle = CTA_LINE_COLORS[line] || "#555555";
    ctx.fill();
  });
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
}

// R11/R12: a pinned place's marker. Filled gold with the star count, or a
// bare "?" while it's pinned but not yet rated.
function drawPinMarker(x, y, rating) {
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#f5a623";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.font = "700 9px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#3a2600";
  ctx.fillText(rating === null ? "?" : String(rating), x, y + 0.5);
  ctx.textAlign = "left";
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function tracePath(points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e8e4d9";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Decorative: real park boundaries (Grant Park and several South Loop
  // pocket parks), filled over the plain land color so the big green spaces
  // on a real map don't read as empty/missing. Streets draw on top, same as
  // they do over the lake.
  ctx.fillStyle = "#c7d9b8";
  for (const rings of projectedParks) {
    const path = new Path2D();
    rings.forEach((ring) => {
      ring.forEach(([x, y], i) => {
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      });
      path.closePath();
    });
    ctx.fill(path, "evenodd");
  }

  // Decorative: Lake Michigan, filled first (bottom layer) so the river and
  // streets draw on top of it, same as the land.
  if (projectedShoreline.length > 0) {
    ctx.beginPath();
    projectedShoreline.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    const [, firstY] = projectedShoreline[0];
    const [, lastY] = projectedShoreline[projectedShoreline.length - 1];
    ctx.lineTo(LAKE_RIGHT_EDGE, lastY);
    ctx.lineTo(LAKE_RIGHT_EDGE, firstY);
    ctx.closePath();
    ctx.fillStyle = "#aed4e6";
    ctx.fill();
  }

  // Decorative: the Monroe Harbor breakwater, solid ground poking out of the
  // lake. The source polygon is only a few meters wide, which fills to a
  // near-invisible sliver at this scale, so it's stroked as a solid pier --
  // a sandy tone clearly distinct from both the water and the plain land --
  // thick enough to actually read as a real, deliberate feature.
  ctx.fillStyle = "#e8e4d9";
  ctx.strokeStyle = "#cdbb94";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const ring of projectedBreakwaters) {
    ctx.beginPath();
    ring.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Decorative: the Chicago River, drawn beneath the streets so roads read
  // as crossing over it on bridges, like a real map.
  ctx.strokeStyle = "#a9d3e5";
  ctx.lineWidth = 10;
  for (const points of projectedRiver) {
    tracePath(points);
    ctx.stroke();
  }

  // R1: like a real map, a road is a light surface with a thin darker
  // casing/outline -- lighter than the land, not darker. Unexplored roads
  // stay neutral grayscale; once explored, the surface takes the map's
  // route color, drawn thick enough that its name can sit directly on top.
  for (const segment of projectedSegments) {
    const explored = isExplored(state, segment.id);

    tracePath(segment.points);
    ctx.lineWidth = explored ? 11 : 6;
    ctx.strokeStyle = explored ? "#145dc4" : "#c9c2b2";
    ctx.stroke();

    tracePath(segment.points);
    ctx.lineWidth = explored ? 8 : 3.5;
    ctx.strokeStyle = explored ? "#2f86f5" : "#fbfaf5";
    ctx.stroke();
  }

  // A real dead end gets a small barrier tick across the end of the road,
  // so it reads as "the street really stops here" rather than a rendering
  // glitch or a cut-off edge of the map.
  ctx.strokeStyle = "#6b5a46";
  ctx.lineWidth = 3;
  for (const cap of deadEndCaps) {
    ctx.beginPath();
    ctx.moveTo(cap.x1, cap.y1);
    ctx.lineTo(cap.x2, cap.y2);
    ctx.stroke();
  }

  // R4: street names, drawn directly on their (now thick) road. Labels can
  // still crowd each other near intersections or on short blocks, so each
  // one tries a few spots along its own segment and skips drawing entirely
  // rather than overlap an already-placed label.
  ctx.font = LABEL_FONT;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#145dc4";
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  const placedLabelRects = [];
  const LABEL_SPOTS = [0.5, 0.25, 0.75, 0.1, 0.9];

  // Reserve space around every landmark dot before any text is placed, so a
  // street (or landmark) label can never paint over a dot drawn earlier --
  // canvas has no z-index, only paint order, so this has to happen up front.
  for (const landmark of projectedLandmarks) {
    const [x, y] = landmark.point;
    placedLabelRects.push({ x: x - 5, y: y - 5, w: 10, h: 10 });
  }
  for (const station of projectedStations) {
    const [x, y] = station.point;
    placedLabelRects.push({ x: x - 6, y: y - 6, w: 12, h: 12 });
  }
  for (const segment of projectedSegments) {
    if (!isPinned(state, segment.id)) continue;
    const [x, y] = segment.points[Math.round((segment.points.length - 1) / 2)];
    placedLabelRects.push({ x: x - 8, y: y - 8, w: 16, h: 16 });
  }
  for (const segment of projectedSegments) {
    if (!isExplored(state, segment.id)) continue;
    const names = streetNamesFor(segment.id);
    const width = ctx.measureText(names.street).width;

    for (const fraction of LABEL_SPOTS) {
      const index = Math.round(fraction * (segment.points.length - 1));
      const [x, y] = segment.points[index];
      const textX = x - width / 2;
      const rect = { x: textX, y: y - 7, w: width, h: 14 };
      if (placedLabelRects.some((placed) => rectsOverlap(placed, rect))) continue;
      ctx.strokeText(names.street, textX, y);
      ctx.fillText(names.street, textX, y);
      placedLabelRects.push(rect);
      break;
    }
  }

  // R8: landmark labels, always shown. They share the street labels' overlap
  // check (including each dot's own reserved space above) so a landmark
  // label never collides with a nearby street name or a dot.
  ctx.font = LANDMARK_FONT;
  ctx.textBaseline = "middle";
  const LANDMARK_LABEL_OFFSETS = [
    [8, 0], [-8, 0], [0, -10], [0, 10],
  ];
  for (const landmark of projectedLandmarks) {
    const [x, y] = landmark.point;
    const width = ctx.measureText(landmark.name).width;
    for (const [dx, dy] of LANDMARK_LABEL_OFFSETS) {
      const textX = dx >= 0 ? x + 8 : x - 8 - width;
      const textY = y + dy;
      const rect = { x: textX, y: textY - 7, w: width, h: 14 };
      if (placedLabelRects.some((placed) => rectsOverlap(placed, rect))) continue;
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#e8e4d9";
      ctx.fillStyle = "#8a2d2d";
      ctx.strokeText(landmark.name, textX, textY);
      ctx.fillText(landmark.name, textX, textY);
      placedLabelRects.push(rect);
      break;
    }
  }

  // R9: CTA station labels, same reservation-based overlap handling.
  ctx.font = STATION_FONT;
  ctx.textBaseline = "middle";
  const STATION_LABEL_OFFSETS = [
    [9, 0], [-9, 0], [0, -11], [0, 11],
  ];
  for (const station of projectedStations) {
    const [x, y] = station.point;
    const width = ctx.measureText(station.name).width;
    for (const [dx, dy] of STATION_LABEL_OFFSETS) {
      const textX = dx >= 0 ? x + 9 : x - 9 - width;
      const textY = y + dy;
      const rect = { x: textX, y: textY - 7, w: width, h: 14 };
      if (placedLabelRects.some((placed) => rectsOverlap(placed, rect))) continue;
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#e8e4d9";
      ctx.fillStyle = "#2b2b2b";
      ctx.strokeText(station.name, textX, textY);
      ctx.fillText(station.name, textX, textY);
      placedLabelRects.push(rect);
      break;
    }
  }

  // Landmark dots and station markers are drawn last of all, on top of every
  // road and every label, so neither is ever visually lost under something
  // painted after it.
  for (const landmark of projectedLandmarks) {
    const [x, y] = landmark.point;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#8a2d2d";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  }
  for (const station of projectedStations) {
    const [x, y] = station.point;
    drawStationMarker(x, y, station.lines);
  }

  // R11: a selected segment (clicked while already explored, to pin/rate/
  // unpin it) gets a dashed highlight so it's clear which one the panel
  // below refers to.
  if (selectedId !== null) {
    const selected = projectedSegments.find((segment) => segment.id === selectedId);
    if (selected) {
      tracePath(selected.points);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#f5a623";
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // R11/R12: pinned places get a star marker on top of everything else,
  // same final-layer treatment as landmark dots and station markers, so a
  // pin is never visually lost under a road or label.
  for (const segment of projectedSegments) {
    if (!isPinned(state, segment.id)) continue;
    const [x, y] = segment.points[Math.round((segment.points.length - 1) / 2)];
    drawPinMarker(x, y, ratingFor(state, segment.id));
  }

  status.textContent = state.start
    ? `Explored ${state.explored.size} segment(s), pinned ${state.pins.size} place(s).`
    : "Click a street to start exploring.";

  renderPlacesList();
  renderPanel();
}

// R11-R13: a list of every pinned place, highest-rated first, so the user
// can review their favorites without clicking through the whole map.
// Clicking an entry selects it, which opens the same pin/rate/unpin panel
// a canvas click would.
function renderPlacesList() {
  placesList.replaceChildren();

  if (state.pins.size === 0) return;

  const heading = document.createElement("h2");
  heading.textContent = "My places";
  placesList.appendChild(heading);

  // R19: filter controls -- "All" plus one button per category. Shown
  // whenever there's at least one pin, even if the current filter happens
  // to match none of them, so the user can switch back.
  const filters = document.createElement("div");
  filters.className = "filters";
  const allButton = document.createElement("button");
  allButton.textContent = "All";
  allButton.className = placesFilter === null ? "active" : "";
  allButton.addEventListener("click", () => {
    placesFilter = null;
    render();
  });
  filters.appendChild(allButton);
  for (const category of CATEGORIES) {
    const filterButton = document.createElement("button");
    filterButton.textContent = category;
    filterButton.className = category === placesFilter ? "active" : "";
    filterButton.addEventListener("click", () => {
      placesFilter = category;
      render();
    });
    filters.appendChild(filterButton);
  }
  placesList.appendChild(filters);

  const places = pinnedPlaces(state, placesFilter);
  if (places.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No places in this category.";
    placesList.appendChild(empty);
    return;
  }

  const list = document.createElement("ul");
  for (const place of places) {
    const names = streetNamesFor(place.id);
    const stars = place.rating === null
      ? "unrated"
      : "★".repeat(place.rating) + "☆".repeat(5 - place.rating);
    const category = place.category ?? "uncategorized";

    const item = document.createElement("li");
    const button = document.createElement("button");
    button.textContent = names
      ? `${names.street} (${names.crossFrom ?? "?"} to ${names.crossTo ?? "?"}) — ${stars} — ${category}`
      : `${place.id} — ${stars} — ${category}`;
    button.addEventListener("click", () => {
      selectedId = place.id;
      render();
    });
    item.appendChild(button);
    list.appendChild(item);
  }
  placesList.appendChild(list);
}

// R11-R13: the panel below the canvas for pinning the selected segment,
// rating it, or removing an existing pin.
function renderPanel() {
  placePanel.replaceChildren();

  if (selectedId === null) {
    const hint = document.createElement("p");
    hint.textContent = "Click an explored street to pin it as a place.";
    placePanel.appendChild(hint);
    return;
  }

  const names = streetNamesFor(selectedId);
  const title = document.createElement("p");
  title.textContent = names
    ? `${names.street} (${names.crossFrom ?? "?"} to ${names.crossTo ?? "?"})`
    : selectedId;
  placePanel.appendChild(title);

  // R18: deselect without unpinning or selecting something else -- just
  // closes this panel.
  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => {
    selectedId = null;
    render();
  });
  placePanel.appendChild(closeButton);

  if (!isPinned(state, selectedId)) {
    const pinButton = document.createElement("button");
    pinButton.textContent = "Pin this place";
    pinButton.addEventListener("click", () => {
      state = pinPlace(state, selectedId);
      saveState(state);
      render();
    });
    placePanel.appendChild(pinButton);

    // R20: an unpinned, explored segment that isn't the start location can
    // be reverted to unexplored. The start location and pinned places don't
    // get this button at all, matching the checks unexploreSegment itself
    // makes, so it never appears only to silently no-op when clicked.
    if (selectedId !== state.start) {
      const unexploreButton = document.createElement("button");
      unexploreButton.textContent = "Un-explore this street";
      unexploreButton.addEventListener("click", () => {
        state = unexploreSegment(state, selectedId);
        selectedId = null;
        saveState(state);
        render();
      });
      placePanel.appendChild(unexploreButton);
    }
    return;
  }

  const currentRating = ratingFor(state, selectedId);
  const stars = document.createElement("div");
  stars.className = "stars";
  for (let star = 1; star <= 5; star++) {
    const starButton = document.createElement("button");
    starButton.textContent = currentRating !== null && star <= currentRating ? "★" : "☆";
    starButton.addEventListener("click", () => {
      state = ratePlace(state, selectedId, star);
      saveState(state);
      render();
    });
    stars.appendChild(starButton);
  }
  placePanel.appendChild(stars);

  const currentCategory = categoryFor(state, selectedId);
  const categories = document.createElement("div");
  categories.className = "categories";
  for (const category of CATEGORIES) {
    const categoryButton = document.createElement("button");
    categoryButton.textContent = category;
    categoryButton.className = category === currentCategory ? "active" : "";
    categoryButton.addEventListener("click", () => {
      state = categorizePlace(state, selectedId, category);
      saveState(state);
      render();
    });
    categories.appendChild(categoryButton);
  }
  placePanel.appendChild(categories);

  const unpinButton = document.createElement("button");
  unpinButton.textContent = "Remove pin";
  unpinButton.addEventListener("click", () => {
    state = unpinPlace(state, selectedId);
    selectedId = null;
    saveState(state);
    render();
  });
  placePanel.appendChild(unpinButton);
}

// Distance from point p to the segment [a, b], for hit-testing clicks
// against thin street lines rather than filled grid cells.
function distanceToSegment(p, a, b) {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  let t = lengthSquared === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  const closestX = ax + t * dx;
  const closestY = ay + t * dy;
  return Math.hypot(px - closestX, py - closestY);
}

function nearestSegmentId(point) {
  let bestId = null;
  let bestDistance = Infinity;
  for (const segment of projectedSegments) {
    for (let i = 0; i < segment.points.length - 1; i++) {
      const distance = distanceToSegment(point, segment.points[i], segment.points[i + 1]);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestId = segment.id;
      }
    }
  }
  const CLICK_THRESHOLD_PX = 10;
  return bestDistance <= CLICK_THRESHOLD_PX ? bestId : null;
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const point = [event.clientX - rect.left, event.clientY - rect.top];
  const id = nearestSegmentId(point);
  if (id === null) return;

  // R11: clicking a street that's already explored selects it for pinning
  // instead of re-marking it explored (a no-op anyway); clicking an
  // unexplored street still sets the start location or explores it.
  if (isExplored(state, id)) {
    selectedId = id;
  } else {
    state = state.start === null ? setStartLocation(state, id) : markExplored(state, id);
    saveState(state);
  }
  render();
});

render();
