import type {
  CheckboxField,
  CheckboxGroupField,
  ComboboxField,
  ComboboxDisplayStyle,
  DateField,
  DescriptionPosition,
  FieldOption,
  FormField,
  GroupOrientation,
  InputField,
  InputType,
  NumberValidation,
  PasswordField,
  RadioGroupField,
  SelectField,
  SliderField,
  StringValidation,
  SwitchField,
  TextareaField,
} from "../types"
import { FORM_PRESETS } from "../presets"

/**
 * Field configurations fed to the codegen type-check harness
 * (scripts/typecheck-codegen.ts). Each fixture is generated under every form
 * library and compiled against the real `@/components/ui/*` types, so the matrix
 * aims to drive every branch the generators can take.
 *
 * Coverage strategy: the generators build the Zod schema and the JSX
 * independently, so we cross axes that change the SAME output (required × min ×
 * max; multiple × displayStyle × clearable) but not two independent axes (a
 * validation value against a description position tests nothing new). Anything
 * that changes the inferred TS type — required/optional, scalar-vs-array,
 * combobox `multiple`, and configured defaults — IS crossed with the binding
 * layer, because that interaction is where the type errors hide.
 */

export interface CodegenFixture {
  /** Stable, file-safe identifier used in harness output and `--write` names. */
  name: string
  formName: string
  submitLabel: string
  fields: FormField[]
}

let optionSeq = 0
function opt(label: string, value: string, groupId?: string): FieldOption {
  return { id: `opt-${optionSeq++}`, label, value, ...(groupId ? { groupId } : {}) }
}

const baseDefaults = {
  placeholder: "",
  description: "",
  descriptionPosition: "below-control" as const,
  required: false,
}

function input(name: string, over: Partial<InputField> = {}): InputField {
  return { id: name, type: "input", inputType: "text", label: name, name, ...baseDefaults, ...over }
}
function password(name: string, over: Partial<PasswordField> = {}): PasswordField {
  return { id: name, type: "password", showToggle: true, label: name, name, ...baseDefaults, ...over }
}
function textarea(name: string, over: Partial<TextareaField> = {}): TextareaField {
  return { id: name, type: "textarea", label: name, name, rows: 4, ...baseDefaults, ...over }
}
function checkbox(name: string, over: Partial<CheckboxField> = {}): CheckboxField {
  return { id: name, type: "checkbox", label: name, name, ...baseDefaults, ...over }
}
function toggle(name: string, over: Partial<SwitchField> = {}): SwitchField {
  return { id: name, type: "switch", label: name, name, ...baseDefaults, ...over }
}
const sampleOptions = (): FieldOption[] => [
  opt("One", "one"),
  opt("Two", "two"),
  opt("Three", "three"),
]

// A grouped option set: two named groups plus a third blank-labeled group, so
// the harness compiles the labeled-heading and unlabeled-section code paths.
const groupedParts = (): { groups: SelectField["groups"]; options: FieldOption[] } => ({
  groups: [
    { id: "g1", label: "Group One" },
    { id: "g2", label: "Group Two" },
    { id: "g3", label: "" },
  ],
  options: [
    { id: "go1", label: "One", value: "one", groupId: "g1" },
    { id: "go2", label: "Two", value: "two", groupId: "g1" },
    { id: "go3", label: "Three", value: "three", groupId: "g2" },
    { id: "go4", label: "Four", value: "four", groupId: "g3" },
  ],
})
function select(name: string, over: Partial<SelectField> = {}): SelectField {
  return { id: name, type: "select", label: name, name, options: sampleOptions(), ...baseDefaults, ...over }
}
function radioGroup(name: string, over: Partial<RadioGroupField> = {}): RadioGroupField {
  return { id: name, type: "radio-group", label: name, name, options: sampleOptions(), orientation: "vertical", ...baseDefaults, ...over }
}
function checkboxGroup(name: string, over: Partial<CheckboxGroupField> = {}): CheckboxGroupField {
  return { id: name, type: "checkbox-group", label: name, name, options: sampleOptions(), orientation: "vertical", ...baseDefaults, ...over }
}
function slider(name: string, over: Partial<SliderField> = {}): SliderField {
  return { id: name, type: "slider", label: name, name, min: 0, max: 100, step: 1, ...baseDefaults, ...over }
}
function combobox(name: string, over: Partial<ComboboxField> = {}): ComboboxField {
  return {
    id: name,
    type: "combobox",
    label: name,
    name,
    options: sampleOptions(),
    multiple: false,
    displayStyle: "trigger",
    searchPlaceholder: "",
    emptyText: "",
    clearable: false,
    ...baseDefaults,
    ...over,
  }
}
function date(name: string, over: Partial<DateField> = {}): DateField {
  return {
    id: name,
    type: "date",
    label: name,
    name,
    mode: "single",
    captionLayout: "label",
    disablePastDates: false,
    disableWeekends: false,
    ...baseDefaults,
    ...over,
  }
}

