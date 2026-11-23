# CLAUDE.md

Standing rules for every session working on this project.

- No API keys, logins, or paid services. The city map is synthetic data bundled in `cityData.js`, not fetched from a live map provider.
- Runs with one command: `node server.js`. No build step, no external npm dependencies.
- Core exploration logic lives in `cityState.js` as pure functions (no DOM, no browser globals) so it can be unit tested with `node --test`.
- Only logic gets tests: marking cells explored, start-location selection, save/load serialization. Rendering (`app.js`, canvas drawing) is not tested.
- Tests run with `node --test`.
- Never undo or amend a commit.
- Requirement IDs (R1, R2, ...) are never reused. A changed requirement keeps its number and says what changed; a removed one stays in problem.md marked removed.
- As of Round 2, the explorable unit is a real street segment (from `cityData.js`'s `SEGMENTS`), not a grid cell. Decorative/reference-only data (`RIVER`, the lake, `PARKS`, `LANDMARKS`, `STATIONS`) carries no `id` and is invisible to click hit-testing and exploration state; it exists purely for rendering.
- A requirement that is purely about rendering/layout (e.g. R1's grayscale fill, R7's fixed scale) is exempt from unit tests, same as the assignment's own "only logic gets tests, not the drawing" rule. Note the exemption in spec.md when it applies, the way R1 and R7 already do, rather than skipping the test silently.
