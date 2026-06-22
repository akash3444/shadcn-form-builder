"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { Check, Minus, TriangleAlert, X } from "lucide-react"

import { CodeBlock } from "@/components/builder/preview/code-block"
import { cn } from "@/lib/utils"
import type { SchemaLibrary } from "@/lib/form-builder/types"
import {
  SCHEMA_LIBRARIES,
  FIELD_KEY,
  buildEmittedSchema,
  accepts,
  oracleSchema,
  schemaExpr,
} from "@/lib/form-builder/schema-emitters/parity-harness"
import {
  variations,
  variationGroupNames,
} from "@/lib/form-builder/schema-emitters/parity-cases"

// The verdict sources shown per case: the live Zod preview (oracle) plus the
// three emitted schemas. `boolean` is accept/reject; `"error"` means the schema
// failed to build or threw during validation.
type Verdict = boolean | "error"
const SOURCES = ["oracle", ...SCHEMA_LIBRARIES] as const
type Source = (typeof SOURCES)[number]

const SOURCE_LABEL: Record<Source, string> = {
  oracle: "Oracle",
  zod: "Zod",
  valibot: "Valibot",
  arktype: "ArkType",
}

interface CaseResult {
  oracle: Verdict
  zod: Verdict
  valibot: Verdict
  arktype: Verdict
}

interface VariationResult {
  cases: CaseResult[]
  /** True when every source matches `expected` on every case. */
  ok: boolean
}

/**
 * Runs the whole matrix through the live schemas. Each emitted/oracle schema is
 * built once per variation and reused across that variation's cases. Anything
 * that throws is recorded as `"error"` rather than crashing the page.
 */
async function computeAll(): Promise<VariationResult[]> {
  const out: VariationResult[] = []

  for (const variation of variations) {
    const oracle = safeBuild(() => oracleSchema(variation.field))
    const emitted: Record<SchemaLibrary, unknown | null> = {
      zod: safeBuild(() => buildEmittedSchema("zod", variation.field)),
      valibot: safeBuild(() => buildEmittedSchema("valibot", variation.field)),
      arktype: safeBuild(() => buildEmittedSchema("arktype", variation.field)),
    }

    const cases: CaseResult[] = []
    for (const c of variation.cases) {
      const value = { [FIELD_KEY]: c.input }
      cases.push({
        oracle: await verdict(oracle, value),
        zod: await verdict(emitted.zod, value),
        valibot: await verdict(emitted.valibot, value),
        arktype: await verdict(emitted.arktype, value),
      })
    }

    const ok = cases.every((r, i) => {
      const exp = variation.cases[i].expected
      return (
        r.oracle === exp &&
        r.zod === exp &&
        r.valibot === exp &&
        r.arktype === exp
      )
    })
    out.push({ cases, ok })
  }

  return out
}

function safeBuild(fn: () => unknown): unknown | null {
  try {
    return fn()
  } catch {
    return null
  }
}

async function verdict(schema: unknown | null, value: unknown): Promise<Verdict> {
  if (schema === null) return "error"
  try {
    return await accepts(schema, value)
  } catch {
    return "error"
  }
}