// ---- Combination axes ------------------------------------------------------

const REQ = [
  { tag: "required", required: true },
  { tag: "optional", required: false },
] as const

const STRING_VALIDATIONS: { tag: string; v: StringValidation }[] = [
  { tag: "noval", v: {} },
  { tag: "min", v: { minLength: 3 } },
  { tag: "max", v: { maxLength: 20 } },
  { tag: "minmax", v: { minLength: 3, maxLength: 20 } },
]

const NUMBER_VALIDATIONS: { tag: string; v: NumberValidation }[] = [
  { tag: "noval", v: {} },
  { tag: "min", v: { min: 1 } },
  { tag: "max", v: { max: 10 } },
  { tag: "minmax", v: { min: 1, max: 10 } },
]

const DESC: { tag: string; description: string; descriptionPosition: DescriptionPosition }[] = [
  { tag: "above", description: "Helpful guidance text", descriptionPosition: "above-control" },
  { tag: "below", description: "Helpful guidance text", descriptionPosition: "below-control" },
]

const ORIENTATIONS: GroupOrientation[] = ["vertical", "horizontal"]

// ---- Fixture assembly ------------------------------------------------------

const fixtures: CodegenFixture[] = []
const one = (name: string, field: FormField, formName = name) =>
  fixtures.push({ name, formName, submitLabel: "Save", fields: [field] })

// Number inputs: required/optional × {none, min, max, min+max}, plus defaults.
for (const r of REQ)
  for (const val of NUMBER_VALIDATIONS)
    one(`input-number-${r.tag}-${val.tag}`, input("value", { inputType: "number", required: r.required, validation: val.v }))
one("input-number-required-default", input("value", { inputType: "number", required: true, defaultValue: 5 }))
one("input-number-optional-default", input("value", { inputType: "number", required: false, defaultValue: 5 }))

// Text inputs: required/optional × {none, min, max, min+max} (required+min and
// optional+min take different schema paths), plus a configured default.
for (const r of REQ)
  for (const val of STRING_VALIDATIONS)
    one(`input-text-${r.tag}-${val.tag}`, input("value", { inputType: "text", required: r.required, validation: val.v }))
one("input-text-default", input("value", { defaultValue: "hello" }))

// Email/URL: required/optional × {none, min+max} — confirms the type-specific
// `.email()` / `.url()` op composes with required/optional and length checks.
for (const t of ["email", "url"] as InputType[])
  for (const r of REQ)
    for (const val of [NUMBER_VALIDATIONS[0], STRING_VALIDATIONS[3]] as { tag: string; v: StringValidation }[])
      one(`input-${t}-${r.tag}-${val.tag}`, input("value", { inputType: t, required: r.required, validation: val.v }))

// Tel: required/optional (string validation already covered by text).
for (const t of ["tel"] as InputType[])
  for (const r of REQ)
    one(`input-${t}-${r.tag}`, input("value", { inputType: t, required: r.required }))

// Password: its own field type. Cross required/optional × toggle on/off (the
// toggle drives the InputGroup + useState import path), plus a length-validated
// case. A multi-password fixture confirms the per-field state vars stay unique.
for (const r of REQ)
  for (const tog of [true, false])
    one(
      `password-${r.tag}-toggle-${tog}`,
      password("value", { required: r.required, showToggle: tog })
    )
one("password-minmax", password("value", { validation: { minLength: 8, maxLength: 64 } }))
fixtures.push({
  name: "password-multi",
  formName: "password-multi",
  submitLabel: "Save",
  fields: [
    password("password", { required: true }),
    password("confirmPassword", { required: true }),
  ],
})

// Input description placement (the `descEl` + FieldDescription import path).
for (const d of DESC)
  one(`input-text-desc-${d.tag}`, input("value", { description: d.description, descriptionPosition: d.descriptionPosition }))

// Textarea: distinct JSX branch; required/optional × validation, descriptions, default.
for (const r of REQ)
  for (const val of STRING_VALIDATIONS)
    one(`textarea-${r.tag}-${val.tag}`, textarea("value", { required: r.required, validation: val.v }))
for (const d of DESC)
  one(`textarea-desc-${d.tag}`, textarea("value", { description: d.description, descriptionPosition: d.descriptionPosition }))
one("textarea-default", textarea("value", { defaultValue: "prefilled" }))

