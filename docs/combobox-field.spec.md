# Combobox Field — Behavioral Specification

A behavior-first spec for the **combobox** field type. It describes *what must be
true*, not *how it is built*. Each section maps to a test layer
(store, schema, code-generator, schema-parity, live preview, e2e), but the
scenarios are written against observable behavior so the implementation can
change without rewriting them.

## Vocabulary

- **Field config** — the `ComboboxField` data object held in the store.
- **Single mode** — `multiple = false`; the value is a single string.
- **Multiple mode** — `multiple = true`; the value is an array of strings.
- **Display style** — `"input"` (always-visible search input) or `"trigger"`
  (a button that opens a popup). Orthogonal to mode → 4 render combinations.
- **Live preview** — the interactive form rendered in the right panel.
- **Generated code** — the self-contained TSX string emitted for copy/paste.
- **Option value** — the machine value stored when an option is chosen.
- **Option label** — the human-readable text shown for an option.

---

## 1. Adding a combobox field (store defaults)

- **1.1** Adding a combobox creates a field with `type: "combobox"`.
- **1.2** The new field's label is `"Combobox"` and its name is `"combobox"`.
- **1.3** If a field named `combobox` already exists, the new field's name is
  disambiguated (e.g. `combobox2`) — same uniqueness rule as every other field.
- **1.4** Defaults on a freshly added combobox:
  - `multiple = false`
  - `displayStyle = "input"`
  - `clearable = false`
  - `searchPlaceholder = "Search..."`
  - `emptyText = "No results found."`
  - `placeholder = ""`
  - `required = false`
  - `descriptionPosition = "below-control"`
  - `defaultValue` is unset (`undefined`)
- **1.5** It starts with exactly 2 options: `Option 1 / option-1` and
  `Option 2 / option-2`.
- **1.6** Adding a combobox selects it (it becomes the active field for config).

---

## 2. Options editing (shared options behavior)

The combobox uses the same options editor as select / radio-group /
checkbox-group. These scenarios must hold for it specifically.

- **2.1** Adding an option appends a uniquely-valued option (`option-3`, then
  `option-4`, …), skipping values that already exist.
- **2.2** Editing an option's label derives a slugified value
  (lowercase, spaces → `-`, non-alphanumerics stripped) until the value is
  edited directly.
- **2.3** Editing an option's value directly overrides the derived value.
- **2.4** An option can be removed.
- **2.5** The last remaining option cannot be removed (delete is disabled at one
  option).
- **2.6** Renaming an option's value clears any `defaultValue` that referenced
  the old value (see §5 for the mode-specific shape).
- **2.7** Removing an option clears/prunes any `defaultValue` that referenced the
  removed option (see §5).

---

## 3. Mode toggle (`multiple`) and value-shape integrity

- **3.1** Toggling `multiple` on flips the field's value shape from a single
  string to an array of strings.
- **3.2** Toggling `multiple` off flips it back from array to single string.
- **3.3** **Coerce default on single → multiple:** a single-string default
  becomes a one-element array (`"option-1"` → `["option-1"]`).
- **3.4** **Coerce default on multiple → single:** an array default becomes its
  first element (`["a","b"]` → `"a"`).
- **3.5** **Coerce edge — empty array:** multiple → single with an empty array
  default results in no default (`[]` → `undefined`).
- **3.6** **Coerce edge — no default set:** toggling either direction with no
  configured default leaves it unset.
- **3.7** After a toggle, the configured default is never left in the wrong shape
  (a single-mode field never holds an array default, and vice versa).
- **3.8** Toggling mode in the live preview re-initializes the form value so the
  control never receives a stale value of the wrong shape (no crash, no leftover
  selection of the wrong type).

---

## 4. Validation behavior

### Single mode
- **4.1** Optional single combobox: submitting with nothing selected is valid.
- **4.2** Required single combobox: submitting with nothing selected shows the
  error **"Please select an option"** and blocks submit.
- **4.3** Required single combobox: selecting any option clears the error and
  allows submit; the submitted value is the chosen option's value (a string).

### Multiple mode
- **4.4** Optional multiple combobox: submitting with nothing selected is valid
  and submits an empty array.
- **4.5** Required multiple combobox: submitting with nothing selected shows the
  error **"Select at least one option"** and blocks submit.
- **4.6** Required multiple combobox: selecting one or more options clears the
  error and allows submit; the submitted value is an array of the chosen values.

---

## 5. Default value editor (config panel)

- **5.1 (single)** The default-value editor offers a single-option picker listing
  the field's options plus a "no default" choice.
