import { z } from "zod"
import type { FormField, NumberValidation, StringValidation } from "./types"

/**
 * Single source of truth for field validation. Each field reduces to a
 * serializable {@link SchemaSpec}: a base Zod type, an ordered list of
 * operations, and a tail. Two interpreters consume the spec — {@link applySpec}
 * builds the live Zod object used by the preview, and {@link serializeSpec}
 * emits the equivalent Zod source string used by the code generator. Because
 * both read the same spec, the preview's validation and the generated code can
 * no longer drift (error messages, conditions, and ordering are defined once).
 */

type Base =
  | { kind: "string" }
  | { kind: "number" }
  | { kind: "boolean" }
  | { kind: "array" } // array of strings

type Op =
  | { op: "email"; message: string }
  | { op: "url"; message: string }
  // min/max apply to string length, number value, or array length depending on
  // the base. An empty message emits `.min(n)` with no message argument.
  | { op: "min"; value: number; message?: string }
  | { op: "max"; value: number; message?: string }
  | { op: "isTrue"; message: string } // boolean must be true
  | { op: "refineOptionalMin"; value: number; message: string } // optional string min length

// "requiredNumber" models a required number input: its control clears to
// `undefined` while editing, so the value's SHAPE is optional and a presence
// refine enforces it on submit. This keeps the inferred type (`number |
// undefined`) consistent with what the control actually holds — a plain
// `z.number()` would infer `number`, which the number input can never guarantee
// mid-edit and which makes the generated TanStack binding fail to type-check.
type Tail = "none" | "optional" | "requiredNumber"

export interface SchemaSpec {
  base: Base
  ops: Op[]
  tail: Tail
}

function stringSpec(
  required: boolean,
  v: StringValidation,
  inputType?: string
): SchemaSpec {
  const ops: Op[] = []
  if (inputType === "email")
    ops.push({ op: "email", message: "Invalid email address" })
  if (inputType === "url") ops.push({ op: "url", message: "Invalid URL" })
  if (required && !v.minLength)
    ops.push({ op: "min", value: 1, message: "This field is required" })
  if (v.minLength && required)
    ops.push({
      op: "min",
      value: v.minLength,
      message: `Must be at least ${v.minLength} characters`,
    })
  if (v.maxLength)
    ops.push({
      op: "max",
      value: v.maxLength,
      message: `Must be at most ${v.maxLength} characters`,
    })
  if (v.minLength && !required)
    ops.push({
      op: "refineOptionalMin",
      value: v.minLength,
      message: `Must be at least ${v.minLength} characters`,
    })
  return { base: { kind: "string" }, ops, tail: "none" }
}

function arraySpec(required: boolean): SchemaSpec {
  return required
    ? {
        base: { kind: "array" },
        ops: [{ op: "min", value: 1, message: "Select at least one option" }],
        tail: "none",
      }
    : { base: { kind: "array" }, ops: [], tail: "none" }
}

/** Reduces a field to its serializable validation spec. */
export function fieldSchemaSpec(field: FormField): SchemaSpec {
  switch (field.type) {
    case "input": {
      if (field.inputType === "number") {
        const v = (field.validation ?? {}) as NumberValidation
        const ops: Op[] = []
        if (v.min !== undefined)
          ops.push({ op: "min", value: v.min, message: `Must be at least ${v.min}` })
        if (v.max !== undefined)
          ops.push({ op: "max", value: v.max, message: `Must be at most ${v.max}` })
        return {
          base: { kind: "number" },
          ops,
          tail: field.required ? "requiredNumber" : "optional",
        }
      }
      return stringSpec(
        field.required,
        (field.validation ?? {}) as StringValidation,
        field.inputType
      )
    }
    case "textarea":
      return stringSpec(field.required, (field.validation ?? {}) as StringValidation)
    case "checkbox":
    case "switch":
      return field.required
        ? {
            base: { kind: "boolean" },
            ops: [{ op: "isTrue", message: "This field is required" }],
            tail: "none",
          }
        : { base: { kind: "boolean" }, ops: [], tail: "none" }
    case "select":
    case "radio-group":
      return {
        base: { kind: "string" },
        ops: field.required
          ? [{ op: "min", value: 1, message: "Please select an option" }]
          : [],
        tail: "none",
      }
    case "checkbox-group":
      return arraySpec(field.required)
    case "combobox":
      return field.multiple
        ? arraySpec(field.required)
        : {
            base: { kind: "string" },
            ops: field.required
              ? [{ op: "min", value: 1, message: "Please select an option" }]
              : [],
            tail: "none",
          }
    case "slider":
      return {
        base: { kind: "number" },
        ops: [
          { op: "min", value: field.min },
          { op: "max", value: field.max },
        ],
        tail: "none",
      }
  }
}

