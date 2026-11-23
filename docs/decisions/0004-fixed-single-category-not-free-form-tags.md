# 0004: A pinned place gets one category from a fixed list, not free-form tags

## Context
R15 needs a way to categorize a pinned place. The two real options were a
small fixed list of categories (one per place) or free-form, user-typed
tags (possibly several per place).

## Decision
`CATEGORIES` is a fixed list of five values (food, shopping, park, photo
spot, other); `categorizePlace` rejects anything not in that list, and a
pin's `category` field holds exactly one value at a time.

## Why
A fixed, single-valued category is trivial to filter by later with no
cleanup: no typos, no near-duplicate tags ("coffee" vs "coffee shop"), and
no need to merge synonyms before a filter UI can group places sensibly.
Free-form multi-tagging is more expressive but trades that simplicity away
for normalization work this round doesn't need yet.

## Consequences
A place that genuinely spans two categories (e.g. a bakery that's also a
good photo spot) has to pick just one. If a future round needs richer
categorization, this is the decision to revisit first.
