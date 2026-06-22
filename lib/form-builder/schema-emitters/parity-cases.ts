/**
 * The cross-library parity variation matrix — the single source of truth shared
 * by the runtime parity test suite (./parity.test.ts) and the /dev/schema-parity
 * inspection page (app/dev/schema-parity/page.tsx).
 *
 * Every field shape the builder can produce is represented as one Variation: the
 * field itself plus the meaningful inputs to throw at it (each valid shape + each
 * way to be invalid), each pinned to an `expected` accept/reject verdict. The
 * test asserts all three emitted schemas (and the live Zod preview oracle) reach
 * that verdict; the page renders the same matrix and runs the verdicts live.
 *
 * Variations are organised into display groups (field families). The grouping is
 * cosmetic — the test flattens it; the page uses it for sidebar sections.
 */
import type {
  CheckboxField,
  CheckboxGroupField,
  ComboboxField,
  DateField,
  FormField,
  InputField,
  PasswordField,
  RadioGroupField,
  SelectField,
  SliderField,
  SwitchField,
  TextareaField,
  FieldOption,
} from "../types"

// ---------------------------------------------------------------------------
// Field builders — every field is the single field "value" in its form, so the
// emitted object schema is always `{ value: … }` and inputs wrap under that key.
// ---------------------------------------------------------------------------

const base = {
  id: "value",
  label: "value",
  name: "value",
  placeholder: "",
  description: "",
  descriptionPosition: "below-control" as const,
  required: false,
}

const opts: FieldOption[] = [
  { id: "o1", label: "One", value: "one" },
  { id: "o2", label: "Two", value: "two" },
]

const input = (o: Partial<InputField> = {}): InputField => ({
  ...base, type: "input", inputType: "text", ...o,
})
const password = (o: Partial<PasswordField> = {}): PasswordField => ({
  ...base, type: "password", showToggle: true, ...o,
})
const textarea = (o: Partial<TextareaField> = {}): TextareaField => ({
  ...base, type: "textarea", rows: 4, ...o,
})
const checkbox = (o: Partial<CheckboxField> = {}): CheckboxField => ({
  ...base, type: "checkbox", ...o,
})
const switchF = (o: Partial<SwitchField> = {}): SwitchField => ({
  ...base, type: "switch", ...o,
})
const select = (o: Partial<SelectField> = {}): SelectField => ({
  ...base, type: "select", options: opts, ...o,
})
const radio = (o: Partial<RadioGroupField> = {}): RadioGroupField => ({
  ...base, type: "radio-group", options: opts, orientation: "vertical", ...o,
})
const checkboxGroup = (o: Partial<CheckboxGroupField> = {}): CheckboxGroupField => ({
  ...base, type: "checkbox-group", options: opts, orientation: "vertical", ...o,
})
const slider = (o: Partial<SliderField> = {}): SliderField => ({
  ...base, type: "slider", min: 0, max: 100, step: 1, ...o,
})
const combobox = (o: Partial<ComboboxField> = {}): ComboboxField => ({
  ...base, type: "combobox", options: opts, multiple: false, displayStyle: "trigger",
  searchPlaceholder: "", emptyText: "", clearable: false, ...o,
})
const date = (o: Partial<DateField> = {}): DateField => ({
  ...base, type: "date", mode: "single", captionLayout: "label",
  disablePastDates: false, disableWeekends: false, ...o,
})

// Absolute dates, chosen so verdicts don't depend on the wall clock.
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day)
const SATURDAY = d(2026, 6, 20) // 2026-06-20 is a Saturday
const SUNDAY = d(2026, 6, 21) // 2026-06-21 is a Sunday
const WEEKDAY = d(2026, 6, 17) // 2026-06-17 is a Wednesday
const LONG_PAST = d(2000, 1, 3) // clearly in the past on any run date (a Monday)
const FAR_FUTURE = d(2099, 1, 5) // clearly in the future (a Monday)

// ---------------------------------------------------------------------------
// Variation matrix
// ---------------------------------------------------------------------------

export interface Case {
  desc: string
  input: unknown
  expected: boolean
}

export interface Variation {
  name: string
  /** The display group (field family) this variation belongs to. */
  group: string
  field: FormField
  cases: Case[]
}

