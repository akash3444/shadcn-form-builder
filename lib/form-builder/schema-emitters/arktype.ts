import type { DateField } from "../types"
import {
  fieldSchemaSpec,
  dateConstraints,
  type SchemaSpec,
} from "../validation-spec"
import type { SchemaEmitter } from "./types"

// ---------------------------------------------------------------------------
// Spec → ArkType source string
// ---------------------------------------------------------------------------
//
// ArkType is emitted in its idiomatic string DSL wherever one exists (bounds,
// email/url, optional keys); constraints with no DSL form drop to `.narrow()`
// (see docs/adr/0002). For predicates ArkType can introspect (`value !== true`)
// it overrides our message with its native wording; for arbitrary predicates
// (lengths, dates) our message is kept.
//
// Two narrow LOCATIONS are used, because ArkType's `.narrow()` over a
// `X | undefined` union strips `undefined` from the inferred INPUT type — which
// breaks controls that legitimately hold `Date | undefined` / `number |
// undefined` mid-edit:
//   - VALUE narrows for non-union bases (boolean must-be-true, optional-min
//     string) — input type is unaffected, so an inline `type(b).narrow(...)`
//     value is fine.
//   - OBJECT narrows for anything needing a `| undefined` input (dates,
//     required numbers). The field is an OPTIONAL KEY (which keeps `| undefined`
//     in inferIn) and presence/constraints move to one object-level narrow with
//     a `path`, which doesn't refine per-property input types.

interface FieldEmit {
  /** The object key, already quoted with `?` when the key is optional. */
  key: string
  /** The value: a quoted DSL string, a nested object def, or a `type(...)` expr. */
  value: string
  /** Object-level reject clauses (presence/constraints) for this field. */
  objNarrows: ObjClause[]
}

interface RejectClause {
  /** Boolean expression over `value`; when true the value is rejected. */
  when: string
  message: string
}

/** An object-level reject clause over `data`, attributed to a field via `path`. */
interface ObjClause {
  when: string
  message: string
  path: string
}

/** A nested ternary that rejects on the first matching clause, else `true`. */
function rejectChain(clauses: RejectClause[]): string {
  let expr = "true"
  for (let i = clauses.length - 1; i >= 0; i--) {
    const c = clauses[i]
    expr = `${c.when} ? ctx.reject({ message: ${JSON.stringify(c.message)} }) : ${expr}`
  }
  return expr
}

/** The object-level equivalent: each reject carries the field's `path`. */
function objRejectChain(clauses: ObjClause[]): string {
  let expr = "true"
  for (let i = clauses.length - 1; i >= 0; i--) {
    const c = clauses[i]
    expr = `${c.when} ? ctx.reject({ message: ${JSON.stringify(
      c.message
    )}, path: [${JSON.stringify(c.path)}] }) : ${expr}`
  }
  return expr
}

/**
 * Builds a bounded ArkType DSL string. A double bound puts the type BETWEEN the
 * bounds (`0 <= number <= 100`); a single bound is a comparator suffix
 * (`number >= 0`). Note `number >= 0 <= 100` is rejected at the type level
 * ("at most one right bound"), so the middle form is required for ranges.
 */
function boundedDsl(typeExpr: string, minV?: number, maxV?: number): string {
  if (minV !== undefined && maxV !== undefined)
    return `${minV} <= ${typeExpr} <= ${maxV}`
  if (minV !== undefined) return `${typeExpr} >= ${minV}`
  if (maxV !== undefined) return `${typeExpr} <= ${maxV}`
  return typeExpr
}

/** An inline `type(base).narrow(...)` value expression (non-union bases only). */
function narrowValue(base: string, clauses: RejectClause[]): string {
  return `type(${JSON.stringify(base)}).narrow((value, ctx) => ${rejectChain(
    clauses
  )})`
}

