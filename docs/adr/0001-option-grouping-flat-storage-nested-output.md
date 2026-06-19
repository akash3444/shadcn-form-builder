# ADR 0001 — Option grouping: flat storage, nested output

Status: Accepted

## Context

`select` and `combobox` fields can organize their options under labeled group
headings ("Group options"). We needed a data model that supports:

- Drag-and-drop to reorder groups, reorder options within a group, and move
  options between groups.
- Code generation and a live preview that emit grouped UI
  (`SelectGroup`/`SelectLabel`, `ComboboxGroup`) when grouping is on.
- A lossless round-trip when grouping is toggled off and back on, and clean
  rehydration of state persisted before this feature existed.

Two obvious models were considered:

1. **Nested storage** — store options as `groups: { label, options: [] }[]`,
   nesting each option inside its group.
2. **Flat storage with an overlay** — keep `options` as a single flat array
   (unchanged from before the feature) and add a separate `groups` list plus a
   `groupId` on each option that references its group.

## Decision

Use **flat storage with an overlay** (model 2).

- `FieldOption.groupId?` points at the `OptionGroup` it belongs to. It is absent
  on ungrouped fields and on field types that never surface grouping.
- `GroupableField.groups?` holds the ordered group list. Absent/empty means
  grouping is off and the field renders as a flat list, exactly as before.
- `partitionByGroup()` is the single place that derives the nested
  `[{ label, items }]` shape from the flat options, used by both the preview and
  codegen. Empty groups are dropped from the output.

### Consequences

- **Ungrouped fields are untouched.** The `options` array keeps the same shape it
  always had, so existing fields, presets, persisted state, and all the
  non-grouped codegen paths need no migration — a missing `groups` rehydrates as
  `[]` (see `groupsOf`).
- **Drag-and-drop is uniform.** Reordering within a group, across groups, and
  reordering the groups themselves are all moves within one flat array plus a
  `groupId` reassignment, so dnd-kit's `arrayMove` over the full options array
  matches the live drop preview (see `moveOption` in the store).
- **Toggling grouping is lossless.** Turning grouping off drops `groups` and
  strips `groupId`, leaving the flat options intact; turning it back on wraps
  them into a single initial group.

### Generated/emitted shape

Grouped fields emit a nested constant:

```ts
const fooOptions = [
  { label: "Group A", items: [{ label: "One", value: "one" }] },
  // ...
]
```

The inner key is `items` (not `options`) because base-ui's combobox detects
grouping by checking `'items' in items[0]`; the `label` key is ours. For the
combobox, the committed value stays a plain string — base-ui is fed grouped
*value-strings* (`{ label, items: string[] }`) and labels are resolved against
the flattened option list.