- **5.2 (single)** Choosing a default makes that option pre-selected on first
  render of the preview/generated form.
- **5.3 (single)** Clearing the default removes the pre-selection.
- **5.4 (multiple)** The default-value editor offers a multi-select of the field's
  options.
- **5.5 (multiple)** Selecting N options pre-selects exactly those on first render.
- **5.6 (multiple)** A multiple default with all selections removed results in no
  default (empty array → unset).
- **5.7** A default can only reference values that currently exist as options;
  editing/removing options reconciles the default (ties back to §2.6 / §2.7).

---

## 6. Rendering — the 4 combinations

The combobox renders identically in the live preview and the generated code
(same observable structure). For each combination, the listed affordances must
be present and behave as described.

### 6.1 Single + `input`
- Always-visible search input.
- Typing filters the option list by label.
- Choosing an option fills the control with that option's **label** and stores
  its **value**.
- The control's placeholder uses the field's `placeholder` (falling back to a
  sensible default when empty).

### 6.2 Single + `trigger`
- A button-styled trigger showing the selected option's **label**, or the
  placeholder when nothing is selected.
- Activating the trigger opens a popup containing a search input and the list.
- Choosing an option closes/updates the trigger to that option's label.

### 6.3 Multiple + `input`
- Selected options appear as inline **chips**, each removable individually.
- An inline input allows typing to filter and add more.
- Removing a chip removes that value from the selection.

### 6.4 Multiple + `trigger`
- A button-styled trigger summarizing the selection (e.g. "N selected" /
  placeholder when empty).
- The popup lists options as a checkable list; selected options are marked.
- Toggling an option in the list adds/removes it from the selection.

### Shared across all 4
- **6.5** The search input's placeholder is the field's `searchPlaceholder`.
- **6.6** When the search matches no options, the `emptyText` message is shown.
- **6.7** When `clearable = true`, a clear (✕) affordance is present that resets
  the selection (to empty string in single mode, empty array in multiple mode).
- **6.8** When `clearable = false`, no clear affordance is present.
- **6.9** The field label, required asterisk, description (respecting
  `above-control` / `below-control`), and error message render in the same
  positions as other fields.

---

## 7. Generated code correctness

- **7.1** The generated code imports the combobox sub-components from
  `@/components/ui/combobox`, and imports **only** the sub-components actually
  used by the chosen mode/display-style.
- **7.2** The generated code emits an options constant (e.g.
  `COMBOBOX_OPTIONS`) and references it, consistent with select/radio/checkbox-group.
- **7.3** The generated code is valid TSX that parses and runs (per the existing
  parse/compile test harness) for every mode × display-style combination.
- **7.4** The generated Zod schema matches §4 exactly:
  - single → `z.string()`; required adds `.min(1, "Please select an option")`.
  - multiple → `z.array(z.string())`; required adds
    `.min(1, "Select at least one option")`; optional defaults to `[]`.
- **7.5** The generated default values match §5: single → the chosen value or
  `""`; multiple → the chosen array or `[]`.
- **7.6** Option labels/values and the editable text (`searchPlaceholder`,
  `emptyText`, `placeholder`, label, description) are correctly escaped in the
  generated JSX (no breakage from quotes, `{`, `}`, `<`, `>`, `&`).

---

## 8. Schema parity (preview ≡ generated)

- **8.1** For any combobox config, the live preview's runtime Zod schema and the
  generated code's Zod schema are equivalent (accept/reject the same inputs with
  the same messages) — in both modes, required and optional.
- **8.2** The live preview's default values and the generated default values are
  equivalent for the same config — in both modes.

---

## 9. Palette presence

- **9.1** A "Combobox" card appears in the field palette with the `TextSearch`
  icon and description "Searchable option picker", positioned immediately after
  the "Select" card.
- **9.2** Clicking the card adds a combobox field with the §1 defaults.

---

## 10. Persistence & lifecycle (shared field behavior)

- **10.1** A combobox field survives a store reload (localStorage persist) with
  all config intact: mode, display style, options, default, and the editable text.
- **10.2** A combobox field can be reordered among other fields via drag.
- **10.3** A combobox field can be deleted, and deleting the active field clears
  the active selection.
- **10.4** Two combobox fields keep distinct `name`s (uniqueness preserved across
  adds and label-driven renames).

---

## Out of scope (explicitly not covered in v1)

- Async / remote option loading.
- Grouped options / separators inside the list.
- Free-text entry of values not present in the options (create-on-the-fly).
- Per-option disabled state.
- Custom rendering of option rows beyond label text.
