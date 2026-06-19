/** Form libraries the builder can emit code and render the live preview for. */
export type FormLibrary = "react-hook-form" | "tanstack-form"

export type FieldType =
  | "input"
  | "password"
  | "textarea"
  | "checkbox"
  | "switch"
  | "select"
  | "radio-group"
  | "checkbox-group"
  | "slider"
  | "combobox"
  | "date"

export type InputType = "text" | "email" | "url" | "tel" | "number"

export interface FieldOption {
  id: string
  label: string
  value: string
  /**
   * The {@link OptionGroup} this option belongs to, when its field has grouping
   * enabled. Absent on ungrouped fields (and on radio/checkbox-group, which
   * never surface grouping). Options are always stored as a flat list; this id
   * is the overlay that codegen/preview partition by — see
   * `docs/adr/0001-option-grouping-flat-storage-nested-output.md`.
   */
  groupId?: string
}

/**
 * A named partition of a field's options. Only `select` and `combobox` carry
 * groups. An empty `groups` array means grouping is off and the field renders
 * as a flat list, exactly as before. A blank `label` renders an unlabeled
 * section (a divider with no heading).
 */
export interface OptionGroup {
  id: string
  label: string
}

/**
 * A configured date-range value, stored as ISO `yyyy-MM-dd` strings so it stays
 * JSON-serializable in the persisted builder state. The generated form converts
 * these to `Date` objects at runtime (see the date validation branch).
 */
export interface DateRangeValue {
  from?: string
  to?: string
}

interface BaseField {
  id: string
  label: string
  name: string
  placeholder: string
  description: string
  descriptionPosition: DescriptionPosition
  required: boolean
  /**
   * When true, the field is kept in the builder but excluded from the rendered
   * preview and the generated code. Lets users park a field they're unsure
   * about without losing its configuration. Absent/false means visible.
   */
  hidden?: boolean
  defaultValue?: string | number | boolean | string[] | DateRangeValue
}

export interface NumberValidation {
  min?: number
  max?: number
}

export interface StringValidation {
  minLength?: number
  maxLength?: number
}

export interface InputField extends BaseField {
  type: "input"
  inputType: InputType
  validation?: NumberValidation | StringValidation
}

export interface PasswordField extends BaseField {
  type: "password"
  /** Whether to render a show/hide visibility toggle inside the input. */
  showToggle: boolean
  validation?: StringValidation
}

export interface TextareaField extends BaseField {
  type: "textarea"
  rows: number
  validation?: StringValidation
}

export interface CheckboxField extends BaseField {
  type: "checkbox"
}

export interface SwitchField extends BaseField {
  type: "switch"
}

export interface SelectField extends BaseField {
  type: "select"
  options: FieldOption[]
  /**
   * Option groups. Absent or empty means grouping is off (flat list). Optional
   * so state persisted before this feature rehydrates cleanly — treat a missing
   * value as `[]` (see `groupsOf` in utils).
   */
  groups?: OptionGroup[]
}

export type GroupOrientation = "vertical" | "horizontal"

export type DescriptionPosition = "above-control" | "below-control"

export interface RadioGroupField extends BaseField {
  type: "radio-group"
  options: FieldOption[]
  orientation: GroupOrientation
}

export interface CheckboxGroupField extends BaseField {
  type: "checkbox-group"
  options: FieldOption[]
  orientation: GroupOrientation
}

export interface SliderField extends BaseField {
  type: "slider"
  min: number
  max: number
  step: number
}

export type ComboboxDisplayStyle = "trigger" | "input"

export interface ComboboxField extends BaseField {
  type: "combobox"
  options: FieldOption[]
  /** See {@link SelectField.groups}. */
  groups?: OptionGroup[]
  multiple: boolean
  displayStyle: ComboboxDisplayStyle
  searchPlaceholder: string
  emptyText: string
  clearable: boolean
}

export type DateMode = "single" | "range"

/** Calendar header style: a static label, or month/year dropdowns. */
export type DateCaptionLayout = "label" | "dropdown"

export interface DateField extends BaseField {
  type: "date"
  mode: DateMode
  captionLayout: DateCaptionLayout
  /** Inclusive lower bound, ISO `yyyy-MM-dd`. */
  minDate?: string
  /** Inclusive upper bound, ISO `yyyy-MM-dd`. */
  maxDate?: string
  disablePastDates: boolean
  disableWeekends: boolean
}

export type FormField =
  | InputField
  | PasswordField
  | TextareaField
  | CheckboxField
  | SwitchField
  | SelectField
  | RadioGroupField
  | CheckboxGroupField
  | SliderField
  | ComboboxField
  | DateField

/** Field types that carry a user-editable list of options. */
export type OptionField =
  | SelectField
  | RadioGroupField
  | CheckboxGroupField
  | ComboboxField

/** Option fields that support organizing their options into {@link OptionGroup}s. */
export type GroupableField = SelectField | ComboboxField