const A = (desc: string, input: unknown): Case => ({ desc, input, expected: true })
const R = (desc: string, input: unknown): Case => ({ desc, input, expected: false })

interface VariationGroup {
  group: string
  variations: Omit<Variation, "group">[]
}

const variationGroups: VariationGroup[] = [
  // ---- Text input (string base) -----------------------------------------
  {
    group: "Text input",
    variations: [
      {
        name: "input text · optional · no validation",
        field: input({ required: false }),
        cases: [A("empty string", ""), A("any text", "hello")],
      },
      {
        name: "input text · required",
        field: input({ required: true }),
        cases: [R("empty string", ""), A("non-empty", "a")],
      },
      {
        name: "input text · optional · minLength 3 (refineOptionalMin path)",
        field: input({ required: false, validation: { minLength: 3 } }),
        cases: [A("empty allowed when optional", ""), R("too short", "ab"), A("at min", "abc")],
      },
      {
        name: "input text · required · minLength 3",
        field: input({ required: true, validation: { minLength: 3 } }),
        cases: [R("empty", ""), R("too short", "ab"), A("at min", "abc")],
      },
      {
        name: "input text · optional · maxLength 5",
        field: input({ required: false, validation: { maxLength: 5 } }),
        cases: [A("empty", ""), A("at max", "abcde"), R("too long", "abcdef")],
      },
      {
        name: "input text · required · maxLength 5",
        field: input({ required: true, validation: { maxLength: 5 } }),
        cases: [R("empty", ""), A("ok", "ab"), R("too long", "abcdef")],
      },
      {
        name: "input text · required · minLength 3 + maxLength 5",
        field: input({ required: true, validation: { minLength: 3, maxLength: 5 } }),
        cases: [R("empty", ""), R("too short", "ab"), A("in range", "abcd"), R("too long", "abcdef")],
      },
      {
        name: "input text · optional · minLength 3 + maxLength 5",
        field: input({ required: false, validation: { minLength: 3, maxLength: 5 } }),
        cases: [A("empty allowed", ""), R("too short", "ab"), A("in range", "abcd"), R("too long", "abcdef")],
      },
    ],
  },

  // ---- Email / URL (string subtype) -------------------------------------
  {
    group: "Email / URL",
    variations: [
      {
        name: "input email · optional",
        field: input({ required: false, inputType: "email" }),
        cases: [R("empty fails email", ""), R("not an email", "nope"), A("valid email", "a@b.com")],
      },
      {
        name: "input email · required",
        field: input({ required: true, inputType: "email" }),
        cases: [R("empty", ""), R("invalid", "nope"), A("valid", "a@b.com")],
      },
      {
        name: "input email · required · minLength 3 + maxLength 20",
        field: input({ required: true, inputType: "email", validation: { minLength: 3, maxLength: 20 } }),
        cases: [R("invalid", "nope"), A("valid in range", "a@b.com"), R("valid but too long", "abcdefghij@example.com")],
      },
      {
        name: "input email · optional · minLength 3 + maxLength 20 (refineOptionalMin keeps subtype + max)",
        field: input({ required: false, inputType: "email", validation: { minLength: 3, maxLength: 20 } }),
        cases: [
          R("not an email (subtype must survive)", "nope"),
          A("valid email in range", "a@b.com"),
          R("valid email but too long (max must survive)", "abcdefghij@example.com"),
        ],
      },
      {
        name: "input url · optional",
        field: input({ required: false, inputType: "url" }),
        cases: [R("empty fails url", ""), R("not a url", "nope"), A("valid url", "https://x.com")],
      },
      {
        name: "input url · required",
        field: input({ required: true, inputType: "url" }),
        cases: [R("empty", ""), R("invalid", "nope"), A("valid", "https://x.com")],
      },
      {
        name: "input tel · required (plain string)",
        field: input({ required: true, inputType: "tel" }),
        cases: [R("empty", ""), A("any non-empty", "123")],
      },
    ],
  },

  // ---- Number input -----------------------------------------------------
  {
    group: "Number",
    variations: [
      {
        name: "input number · optional · no validation",
        field: input({ required: false, inputType: "number" }),
        cases: [A("undefined (empty optional)", undefined), A("a number", 5), R("a string", "5")],
      },
      {
        name: "input number · required",
        field: input({ required: true, inputType: "number" }),
        cases: [R("undefined", undefined), A("a number", 5), R("a string", "5")],
      },
      {
        name: "input number · optional · min 1",
        field: input({ required: false, inputType: "number", validation: { min: 1 } }),
        cases: [A("undefined", undefined), R("below min", 0), A("at min", 1)],
      },
      {
        name: "input number · required · min 1 + max 10",
        field: input({ required: true, inputType: "number", validation: { min: 1, max: 10 } }),
        cases: [R("undefined", undefined), R("below", 0), A("at min", 1), A("at max", 10), R("above", 11)],
      },
      {
        name: "input number · optional · min 1 + max 10",
        field: input({ required: false, inputType: "number", validation: { min: 1, max: 10 } }),
        cases: [A("undefined", undefined), R("below", 0), A("in range", 5), R("above", 11)],
      },
      {
        name: "input number · required · max 10 only",
        field: input({ required: true, inputType: "number", validation: { max: 10 } }),
        cases: [R("undefined", undefined), A("at max", 10), R("above", 11), A("negative ok", -3)],
      },
    ],
  },

  // ---- Password / textarea (string base, distinct field types) ----------
  {
    group: "Password / Textarea",
    variations: [
      {
        name: "password · required · minLength 8 + maxLength 64",
        field: password({ required: true, validation: { minLength: 8, maxLength: 64 } }),
        cases: [R("empty", ""), R("too short", "short"), A("ok", "longenough")],
      },
      {
        name: "textarea · required · maxLength 5",
        field: textarea({ required: true, validation: { maxLength: 5 } }),
        cases: [R("empty", ""), A("ok", "ab"), R("too long", "abcdef")],
      },
      {
        name: "textarea · optional · minLength 3",
        field: textarea({ required: false, validation: { minLength: 3 } }),
        cases: [A("empty allowed", ""), R("too short", "ab"), A("at min", "abc")],
      },
    ],
  },

  // ---- Boolean (checkbox / switch) --------------------------------------
  {
    group: "Boolean",
    variations: [
      {
        name: "checkbox · optional",
        field: checkbox({ required: false }),
        cases: [A("false", false), A("true", true)],
      },
      {
        name: "checkbox · required (must be true)",
        field: checkbox({ required: true }),
        cases: [R("false", false), A("true", true)],
      },
      {
        name: "switch · required (must be true)",
        field: switchF({ required: true }),
        cases: [R("false", false), A("true", true)],
      },
    ],
  },

  // ---- Select / radio (string, option) ----------------------------------
  {
    group: "Select / Radio",
    variations: [
      {
        name: "select · optional",
        field: select({ required: false }),
        cases: [A("empty", ""), A("an option", "one")],
      },
      {
        name: "select · required",
        field: select({ required: true }),
        cases: [R("empty (nothing selected)", ""), A("an option", "one")],
      },
      {
        name: "radio · required",
        field: radio({ required: true }),
        cases: [R("empty", ""), A("an option", "one")],
      },
    ],
  },

  // ---- Array bases (checkbox-group, combobox multiple) ------------------
  {
    group: "Array",
    variations: [
      {
        name: "checkbox-group · optional",
        field: checkboxGroup({ required: false }),
        cases: [A("empty array", []), A("with items", ["one"])],
      },
      {
        name: "checkbox-group · required",
        field: checkboxGroup({ required: true }),
        cases: [R("empty array", []), A("with items", ["one"])],
      },
      {
        name: "combobox multiple · required",
        field: combobox({ required: true, multiple: true, displayStyle: "input" }),
        cases: [R("empty array", []), A("with items", ["one"])],
      },
      {
        name: "combobox multiple · optional",
        field: combobox({ required: false, multiple: true, displayStyle: "input" }),
        cases: [A("empty array", []), A("with items", ["one"])],
      },
    ],
  },

  // ---- Combobox single (string) -----------------------------------------
  {
    group: "Combobox single",
    variations: [
      {
        name: "combobox single · optional",
        field: combobox({ required: false, multiple: false }),
        cases: [A("empty", ""), A("an option", "one")],
      },
      {
        name: "combobox single · required",
        field: combobox({ required: true, multiple: false }),
        cases: [R("empty", ""), A("an option", "one")],
      },
    ],
  },

  // ---- Slider (bounded number, always present) --------------------------
  {
    group: "Slider",
    variations: [
      {
        name: "slider · 0..100",
        field: slider({ min: 0, max: 100 }),
        cases: [A("at min", 0), A("middle", 50), A("at max", 100), R("below min", -1), R("above max", 101)],
      },
      {
        name: "slider · negative range -50..50",
        field: slider({ min: -50, max: 50, step: 5 }),
        cases: [A("at min", -50), A("zero", 0), A("at max", 50), R("below", -51), R("above", 51)],
      },
    ],
  },

  // ---- Date single ------------------------------------------------------
  {
    group: "Date single",
    variations: [
      {
        name: "date single · optional",
        field: date({ required: false }),
        cases: [A("undefined (empty optional)", undefined), A("a date", WEEKDAY)],
      },
      {
        name: "date single · required",
        field: date({ required: true }),
        cases: [R("undefined", undefined), A("a date", WEEKDAY)],
      },
      {
        name: "date single · minDate 2026-01-01",
        field: date({ minDate: "2026-01-01" }),
        cases: [R("before min", d(2025, 12, 31)), A("on min", d(2026, 1, 1)), A("after min", WEEKDAY)],
      },
      {
        name: "date single · maxDate 2026-12-31",
        field: date({ maxDate: "2026-12-31" }),
        cases: [A("before max", WEEKDAY), A("on max", d(2026, 12, 31)), R("after max", d(2027, 1, 1))],
      },
      {
        name: "date single · disablePastDates",
        field: date({ disablePastDates: true }),
        cases: [R("long past", LONG_PAST), A("far future", FAR_FUTURE)],
      },
      {
        name: "date single · disableWeekends",
        field: date({ disableWeekends: true }),
        cases: [A("weekday", WEEKDAY), R("saturday", SATURDAY), R("sunday", SUNDAY)],
      },
      {
        name: "date single · required + bounds + no-past + no-weekends",
        field: date({ required: true, minDate: "2026-01-01", maxDate: "2026-12-31", disablePastDates: true, disableWeekends: true }),
        cases: [
          R("undefined", undefined),
          R("weekend in range", SATURDAY),
          R("before min", d(2025, 12, 31)),
          // Must clear every rule at once: weekday, not past, within [min,max].
          A("valid weekday, future, in range", d(2026, 12, 30)),
        ],
      },
    ],
  },

  // ---- Date range -------------------------------------------------------
  {
    group: "Date range",
    variations: [
      {
        name: "date range · optional",
        field: date({ mode: "range", required: false }),
        cases: [
          A("undefined (empty optional)", undefined),
          A("full range", { from: WEEKDAY, to: d(2026, 6, 18) }),
          A("partial (from only)", { from: WEEKDAY }),
        ],
      },
      {
        name: "date range · required",
        field: date({ mode: "range", required: true }),
        cases: [
          R("undefined", undefined),
          R("from only", { from: WEEKDAY }),
          R("to only", { to: WEEKDAY }),
          A("full range", { from: WEEKDAY, to: d(2026, 6, 18) }),
        ],
      },
      {
        name: "date range · required + bounds + no-weekends",
        field: date({ mode: "range", required: true, minDate: "2026-01-01", maxDate: "2026-12-31", disableWeekends: true }),
        cases: [
          R("undefined", undefined),
          R("from before min", { from: d(2025, 12, 31), to: WEEKDAY }),
          R("to is a weekend", { from: WEEKDAY, to: SATURDAY }),
          A("valid weekday range in bounds", { from: d(2026, 6, 17), to: d(2026, 6, 18) }),
        ],
      },
    ],
  },
]

/** The flat variation matrix, each variation tagged with its display group. */
export const variations: Variation[] = variationGroups.flatMap((g) =>
  g.variations.map((variation) => ({ ...variation, group: g.group }))
)

/** Display groups in matrix order — drives the /dev/schema-parity sidebar sections. */
export const variationGroupNames: string[] = variationGroups.map((g) => g.group)