// Checkbox / switch: required/optional, boolean defaults, and the `descInner`
// path (these two are the only fields that render a description that way).
for (const r of REQ) {
  one(`checkbox-${r.tag}`, checkbox("value", { required: r.required }))
  one(`switch-${r.tag}`, toggle("value", { required: r.required }))
}
for (const def of [true, false]) {
  one(`checkbox-default-${def}`, checkbox("value", { defaultValue: def }))
  one(`switch-default-${def}`, toggle("value", { defaultValue: def }))
}
one("checkbox-desc", checkbox("value", { description: "I agree to the terms" }))
one("switch-desc", toggle("value", { description: "Enable notifications" }))
one("checkbox-required-desc", checkbox("value", { required: true, description: "Required consent" }))

// Select: required/optional, default, description placement.
for (const r of REQ) one(`select-${r.tag}`, select("value", { required: r.required }))
one("select-default", select("value", { defaultValue: "two" }))
for (const d of DESC)
  one(`select-desc-${d.tag}`, select("value", { description: d.description, descriptionPosition: d.descriptionPosition }))

// Radio group: required/optional × orientation, default, description.
for (const r of REQ)
  for (const o of ORIENTATIONS)
    one(`radio-${r.tag}-${o}`, radioGroup("value", { required: r.required, orientation: o }))
one("radio-default", radioGroup("value", { defaultValue: "two" }))
for (const d of DESC)
  one(`radio-desc-${d.tag}`, radioGroup("value", { description: d.description, descriptionPosition: d.descriptionPosition }))

// Checkbox group (array base): required/optional × orientation, array default, description.
for (const r of REQ)
  for (const o of ORIENTATIONS)
    one(`checkbox-group-${r.tag}-${o}`, checkboxGroup("value", { required: r.required, orientation: o }))
one("checkbox-group-default", checkboxGroup("value", { defaultValue: ["one", "two"] }))
for (const d of DESC)
  one(`checkbox-group-desc-${d.tag}`, checkboxGroup("value", { description: d.description, descriptionPosition: d.descriptionPosition }))

// Slider: range/step variations, default, description.
one("slider-basic", slider("value", { min: 0, max: 100, step: 1 }))
one("slider-custom-step", slider("value", { min: 0, max: 10, step: 0.5 }))
one("slider-negative", slider("value", { min: -50, max: 50, step: 5 }))
one("slider-default", slider("value", { min: 0, max: 100, step: 1, defaultValue: 25 }))
for (const d of DESC)
  one(`slider-desc-${d.tag}`, slider("value", { description: d.description, descriptionPosition: d.descriptionPosition }))

// Combobox: multiple × displayStyle × clearable (the full output matrix), plus
// required and default variants for both the scalar and array shapes.
for (const multiple of [false, true])
  for (const displayStyle of ["trigger", "input"] as ComboboxDisplayStyle[])
    for (const clearable of [false, true])
      one(
        `combobox-${multiple ? "multiple" : "single"}-${displayStyle}${clearable ? "-clearable" : ""}`,
        combobox("value", { multiple, displayStyle, clearable })
      )
one("combobox-single-required", combobox("value", { multiple: false, displayStyle: "trigger", required: true }))
one("combobox-multiple-required", combobox("value", { multiple: true, displayStyle: "input", required: true }))
one("combobox-single-default", combobox("value", { multiple: false, displayStyle: "trigger", defaultValue: "two" }))
one("combobox-multiple-default", combobox("value", { multiple: true, displayStyle: "input", defaultValue: ["one", "two"] }))
one("combobox-custom-text", combobox("value", { multiple: false, displayStyle: "input", searchPlaceholder: "Type to filter <fast>", emptyText: "Nothing & nada {0}" }))

// Grouping (select & combobox) — exercises the nested `[{ label, items }]`
// constant and the SelectGroup/ComboboxGroup render paths under every variant.
one("select-grouped", select("value", groupedParts()))
one("select-grouped-default", select("value", { ...groupedParts(), defaultValue: "three" }))
one("combobox-grouped-trigger", combobox("value", { multiple: false, displayStyle: "trigger", ...groupedParts() }))
one("combobox-grouped-input", combobox("value", { multiple: false, displayStyle: "input", ...groupedParts() }))
one("combobox-grouped-multiple", combobox("value", { multiple: true, displayStyle: "input", ...groupedParts() }))
// Edge cases: a single group; an empty group (must be dropped from output); a
// fully empty grouped field (degenerate but must still compile); and a group
// label needing escaping.
one("select-grouped-single", select("value", {
  groups: [{ id: "g1", label: "Only" }],
  options: [opt("A", "a", "g1"), opt("B", "b", "g1")],
}))
one("select-grouped-empty-group", select("value", {
  groups: [{ id: "g1", label: "Has Items" }, { id: "g2", label: "Empty" }],
  options: [opt("A", "a", "g1"), opt("B", "b", "g1")],
}))
one("select-grouped-all-empty", select("value", {
  groups: [{ id: "g1", label: "Empty" }],
  options: [],
}))
one("select-grouped-escaping", select("value", {
  groups: [{ id: "g1", label: 'Fruits & "Veg" <x> {0}' }],
  options: [opt("Apple", "apple", "g1")],
}))
one("combobox-grouped-single", combobox("value", {
  multiple: false,
  displayStyle: "input",
  groups: [{ id: "g1", label: "Only" }],
  options: [opt("A", "a", "g1"), opt("B", "b", "g1")],
}))