/** Renders any sample input unambiguously (empty string, undefined, Date, …). */
function formatInput(v: unknown): string {
  if (v === undefined) return "undefined"
  if (v === null) return "null"
  if (v instanceof Date) return format(v, "yyyy-MM-dd")
  if (typeof v === "string") return v === "" ? '""' : JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(formatInput).join(", ")}]`
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>)
    if (entries.length === 0) return "{}"
    return `{ ${entries
      .map(([k, val]) => `${k}: ${formatInput(val)}`)
      .join(", ")} }`
  }
  return String(v)
}

export function ParityInspector() {
  const [results, setResults] = useState<VariationResult[] | null>(null)
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    let cancelled = false
    computeAll().then((r) => {
      if (!cancelled) setResults(r)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const grouped = useMemo(
    () =>
      variationGroupNames.map((group) => ({
        group,
        items: variations
          .map((variation, index) => ({ variation, index }))
          .filter(({ variation }) => variation.group === group),
      })),
    []
  )

  const variation = variations[selected]
  const result = results?.[selected]

  const exprs = useMemo(
    () =>
      SCHEMA_LIBRARIES.map((lib) => {
        try {
          return { lib, code: schemaExpr(lib, variation.field) }
        } catch (e) {
          return { lib, code: `/* failed to emit: ${(e as Error).message} */` }
        }
      }),
    [variation]
  )

  const passing = results?.filter((r) => r.ok).length
  const total = variations.length

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b px-5 py-3">
        <div>
          <h1 className="text-sm font-semibold">Schema parity</h1>
          <p className="text-xs text-muted-foreground">
            Zod · Valibot · ArkType emitters vs the live preview oracle, run
            against every field variation.
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium tabular-nums",
            passing === undefined
              ? "text-muted-foreground"
              : passing === total
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-destructive/40 bg-destructive/10 text-destructive"
          )}
        >
          {passing === undefined
            ? "computing…"
            : `${passing}/${total} variations passing`}
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-80 shrink-0 overflow-y-auto border-r">
          {grouped.map(({ group, items }) => (
            <div key={group}>
              <p className="px-3 pt-4 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {group}
              </p>
              {items.map(({ variation: v, index }) => {
                const r = results?.[index]
                return (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => setSelected(index)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm",
                      index === selected
                        ? "bg-muted font-medium"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        !r
                          ? "bg-muted-foreground/30"
                          : r.ok
                            ? "bg-emerald-500"
                            : "bg-destructive"
                      )}
                    />
                    <span className="truncate">{v.name}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl space-y-6 px-6 py-6">
            <div>
              <h2 className="text-base font-semibold">{variation.name}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                field type{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono">
                  {variation.field.type}
                </code>
              </p>
            </div>

            <section className="space-y-3">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Emitted schema
              </h3>
              {exprs.map(({ lib, code }) => (
                <div
                  key={lib}
                  className="overflow-hidden rounded-lg border bg-card"
                >
                  <div className="border-b px-3 py-1.5 text-xs font-medium">
                    {SOURCE_LABEL[lib]}
                  </div>
                  <CodeBlock code={code} />
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Cases &amp; live verdicts
              </h3>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Input</th>
                      <th className="px-3 py-2 font-medium">Expected</th>
                      {SOURCES.map((s) => (
                        <th key={s} className="px-3 py-2 font-medium">
                          {SOURCE_LABEL[s]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {variation.cases.map((c, i) => {
                      const r = result?.cases[i]
                      return (
                        <tr key={c.desc} className="align-top">
                          <td className="px-3 py-2">
                            <code className="font-mono text-[13px]">
                              {formatInput(c.input)}
                            </code>
                            <div className="text-xs text-muted-foreground">
                              {c.desc}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <ExpectedLabel value={c.expected} />
                          </td>
                          {SOURCES.map((s) => (
                            <td key={s} className="px-3 py-2">
                              <VerdictCell
                                value={r?.[s]}
                                expected={c.expected}
                              />
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                A cell is highlighted when its verdict disagrees with{" "}
                <span className="font-medium">Expected</span>. Error-message
                wording is intentionally allowed to differ across libraries — only
                the accept/reject verdict is compared.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

/** Accept = green check, reject = destructive cross. */
function VerdictIcon({ value }: { value: boolean }) {
  const Icon = value ? Check : X
  return (
    <Icon
      className={cn(
        "size-4",
        value ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
      )}
      aria-label={value ? "accept" : "reject"}
    />
  )
}

function ExpectedLabel({ value }: { value: boolean }) {
  return (
    <span title={value ? "accept" : "reject"}>
      <VerdictIcon value={value} />
    </span>
  )
}

function VerdictCell({
  value,
  expected,
}: {
  value: Verdict | undefined
  expected: boolean
}) {
  if (value === undefined) {
    return <Minus className="size-4 text-muted-foreground/40" aria-label="computing" />
  }
  if (value === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
        <TriangleAlert className="size-4" />
        <span className="text-xs font-medium">error</span>
      </span>
    )
  }
  const mismatch = value !== expected
  return (
    <span
      title={value ? "accept" : "reject"}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded",
        mismatch && "bg-destructive/15 ring-1 ring-destructive/50"
      )}
    >
      <VerdictIcon value={value} />
    </span>
  )
}