/** Emits the field for a non-date spec. */
function nonDateEmit(name: string, spec: SchemaSpec): FieldEmit {
  switch (spec.base.kind) {
    case "boolean": {
      const isTrue = spec.ops.find((o) => o.op === "isTrue")
      const value = isTrue
        ? narrowValue("boolean", [
            { when: "value !== true", message: isTrue.message },
          ])
        : '"boolean"'
      return { key: name, value, objNarrows: [] }
    }

    case "array": {
      const min = spec.ops.find((o) => o.op === "min")
      return {
        key: name,
        value: JSON.stringify(boundedDsl("string[]", min?.value)),
        objNarrows: [],
      }
    }

    case "string": {
      const hasEmail = spec.ops.some((o) => o.op === "email")
      const hasUrl = spec.ops.some((o) => o.op === "url")
      const subtype = hasEmail ? "string.email" : hasUrl ? "string.url" : "string"
      const maxs = spec.ops.filter((o) => o.op === "max").map((o) => o.value)
      const maxV = maxs.length ? Math.max(...maxs) : undefined

      // Optional-string min is conditional ("empty OR ≥ n"), so it can't be a DSL
      // bound — it becomes a narrow. The subtype and the max bound still apply and
      // must NOT be dropped (an early return here previously lost both, so an
      // optional min+max string accepted over-long values and optional email+len
      // lost its `string.email` check).
      const refineOpt = spec.ops.find((o) => o.op === "refineOptionalMin")
      if (refineOpt)
        return {
          key: name,
          value: narrowValue(boundedDsl(subtype, undefined, maxV), [
            {
              when: `value.length !== 0 && value.length < ${refineOpt.value}`,
              message: refineOpt.message,
            },
          ]),
          objNarrows: [],
        }

      const mins = spec.ops.filter((o) => o.op === "min").map((o) => o.value)
      let minV = mins.length ? Math.max(...mins) : undefined
      // `string.email`/`string.url` already reject the empty string, so a
      // redundant `>= 1` adds noise — drop it for those subtypes.
      if ((hasEmail || hasUrl) && minV === 1) minV = undefined
      return {
        key: name,
        value: JSON.stringify(boundedDsl(subtype, minV, maxV)),
        objNarrows: [],
      }
    }

    case "number": {
      const minOp = spec.ops.find((o) => o.op === "min")
      const maxOp = spec.ops.find((o) => o.op === "max")
      const dsl = boundedDsl("number", minOp?.value, maxOp?.value)
      if (spec.tail === "requiredNumber") {
        // The control holds `number | undefined` mid-edit, so the field is an
        // optional key (to keep `undefined` in the input type) with bounds via
        // DSL, and presence is enforced by an object-level narrow.
        return {
          key: JSON.stringify(`${name}?`),
          value: JSON.stringify(dsl),
          objNarrows: [
            {
              when: `data.${name} === undefined`,
              message: "This field is required",
              path: name,
            },
          ],
        }
      }
      // Slider (required key) or optional number input (optional key).
      const optional = spec.tail === "optional"
      return {
        key: optional ? JSON.stringify(`${name}?`) : name,
        // An optional key only makes the key OMISSIBLE; a present `undefined`
        // (which the cleared number control holds) is still type-checked and a
        // bare `number` rejects it. Zod/Valibot's `.optional()` accept it, so
        // union with `undefined` to keep all three in step.
        value: JSON.stringify(optional ? `${dsl} | undefined` : dsl),
        objNarrows: [],
      }
    }
  }
}

/** Emits the field for a date spec (optional key + object-level constraints). */
function dateEmit(name: string, field: DateField): FieldEmit {
  const cs = dateConstraints(field)
  const key = JSON.stringify(`${name}?`)

  if (field.mode === "range") {
    const objNarrows: ObjClause[] = []
    if (field.required)
      objNarrows.push({
        when: `!data.${name} || data.${name}.from === undefined || data.${name}.to === undefined`,
        message: "Please select a date range",
        path: name,
      })
    for (const c of cs)
      objNarrows.push({
        when: `!!data.${name} && !((data.${name}.from === undefined || (${c.expr(
          `data.${name}.from`
        )})) && (data.${name}.to === undefined || (${c.expr(
          `data.${name}.to`
        )})))`,
        message: c.message,
        path: name,
      })
    // `| undefined` so a present-but-empty optional range (the control's cleared
    // state) is accepted, matching Zod/Valibot; when required, the object narrow
    // still rejects `undefined` with our message.
    return {
      key,
      value: '[{ "from?": "Date", "to?": "Date" }, "|", "undefined"]',
      objNarrows,
    }
  }

  const objNarrows: ObjClause[] = []
  if (field.required)
    objNarrows.push({
      when: `data.${name} === undefined`,
      message: "This field is required",
      path: name,
    })
  for (const c of cs)
    objNarrows.push({
      when: `data.${name} !== undefined && !(${c.expr(`data.${name}`)})`,
      message: c.message,
      path: name,
    })
  // See the range branch: an optional key still type-checks a present
  // `undefined`, so union it in. The presence narrow (when required) rejects it.
  return { key, value: '"Date | undefined"', objNarrows }
}

export const arktypeEmitter: SchemaEmitter = {
  imports: ['import { type } from "arktype"'],
  rhfResolverImport:
    'import { arktypeResolver } from "@hookform/resolvers/arktype"',
  rhfResolver: (schemaConst) => `arktypeResolver(${schemaConst})`,
  schemaBlock: (camel, pascal, fields) => {
    const emits = fields.map((f) =>
      f.type === "date" ? dateEmit(f.name, f) : nonDateEmit(f.name, fieldSchemaSpec(f))
    )
    const lines = emits.map((e) => `  ${e.key}: ${e.value},`).join("\n")
    const obj = `type({
${lines}
})`
    const clauses = emits.flatMap((e) => e.objNarrows)
    const schema = clauses.length
      ? `${obj}.narrow((data, ctx) => ${objRejectChain(clauses)})`
      : obj
    return `const ${camel}FormSchema = ${schema}

type ${pascal}FormValues = typeof ${camel}FormSchema.inferIn`
  },
}
