# 0005: Show filter controls even when the filter matches no places

## Context
R19 lets the user filter "My places" to one category. When the chosen
category matches none of the user's pinned places, the list has to show
something. The two real options were hiding the filter controls
entirely (so it reads like a plain empty list) or keeping them visible
alongside an explicit empty-state message.

## Decision
Whenever at least one place is pinned at all, the filter row ("All" plus
one button per category) always renders, even if the active filter
matches zero of them. In that case the list shows "No places in this
category." instead of just rendering nothing.

## Why
Hiding the controls on an empty filtered result would leave the user
looking at a blank list with no visible way back to "All" short of
reloading the page or guessing to click where a button used to be.
Keeping the controls visible, plus a message that names the filter (not
a bug) as the reason nothing's shown, keeps the user in control of
getting back to a non-empty view.

## Consequences
`renderPlacesList` has to distinguish two different empty states: no
pins at all (hide the whole "My places" section) versus pins exist but
none match the current filter (show the filter row and an explicit
message). That's a small amount of extra branching the simpler
"hide on empty" approach wouldn't have needed.
