## Problem

One problem that I had transferring to DePaul is that I had no experience exploring Chicago. Without friends, this made it a bit more difficult. I thought why don't I gamify this process where I also learn the street names and in the process figure out my favourite places (to eat, to shop, to chill...etc). Transfer student or commuting students as I am, often stick to the same route or same daily commute. Which makes sense, but exploring takes time, and without a reason to do it, students never start.

## Initial requirements

- R1: The app displays a grayscale map of a city
- R2: The user can select a starting location
- R3: The user can mark areas as explored, which reveals them in colour
- R4: Explored areas show street names
- R5: The user's exploration progress is saved between sessions

## Round 2 requirements

- R1 (changed): The map displays the real street layout of downtown Chicago (the Loop, South Loop, and Near West Side), not a synthetic 10x10 grid. It still renders in grayscale until explored.
- R6: The explorable unit is a real street segment — the stretch of an actual street between two real cross streets — sourced from a bundled local copy of Chicago's street-centerline data (no live API, downloaded once and committed to the repo).
- R7: The map shows the entire chosen area at a fixed scale; panning and zooming are not supported.

## Round 3 requirements

- R8: The map shows a handful of famous real landmarks (e.g. the Rookery Building, Union Station, the Chicago Theatre) to help users orient themselves. Landmarks are visual reference points only — they are not explorable and are always visible, regardless of exploration progress.
- R9: The map shows real CTA 'L' station locations, color-coded by the line(s) that serve each one. Like landmarks, stations are reference points only — not explorable, always visible.
- R10: Real park spaces (Grant Park and the South Loop's small pocket parks) are filled in on the map, same as the lake, so green space doesn't read as empty/missing area. Decorative only — not explorable.
