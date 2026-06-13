import { z } from "zod"
import type {
  FormField,
  NumberValidation,
  StringValidation,
  SliderField,
} from "./types"

/**
 * Builds a Zod schema for the given fields. This is the single source of truth
 * for the live preview's runtime validation. The code generator
 * (code-generator.ts) emits the equivalent schema as a string; the two are
 * pinned together by tests/schema-parity.test.ts.
 */
export function buildSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of fields) {
    switch (field.type) {
      case "input": {
        if (field.inputType === "number") {
          const v = (field.validation ?? {}) as NumberValidation
          let n = field.required
            ? z.number({ required_error: "This field is required" })
            : z.number()
          if (v.min !== undefined) n = n.min(v.min, `Must be at least ${v.min}`)
          if (v.max !== undefined) n = n.max(v.max, `Must be at most ${v.max}`)
          shape[field.name] = field.required ? n : n.optional()
          break
        }
        const v = (field.validation ?? {}) as StringValidation
        let s = z.string()
        if (field.inputType === "email") s = s.email("Invalid email address")
        if (field.inputType === "url") s = s.url("Invalid URL")
        if (field.required && !v.minLength) s = s.min(1, "This field is required")
        if (v.minLength && field.required)
          s = s.min(v.minLength, `Must be at least ${v.minLength} characters`)
        if (v.maxLength)
          s = s.max(v.maxLength, `Must be at most ${v.maxLength} characters`)
        shape[field.name] =
          v.minLength && !field.required
            ? s.refine(
                (val) => val.length === 0 || val.length >= v.minLength!,
                `Must be at least ${v.minLength} characters`
              )
            : s
        break
      }
      case "textarea": {
        const v = (field.validation ?? {}) as StringValidation
        let s = z.string()
        if (field.required && !v.minLength) s = s.min(1, "This field is required")
        if (v.minLength && field.required)
          s = s.min(v.minLength, `Must be at least ${v.minLength} characters`)
        if (v.maxLength)
          s = s.max(v.maxLength, `Must be at most ${v.maxLength} characters`)
        shape[field.name] =
          v.minLength && !field.required
            ? s.refine(
                (val) => val.length === 0 || val.length >= v.minLength!,
                `Must be at least ${v.minLength} characters`
              )
            : s
        break
      }
      case "checkbox":
      case "switch":
        shape[field.name] = field.required
          ? z.boolean().refine((v) => v === true, "This field is required")
          : z.boolean().default(false)
        break
      case "select":
      case "radio-group":
        shape[field.name] = field.required
          ? z.string().min(1, "Please select an option")
          : z.string()
        break
      case "checkbox-group":
        shape[field.name] = field.required
          ? z.array(z.string()).min(1, "Select at least one option")
          : z.array(z.string()).default([])
        break
      case "combobox":
        if (field.multiple) {
          shape[field.name] = field.required
            ? z.array(z.string()).min(1, "Select at least one option")
            : z.array(z.string()).default([])
        } else {
          shape[field.name] = field.required
            ? z.string().min(1, "Please select an option")
            : z.string()
        }
        break
      case "slider": {
        const f = field as SliderField
        shape[field.name] = z.number().min(f.min).max(f.max)
        break
      }
    }
  }
  return z.object(shape)
}

/**
 * Builds the default values object for the given fields. Mirrors getDefaultValue
 * in code-generator.ts (pinned by tests/schema-parity.test.ts).
 */
export function buildDefaultValues(fields: FormField[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}
  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      defaults[field.name] = field.defaultValue
      continue
    }
    switch (field.type) {
      case "input":
        defaults[field.name] = field.inputType === "number" ? undefined : ""
        break
      case "textarea":
      case "select":
      case "radio-group":
        defaults[field.name] = ""
        break
      case "checkbox":
      case "switch":
        defaults[field.name] = false
        break
      case "checkbox-group":
        defaults[field.name] = []
        break
      case "combobox":
        defaults[field.name] = field.multiple ? [] : ""
        break
      case "slider": {
        const f = field as SliderField
        defaults[field.name] = f.min + (f.max - f.min) / 2
        break
      }
    }
  }
  return defaults
}
