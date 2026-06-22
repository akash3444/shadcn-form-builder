/**
 * Cross-library runtime parity harness.
 *
 * Consumed by both ./parity.test.ts (the runtime parity suite) and the /dev/schema-parity
 * inspection page (app/dev/schema-parity/page.tsx), so it is bundled into the app build —
 * keep it free of test-only imports.
 *
 * The three Schema Emitters (zod / valibot / arktype) all translate the SAME
 * library-agnostic Validation Spec into source strings. The codegen type-check
 * harness (scripts/typecheck-codegen.ts) proves those strings COMPILE, but never
 * runs them — so it can't catch a semantic drift where, say, ArkType accepts a
 * value Valibot rejects. This harness closes that gap: it evals each emitter's
 * output into a live schema and exposes a single uniform accept/reject verdict,
 * so a test (or the page) can assert all three agree (and agree with the live
 * Zod preview).
 *
 * How it works: every emitter produces an object schema as a string. We pull the
 * bare schema expression out of `schemaBlock`, eval it with the relevant library
 * binding (`z` / `v` / `type`) plus the date-fns helpers the date branch uses,
 * and read the verdict through the Standard Schema interface every library
 * implements (`schema["~standard"].validate`).
 */
import { z } from "zod"
import * as v from "valibot"
import { type } from "arktype"
import { parseISO, startOfToday, isWeekend, format } from "date-fns"
import type { FormField, SchemaLibrary } from "../types"
import { buildSchema } from "../schema"
import { getEmitter } from "./index"

export const SCHEMA_LIBRARIES: SchemaLibrary[] = ["zod", "valibot", "arktype"]

/**
 * The emitter wraps a single field as `{ value: <field schema> }`; we validate
 * against that object, so every sample input is wrapped under this key.
 */
export const FIELD_KEY = "value"

/**
 * Pulls the bare schema expression out of an emitter's `schemaBlock`. The block
 * is always `const valueFormSchema = <EXPR>\n\ntype ValueFormValues = …`; we drop
 * the trailing type alias and the `const … =` prefix to get `<EXPR>`.
 */
export function schemaExpr(library: SchemaLibrary, field: FormField): string {
  const block = getEmitter(library).schemaBlock("value", "Value", [field])
  const beforeType = block.split("\n\ntype ")[0]
  return beforeType.replace(/^const \w+FormSchema = /, "")
}

// The identifiers an emitted schema expression can reference: the library
// binding plus the date-fns helpers the date branch inlines into its predicates.
const EVAL_SCOPE = { z, v, type, parseISO, startOfToday, isWeekend, format }
const EVAL_NAMES = Object.keys(EVAL_SCOPE)
const EVAL_VALUES = Object.values(EVAL_SCOPE)

/** Evals an emitter's schema expression into a live schema object. */
export function buildEmittedSchema(library: SchemaLibrary, field: FormField): unknown {
  const expr = schemaExpr(library, field)
  const factory = new Function(...EVAL_NAMES, `return (${expr})`)
  return factory(...EVAL_VALUES)
}

interface StandardSchemaLike {
  "~standard": {
    validate: (value: unknown) =>
      | { value: unknown }
      | { issues: readonly unknown[] }
      | Promise<{ value: unknown } | { issues: readonly unknown[] }>
  }
}

/** Uniform accept/reject verdict via the Standard Schema interface. */
export async function accepts(schema: unknown, input: unknown): Promise<boolean> {
  const result = await (schema as StandardSchemaLike)["~standard"].validate(input)
  return !("issues" in result && result.issues !== undefined)
}

/** The live Zod preview schema for a single field — the parity oracle. */
export function oracleSchema(field: FormField) {
  return buildSchema([field])
}
