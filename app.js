import { ROWS, COLS, blockId, streetNamesFor } from "./cityData.js";
import {
  createState, setStartLocation, markExplored, isExplored,
  serializeState, deserializeState,
} from "./cityState.js";

const STORAGE_KEY = "city-explorer-state";
const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");
const cellSize = canvas.width / COLS;

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

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const id = blockId(row, col);
      const explored = isExplored(state, id);
      ctx.fillStyle = explored ? "#4caf50" : "#888";
      ctx.fillRect(col * cellSize, row * cellSize, cellSize - 1, cellSize - 1);

      if (explored) {
        const { eastWest, northSouth } = streetNamesFor(id);
        ctx.fillStyle = "#000";
        ctx.font = "7px sans-serif";
        ctx.fillText(northSouth.split(" ")[0], col * cellSize + 2, row * cellSize + 12);
        ctx.fillText(eastWest.split(" ")[0], col * cellSize + 2, row * cellSize + 22);
      }
    }
  }
  status.textContent = state.start
    ? `Explored ${state.explored.size} block(s).`
    : "Click a block to start exploring.";
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const col = Math.floor((event.clientX - rect.left) / cellSize);
  const row = Math.floor((event.clientY - rect.top) / cellSize);
  const id = blockId(row, col);

  state = state.start === null ? setStartLocation(state, id) : markExplored(state, id);
  saveState(state);
  render();
});

render();
