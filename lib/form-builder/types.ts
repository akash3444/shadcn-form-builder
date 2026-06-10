export type FieldType =
  | "input"
  | "textarea"
  | "checkbox"
  | "switch"
  | "select"
  | "radio-group"
  | "checkbox-group"

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
  disabled: boolean
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

export type FormField =
  | InputField
  | TextareaField
  | CheckboxField
  | SwitchField
  | SelectField
  | RadioGroupField
  | CheckboxGroupField
