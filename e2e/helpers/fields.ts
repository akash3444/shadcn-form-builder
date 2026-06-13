/**
 * Builder-config factories for e2e scenarios. These mirror the shapes the real
 * builder store produces, so the harness can feed them straight into the app's
 * `generateFormCode()`.
 */
import type {
  CheckboxField,
  CheckboxGroupField,
  ComboboxField,
  FieldOption,
  FormField,
  InputField,
  InputType,
  RadioGroupField,
  SelectField,
  SliderField,
  SwitchField,
  TextareaField,
} from "../../lib/form-builder/types"
import type { FormConfig } from "./harness"

/**
 * Wrap a single field in a minimal form config. The per-field setting specs use
 * this so each scenario renders ONE field in isolation — the setting under test
 * is the only thing that can affect the result.
 */
export function oneField(field: FormField): FormConfig {
  return { formName: "Isolated Form", submitLabel: "Submit", fields: [field] }
}

function base(name: string, label: string) {
  return {
    id: `f-${name}`,
    label,
    name,
    placeholder: "",
    description: "",
    descriptionPosition: "below-control" as const,
    required: false,
  }
}

function options(name: string, values: [label: string, value: string][]): FieldOption[] {
  return values.map(([label, value]) => ({ id: `${name}-${value}`, label, value }))
}

export function input(
  name: string,
  label: string,
  opts: Partial<InputField> & { inputType?: InputType } = {}
): InputField {
  return { ...base(name, label), type: "input", inputType: "text", ...opts }
}

export function textarea(
  name: string,
  label: string,
  opts: Partial<TextareaField> = {}
): TextareaField {
  return { ...base(name, label), type: "textarea", rows: 3, ...opts }
}

export function checkbox(
  name: string,
  label: string,
  opts: Partial<CheckboxField> = {}
): CheckboxField {
  return { ...base(name, label), type: "checkbox", ...opts }
}

export function toggle(
  name: string,
  label: string,
  opts: Partial<SwitchField> = {}
): SwitchField {
  return { ...base(name, label), type: "switch", ...opts }
}

export function select(
  name: string,
  label: string,
  values: [string, string][],
  opts: Partial<SelectField> = {}
): SelectField {
  return { ...base(name, label), type: "select", options: options(name, values), ...opts }
}

export function radioGroup(
  name: string,
  label: string,
  values: [string, string][],
  opts: Partial<RadioGroupField> = {}
): RadioGroupField {
  return {
    ...base(name, label),
    type: "radio-group",
    orientation: "vertical",
    options: options(name, values),
    ...opts,
  }
}

export function checkboxGroup(
  name: string,
  label: string,
  values: [string, string][],
  opts: Partial<CheckboxGroupField> = {}
): CheckboxGroupField {
  return {
    ...base(name, label),
    type: "checkbox-group",
    orientation: "vertical",
    options: options(name, values),
    ...opts,
  }
}

export function slider(
  name: string,
  label: string,
  opts: Partial<SliderField> = {}
): SliderField {
  return { ...base(name, label), type: "slider", min: 0, max: 100, step: 1, ...opts }
}

export function combobox(
  name: string,
  label: string,
  values: [string, string][],
  opts: Partial<ComboboxField> = {}
): ComboboxField {
  return {
    ...base(name, label),
    type: "combobox",
    multiple: false,
    displayStyle: "input",
    searchPlaceholder: "Search...",
    emptyText: "No results found.",
    clearable: false,
    options: options(name, values),
    ...opts,
  }
}