// A minimal view of the chained Zod methods the interpreter calls. The concrete
// base (string/number/array) exposes the matching `min`/`max`/etc. at runtime.
interface Chainable {
  email(message: string): Chainable
  url(message: string): Chainable
  min(value: number, message?: string): Chainable
  max(value: number, message?: string): Chainable
  refine<T>(check: (value: T) => boolean, message: string): Chainable
  optional(): Chainable
  default(value: unknown): Chainable
}

function baseLive(base: Base): z.ZodTypeAny {
  switch (base.kind) {
    case "string":
      return z.string()
    case "number":
      return z.number()
    case "boolean":
      return z.boolean()
    case "array":
      return z.array(z.string())
  }
}

/** Builds the live Zod schema for a spec (used by the preview). */
export function applySpec(spec: SchemaSpec): z.ZodTypeAny {
  let s = baseLive(spec.base) as unknown as Chainable
  for (const op of spec.ops) {
    switch (op.op) {
      case "email":
        s = s.email(op.message)
        break
      case "url":
        s = s.url(op.message)
        break
      case "min":
        s = op.message ? s.min(op.value, op.message) : s.min(op.value)
        break
      case "max":
        s = op.message ? s.max(op.value, op.message) : s.max(op.value)
        break
      case "isTrue":
        s = s.refine((value: boolean) => value === true, op.message)
        break
      case "refineOptionalMin":
        s = s.refine(
          (value: string) => value.length === 0 || value.length >= op.value,
          op.message
        )
        break
    }
  }
  switch (spec.tail) {
    case "optional":
      s = s.optional()
      break
    case "requiredNumber":
      s = s
        .optional()
        .refine((v: number | undefined) => v !== undefined, "This field is required")
      break
    case "none":
      break
  }
  return s as unknown as z.ZodTypeAny
}

function baseString(base: Base): string {
  switch (base.kind) {
    case "string":
      return "z.string()"
    case "number":
      return "z.number()"
    case "boolean":
      return "z.boolean()"
    case "array":
      return "z.array(z.string())"
  }
}

/** Emits the equivalent Zod source string for a spec (used by codegen). */
export function serializeSpec(spec: SchemaSpec): string {
  let str = baseString(spec.base)
  for (const op of spec.ops) {
    switch (op.op) {
      case "email":
        str += `.email("${op.message}")`
        break
      case "url":
        str += `.url("${op.message}")`
        break
      case "min":
        str += op.message ? `.min(${op.value}, "${op.message}")` : `.min(${op.value})`
        break
      case "max":
        str += op.message ? `.max(${op.value}, "${op.message}")` : `.max(${op.value})`
        break
      case "isTrue":
        str += `.refine((val) => val === true, "${op.message}")`
        break
      case "refineOptionalMin":
        str += `.refine((v) => v.length === 0 || v.length >= ${op.value}, "${op.message}")`
        break
    }
  }
  switch (spec.tail) {
    case "optional":
      str += ".optional()"
      break
    case "requiredNumber":
      str += `.optional().refine((v) => v !== undefined, "This field is required")`
      break
    case "none":
      break
  }
  return str
}

/** The type default for a field, ignoring any configured `defaultValue`. */
function fieldTypeDefault(field: FormField): unknown {
  switch (field.type) {
    case "input":
      return field.inputType === "number" ? undefined : ""
    case "textarea":
    case "select":
    case "radio-group":
      return ""
    case "checkbox":
    case "switch":
      return false
    case "checkbox-group":
      return []
    case "combobox":
      return field.multiple ? [] : ""
    case "slider":
      return field.min + (field.max - field.min) / 2
  }
}

/** The effective default value for a field (configured override or type default). */
export function defaultValueFor(field: FormField): unknown {
  return field.defaultValue !== undefined
    ? field.defaultValue
    : fieldTypeDefault(field)
}

/** Serializes a default value to a JS literal string for the generated code. */
export function serializeDefault(value: unknown): string {
  if (value === undefined) return "undefined"
  if (typeof value === "string") return JSON.stringify(value)
  if (typeof value === "number") return String(value)
  if (typeof value === "boolean") return String(value)
  if (Array.isArray(value)) return JSON.stringify(value)
  return "undefined"
}
