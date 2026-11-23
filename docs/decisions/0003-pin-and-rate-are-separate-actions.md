# 0003: Pinning and rating a place are separate actions

## Context
R11 says a pinned place is one the user has explored; R12 says a pinned
place can be rated 1-5 stars. Nothing in either requirement says a rating
has to be chosen at the moment of pinning.

## Decision
`pinPlace` creates a pin with `rating: null` (pinned, unrated). `ratePlace`
is a separate call that sets or changes the rating of an already-pinned
place. The UI mirrors this: clicking "Pin this place" pins it immediately
and only then shows the star-rating controls, rather than forcing a star
choice in the same step.

## Why
Forcing a rating at pin time would conflate "I want to remember this place"
with "I'm ready to judge it" -- a user exploring in the moment may want to
pin a place to come back to later without committing to a score yet. Making
rating a distinct, repeatable action also makes R13 ("a pin's rating can be
changed... at any time") the natural same code path as setting it the first
time, rather than a special case.

## Consequences
`isPinned` and `ratingFor` are separate queries (a place can be pinned with
no rating yet). Re-pinning an already-pinned place is defined as a no-op
specifically so it can never accidentally reset an existing rating back to
null.
