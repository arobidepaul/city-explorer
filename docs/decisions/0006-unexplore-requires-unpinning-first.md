# 0006: Un-exploring a pinned place requires unpinning it first

## Context
R20 lets a user revert a mistakenly-explored segment back to unexplored.
A pinned place is also an explored segment, so the question is what
happens when the user tries to un-explore one: either automatically
unpin it (discarding its rating and category along the way), or refuse
and require the user to unpin it first via the existing R13 action.

## Decision
`unexploreSegment` is a no-op if the segment is currently pinned. The
"Un-explore this street" button doesn't even appear for a pinned
selection. The user has to click "Remove pin" (R13) first, which is a
separate, deliberate action, before un-exploring becomes available.

## Why
Un-exploring exists to undo a mistake in casual map-clicking, not to
manage pinned places. Auto-unpinning as a side effect would mean a
rating and category the user carefully set could be destroyed by an
action aimed at a completely different problem. Requiring an explicit
unpin first keeps data loss as something the user always chose on
purpose, never a side effect of something else.

## Consequences
Un-exploring a pinned place takes two clicks (unpin, then un-explore)
instead of one. The button for un-exploring simply isn't offered on a
pinned selection, rather than being offered and then silently failing
or needing a confirmation dialog.