// Date: single/range × required (drives the `z.date()` vs `z.object({from,to})`
// schema branch and the Date-vs-DateRange binding), the matcher/disabled paths
// (min/max/past/weekends), the caption-layout prop, and configured defaults
// (which emit `parseISO(...)` and pull in the date-fns import).
for (const mode of ["single", "range"] as const)
  for (const r of REQ)
    one(`date-${mode}-${r.tag}`, date("value", { mode, required: r.required }))
one("date-single-bounds", date("value", { minDate: "2026-01-01", maxDate: "2026-12-31" }))
one("date-single-no-past", date("value", { disablePastDates: true }))
one("date-single-no-weekends", date("value", { disableWeekends: true }))
one("date-single-all-rules", date("value", { required: true, minDate: "2026-01-01", maxDate: "2026-12-31", disablePastDates: true, disableWeekends: true }))
one("date-single-dropdown", date("value", { captionLayout: "dropdown", minDate: "2020-01-01", maxDate: "2030-12-31" }))
one("date-single-default", date("value", { defaultValue: "2026-06-16" }))
one("date-range-all-rules", date("value", { mode: "range", required: true, minDate: "2026-01-01", maxDate: "2026-12-31", disableWeekends: true }))
one("date-range-default", date("value", { mode: "range", defaultValue: { from: "2026-06-01", to: "2026-06-16" } }))
for (const d of DESC)
  one(`date-desc-${d.tag}`, date("value", { description: d.description, descriptionPosition: d.descriptionPosition }))

// Empty label → codegen falls back to "Field".
one("empty-label", input("value", { label: "" }))

// ---- Escaping: JSX-significant characters in every text-bearing slot --------

fixtures.push({
  name: "escaping-text",
  formName: 'Escaping <Form> & "Co"',
  submitLabel: 'Submit <now> & "go"',
  fields: [
    input("tricky", {
      label: 'Name <with> {braces} & "quotes"',
      placeholder: 'Type "here" <please>',
      description: "Use a & b {c} <d>",
    }),
  ],
})
fixtures.push({
  name: "escaping-multiline-placeholder",
  formName: "Escaping Multiline",
  submitLabel: "Save",
  fields: [textarea("notes", { placeholder: "Line one\nLine two\nLine three" })],
})
fixtures.push({
  name: "escaping-option-labels",
  formName: "Escaping Options",
  submitLabel: "Save",
  fields: [
    select("choice", {
      required: true,
      options: [opt('A & B <x>', "a-b"), opt('Quote "me"', "quote"), opt("Braces {x}", "braces")],
    }),
    combobox("multiTricky", {
      multiple: true,
      displayStyle: "input",
      options: [opt('Tag <1> & "2"', "t1"), opt("Tag {3}", "t2")],
    }),
  ],
})

// ---- Composite & real ------------------------------------------------------

fixtures.push({
  name: "kitchen-sink",
  formName: "Kitchen Sink",
  submitLabel: "Submit Everything",
  fields: [
    input("text", { required: true, description: "above", descriptionPosition: "above-control" }),
    input("count", { inputType: "number", validation: { min: 0, max: 5 } }),
    textarea("message", { rows: 5 }),
    checkbox("terms", { required: true }),
    toggle("subscribe"),
    select("category", { required: true }),
    radioGroup("priority", { orientation: "horizontal" }),
    checkboxGroup("interests", { required: true }),
    slider("rating", { min: 1, max: 5, step: 1 }),
    combobox("assignee", { displayStyle: "trigger", clearable: true }),
    combobox("labels", { multiple: true, displayStyle: "input" }),
  ],
})

for (const preset of FORM_PRESETS)
  fixtures.push({
    name: `preset-${preset.id}`,
    formName: preset.formName,
    submitLabel: preset.submitLabel,
    fields: preset.fields,
  })

// Field names double as virtual-file names in the harness; a collision would
// silently overwrite a case, so fail loudly instead.
const seen = new Set<string>()
for (const f of fixtures) {
  if (seen.has(f.name)) throw new Error(`Duplicate codegen fixture name: ${f.name}`)
  seen.add(f.name)
}

export const CODEGEN_FIXTURES: CodegenFixture[] = fixtures
