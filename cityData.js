// Synthetic grid city, no live map data. Real Chicago street names, bundled locally.
export const ROWS = 10;
export const COLS = 10;

export const EAST_WEST_STREETS = [
  "Madison St", "Monroe St", "Adams St", "Jackson Blvd", "Van Buren St",
  "Congress Pkwy", "Harrison St", "Polk St", "Taylor St", "Roosevelt Rd",
];

export const NORTH_SOUTH_STREETS = [
  "State St", "Dearborn St", "Clark St", "LaSalle St", "Wells St",
  "Franklin St", "Wacker Dr", "Canal St", "Clinton St", "Halsted St",
];

export function blockId(row, col) {
  return `${row},${col}`;
}

export function parseBlockId(id) {
  const [row, col] = id.split(",").map(Number);
  return { row, col };
}

export function streetNamesFor(id) {
  const { row, col } = parseBlockId(id);
  return { eastWest: EAST_WEST_STREETS[row], northSouth: NORTH_SOUTH_STREETS[col] };
}
