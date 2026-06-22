/**
 * Cross-library schema parity tests.
 *
 * The builder emits validation schemas for three libraries (Zod, Valibot,
 * ArkType) from one shared Validation Spec. This suite proves they are
 * SEMANTICALLY equivalent at runtime: for every field variation the builder can
 * produce, and for every meaningful input (each valid shape + each way to be
 * invalid), all three emitted schemas must reach the same accept/reject verdict
 * as the live Zod preview schema (the oracle, `buildSchema`).
 *
 * Why this exists: `pnpm typecheck:codegen` proves the generated code COMPILES,
 * but never runs it — so it cannot catch a library that accepts a value another
 * rejects. These tests run the emitted schemas (see ./parity-harness) and assert
 * verdict parity. Error-message wording is intentionally allowed to differ
 * (ArkType emits native messages for predicates it can introspect — see
 * docs/adr/0002), so only the verdict is compared, never the message.
 *
 * The variation matrix lives in ./parity-cases (shared with the
 * /dev/schema-parity inspection page). Each case pins an `expected` verdict (the intended
 * semantics). The oracle is asserted against `expected` too, so a wrong
 * expectation surfaces as an oracle failure rather than silently passing; a
 * library that diverges from the rest surfaces as that library's key differing
 * in the diff.
 */
import { describe, it, expect } from "vitest"
import type { FormField } from "../types"
import {
  SCHEMA_LIBRARIES,
  FIELD_KEY,
  buildEmittedSchema,
  accepts,
  oracleSchema,
} from "./parity-harness"
import { variations } from "./parity-cases"

// ---------------------------------------------------------------------------
// The parity assertion
// ---------------------------------------------------------------------------

async function verdicts(field: FormField, input: unknown) {
  const value = { [FIELD_KEY]: input }
  const oracle = await accepts(oracleSchema(field), value)
  const byLib: Record<string, boolean> = {}
  for (const lib of SCHEMA_LIBRARIES) {
    byLib[lib] = await accepts(buildEmittedSchema(lib, field), value)
  }
  return { oracle, ...byLib }
}

describe("schema library parity", () => {
  for (const variation of variations) {
    describe(variation.name, () => {
      for (const c of variation.cases) {
        const label = `${c.desc} → ${c.expected ? "accept" : "reject"}`
        it(label, async () => {
          const got = await verdicts(variation.field, c.input)
          // Every source (the live-Zod oracle + all three emitted schemas) must
          // reach the intended verdict. A diverging library shows up as its key
          // differing from `expected` in the diff.
          expect(got).toEqual({
            oracle: c.expected,
            zod: c.expected,
            valibot: c.expected,
            arktype: c.expected,
          })
        })
      }
    })
  }
})
