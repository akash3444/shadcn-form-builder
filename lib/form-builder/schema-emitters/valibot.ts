import type { FormField, DateField } from "../types"
import {
  fieldSchemaSpec,
  dateConstraints,
  type SchemaSpec,
  type Base,
} from "../validation-spec"
import type { SchemaEmitter } from "./types"

// ---------------------------------------------------------------------------
// Spec → Valibot source string
// ---------------------------------------------------------------------------
//
// Valibot composes a base schema with validation ACTIONS via `v.pipe(...)`, and
// its action names depend on the base type: strings and arrays use
// minLength/maxLength, numbers use minValue/maxValue. So unlike the Zod emitter,
// min/max can't be a single uniform call — they're resolved against the base.

function baseSchema(base: Base): string {
  switch (base.kind) {
    case "string":
      return "v.string()"
    case "number":
      return "v.number()"
    case "boolean":
      return "v.boolean()"
    case "array":
      return "v.array(v.string())"
  }
}

function boundAction(
  kind: "min" | "max",
  base: Base,
  value: number,
  message?: string
): string {
  const name =
    base.kind === "number"
      ? kind === "min"
        ? "minValue"
        : "maxValue"
      : kind === "min"
        ? "minLength"
        : "maxLength"
  return message
    ? `v.${name}(${value}, ${JSON.stringify(message)})`
    : `v.${name}(${value})`
}

/** Wraps a base + actions in a pipe, or returns the bare base when no actions. */
function pipe(base: string, actions: string[]): string {
  return actions.length ? `v.pipe(${base}, ${actions.join(", ")})` : base
}

/** Emits the equivalent Valibot source string for a spec. */
function serializeSpec(spec: SchemaSpec): string {
  const actions: string[] = []
  for (const op of spec.ops) {
    switch (op.op) {
      case "email":
        actions.push(`v.email(${JSON.stringify(op.message)})`)
        break
      case "url":
        actions.push(`v.url(${JSON.stringify(op.message)})`)
        break
      case "min":
        actions.push(boundAction("min", spec.base, op.value, op.message))
        break
      case "max":
        actions.push(boundAction("max", spec.base, op.value, op.message))
        break
      case "isTrue":
        actions.push(
          `v.check((value) => value === true, ${JSON.stringify(op.message)})`
        )
        break
      case "refineOptionalMin":
        actions.push(
          `v.check((value) => value.length === 0 || value.length >= ${op.value}, ${JSON.stringify(
            op.message
          )})`
        )
        break
    }
  }

  const inner = pipe(baseSchema(spec.base), actions)
  switch (spec.tail) {
    case "optional":
      return `v.optional(${inner})`
    case "requiredNumber":
      // The control clears to undefined mid-edit, so the value SHAPE is optional
      // and a presence check enforces it on submit (mirror of the Zod tail).
      return `v.pipe(v.optional(${inner}), v.check((value) => value !== undefined, "This field is required"))`
    case "none":
      return inner
  }
}

/** Emits the Valibot source string for a date field (mirror of the live schema). */
function dateValibotString(field: DateField): string {
  const cs = dateConstraints(field)
  if (field.mode === "range") {
    const base =
      "v.optional(v.object({ from: v.optional(v.date()), to: v.optional(v.date()) }))"
    const checks: string[] = []
    if (field.required)
      checks.push(
        `v.check((value) => !!value && value.from !== undefined && value.to !== undefined, "Please select a date range")`
      )
    for (const c of cs)
      checks.push(
        `v.check((value) => !value || ((value.from === undefined || (${c.expr(
          "value.from"
        )})) && (value.to === undefined || (${c.expr("value.to")}))), ${JSON.stringify(
          c.message
        )})`
      )
    return pipe(base, checks)
  }

  const base = "v.optional(v.date())"
  const checks: string[] = []
  if (field.required)
    checks.push(
      `v.check((value) => value !== undefined, "This field is required")`
    )
  for (const c of cs)
    checks.push(
      `v.check((value) => value === undefined || (${c.expr(
        "value"
      )}), ${JSON.stringify(c.message)})`
    )
  return pipe(base, checks)
}

/** The Valibot type source for one field. */
function valibotFieldType(field: FormField): string {
  return field.type === "date"
    ? dateValibotString(field)
    : serializeSpec(fieldSchemaSpec(field))
}

export const valibotEmitter: SchemaEmitter = {
  imports: ['import * as v from "valibot"'],
  rhfResolverImport:
    'import { valibotResolver } from "@hookform/resolvers/valibot"',
  rhfResolver: (schemaConst) => `valibotResolver(${schemaConst})`,
  schemaBlock: (camel, pascal, fields) => {
    const schemaFields = fields
      .map((f) => `  ${f.name}: ${valibotFieldType(f)},`)
      .join("\n")
    return `const ${camel}FormSchema = v.object({
${schemaFields}
})

type ${pascal}FormValues = v.InferInput<typeof ${camel}FormSchema>`
  },
}
