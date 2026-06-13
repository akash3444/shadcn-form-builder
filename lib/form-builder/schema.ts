import { z } from "zod"
import type { FormField } from "./types"
import {
  fieldSchemaSpec,
  applySpec,
  defaultValueFor,
} from "./validation-spec"

/**
 * Builds a Zod schema for the given fields. This powers the live preview's
 * runtime validation. The code generator (code-generator.ts) emits the
 * equivalent schema as a string; both derive from the same per-field spec in
 * validation-spec.ts, so they cannot drift.
 */
export function buildSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of fields) {
    shape[field.name] = applySpec(fieldSchemaSpec(field))
  }
  return z.object(shape)
}

/**
 * Builds the default values object for the given fields. Uses the same
 * defaultValueFor helper that the code generator serializes, so the preview's
 * initial values match the generated code's.
 */
export function buildDefaultValues(fields: FormField[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}
  for (const field of fields) {
    defaults[field.name] = defaultValueFor(field)
  }
  return defaults
}
