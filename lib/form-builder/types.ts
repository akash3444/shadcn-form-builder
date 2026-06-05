export type FieldType =
  | "input"
  | "textarea"
  | "checkbox"
  | "switch"
  | "select"
  | "radio-group"

export type InputType = "text" | "email" | "password" | "url" | "tel"

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
  required: boolean
  disabled: boolean
}

export interface InputField extends BaseField {
  type: "input"
  inputType: InputType
}

export interface TextareaField extends BaseField {
  type: "textarea"
  rows: number
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

export interface RadioGroupField extends BaseField {
  type: "radio-group"
  options: FieldOption[]
}

export type FormField =
  | InputField
  | TextareaField
  | CheckboxField
  | SwitchField
  | SelectField
  | RadioGroupField
