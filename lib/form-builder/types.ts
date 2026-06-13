/** Form libraries the builder can emit code and render the live preview for. */
export type FormLibrary = "react-hook-form" | "tanstack-form"

export type FieldType =
  | "input"
  | "textarea"
  | "checkbox"
  | "switch"
  | "select"
  | "radio-group"
  | "checkbox-group"
  | "slider"
  | "combobox"

export type InputType = "text" | "email" | "password" | "url" | "tel" | "number"

export interface FieldOption {
  id: string
  label: string
  value: string
}

interface BaseField {
  id: string
  label: string
  name: string
  placeholder: string
  description: string
  descriptionPosition: DescriptionPosition
  required: boolean
  defaultValue?: string | number | boolean | string[]
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
  multiple: boolean
  displayStyle: ComboboxDisplayStyle
  searchPlaceholder: string
  emptyText: string
  clearable: boolean
}

export type FormField =
  | InputField
  | TextareaField
  | CheckboxField
  | SwitchField
  | SelectField
  | RadioGroupField
  | CheckboxGroupField
  | SliderField
  | ComboboxField

/** Field types that carry a user-editable list of options. */
export type OptionField =
  | SelectField
  | RadioGroupField
  | CheckboxGroupField
  | ComboboxField
