Operational docs and design history for the site.

- `STATUS.md` — the **current-state** doc: what's live, what's outstanding.
  Update this in the same commit that changes deploy state or ships a feature;
  it is not a changelog.
- `superpowers/specs/` and `superpowers/plans/` — dated design specs and
  build plans from past features (e.g. the two-pillar site). Historical record
  of *why* something was built a given way — not maintained after the feature
  ships, do not edit in place.

New operational facts go in `STATUS.md`; new design decisions for a
not-yet-built feature get a new dated file under `superpowers/specs/` or
`superpowers/plans/`, not an edit to an old one.
