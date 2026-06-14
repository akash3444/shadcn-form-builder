/**
 * Type-checks the form builder's generated output against the real project
 * types. For every fixture (lib/form-builder/__fixtures__/codegen-fixtures.ts)
 * and every form library, it runs the code generator, drops the result into an
 * in-memory TypeScript program built from the project's own tsconfig, and
 * collects compiler diagnostics. A clean run proves the generated imports, JSX
 * props, and form-binding types all line up with `@/components/ui/*`,
 * react-hook-form, @tanstack/react-form, and the inferred Zod schema — the one
 * surface the live preview never exercises (it renders a separate hand-written
 * implementation).
 *
 * What it catches: unresolved/incorrect imports, invalid or missing props,
 * Controller/form.Field render-callback type mismatches, and references to field
 * names that don't exist on the inferred schema type. What it does NOT catch:
 * logic that still type-checks. Pair it with the live preview and snapshot tests.
 *
 * Usage:
 *   pnpm typecheck:codegen            # check every fixture under every library
 *   pnpm typecheck:codegen --write    # also write generated files to .codegen-virtual/
 *   pnpm typecheck:codegen --filter combobox   # only fixtures whose id includes "combobox"
 */
import path from "node:path"
import fs from "node:fs"
import { Project } from "ts-morph"
import { generateFormCode } from "../lib/form-builder/code-generator"
import { CODEGEN_FIXTURES } from "../lib/form-builder/__fixtures__/codegen-fixtures"
import type { FormLibrary } from "../lib/form-builder/types"

const ROOT = process.cwd()
const VIRTUAL_DIR = path.join(ROOT, ".codegen-virtual")
const LIBRARIES: FormLibrary[] = ["react-hook-form", "tanstack-form"]

const args = process.argv.slice(2)
const shouldWrite = args.includes("--write")
const filterIdx = args.indexOf("--filter")
const filter = filterIdx !== -1 ? args[filterIdx + 1] : undefined

const libSlug: Record<FormLibrary, string> = {
  "react-hook-form": "rhf",
  "tanstack-form": "tanstack",
}

interface GeneratedCase {
  id: string
  filePath: string
  code: string
}

const fixtures = filter
  ? CODEGEN_FIXTURES.filter((f) => f.name.includes(filter))
  : CODEGEN_FIXTURES

if (fixtures.length === 0) {
  console.error(`No fixtures match --filter "${filter}".`)
  process.exit(1)
}

// Build the program from the project's own tsconfig so jsx, strict, module
// resolution, and the "@/*" paths exactly match what a user of the generated
// code gets. Files are added explicitly below; their imports resolve from disk.
const project = new Project({
  tsConfigFilePath: path.join(ROOT, "tsconfig.json"),
  skipAddingFilesFromTsConfig: true,
})

const cases: GeneratedCase[] = []
for (const fixture of fixtures) {
  for (const lib of LIBRARIES) {
    const code = generateFormCode(
      fixture.formName,
      fixture.submitLabel,
      fixture.fields,
      lib
    )
    // Anchor virtual files at the repo root so "@/..." imports resolve exactly
    // as they would in the app. The files stay in memory unless --write is set.
    const filePath = path.join(VIRTUAL_DIR, `${fixture.name}.${libSlug[lib]}.tsx`)
    project.createSourceFile(filePath, code, { overwrite: true })
    cases.push({ id: `${fixture.name} [${lib}]`, filePath, code })
  }
}

if (shouldWrite) {
  fs.rmSync(VIRTUAL_DIR, { recursive: true, force: true })
  fs.mkdirSync(VIRTUAL_DIR, { recursive: true })
  for (const c of cases) fs.writeFileSync(c.filePath, c.code)
  console.log(`Wrote ${cases.length} generated files to ${path.relative(ROOT, VIRTUAL_DIR)}/`)
}

console.log(
  `Type-checking ${cases.length} generated modules ` +
    `(${fixtures.length} fixtures × ${LIBRARIES.length} libraries)...\n`
)

const diagnostics = project.getPreEmitDiagnostics()

// Partition diagnostics by the virtual file they belong to. Anything not in a
// virtual file means the project itself doesn't type-check — surfaced
// separately so it isn't mistaken for a codegen defect.
const byFile = new Map<string, typeof diagnostics>()
const projectDiagnostics: typeof diagnostics = []
for (const d of diagnostics) {
  const filePath = d.getSourceFile()?.getFilePath()
  if (filePath && filePath.startsWith(VIRTUAL_DIR)) {
    const list = byFile.get(filePath) ?? []
    list.push(d)
    byFile.set(filePath, list)
  } else {
    projectDiagnostics.push(d)
  }
}

const failed = cases.filter((c) => byFile.has(c.filePath))
const passed = cases.filter((c) => !byFile.has(c.filePath))

for (const c of passed) console.log(`  ✓ ${c.id}`)
for (const c of failed) console.log(`  ✗ ${c.id}`)

if (failed.length > 0) {
  console.log("\n" + "=".repeat(72))
  console.log("FAILURES\n")
  for (const c of failed) {
    console.log(`✗ ${c.id}`)
    console.log(project.formatDiagnosticsWithColorAndContext(byFile.get(c.filePath)!))
    console.log("")
  }
}

if (projectDiagnostics.length > 0) {
  console.log("=".repeat(72))
  console.log(
    `⚠ ${projectDiagnostics.length} diagnostic(s) in project files (not generated code).\n` +
      `  The project itself does not type-check; generated-code results may be unreliable.\n`
  )
  console.log(project.formatDiagnosticsWithColorAndContext(projectDiagnostics.slice(0, 10)))
}

console.log("=".repeat(72))
console.log(`${passed.length} passed, ${failed.length} failed (of ${cases.length}).`)

process.exit(failed.length > 0 ? 1 : 0)
