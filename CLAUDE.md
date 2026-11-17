# CLAUDE.md

Standing rules for every session working on this project.

- No API keys, logins, or paid services. The city map is synthetic data bundled in `cityData.js`, not fetched from a live map provider.
- Runs with one command: `node server.js`. No build step, no external npm dependencies.
- Core exploration logic lives in `cityState.js` as pure functions (no DOM, no browser globals) so it can be unit tested with `node --test`.
- Only logic gets tests: marking cells explored, start-location selection, save/load serialization. Rendering (`app.js`, canvas drawing) is not tested.
- Tests run with `node --test`.
- Never undo or amend a commit.
- Requirement IDs (R1, R2, ...) are never reused. A changed requirement keeps its number and says what changed; a removed one stays in problem.md marked removed.
