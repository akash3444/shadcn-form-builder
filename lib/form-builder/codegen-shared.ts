import type {
  FormField,
  SelectField,
  RadioGroupField,
  CheckboxGroupField,
  ComboboxField,
  GroupOrientation,
} from "./types"
import {
  fieldSchemaSpec,
  serializeSpec,
  defaultValueFor,
  serializeDefault,
  dateZodString,
  dateDefaultString,
  dateFnsImportsFor,
} from "./validation-spec"
import { isGroupableField, isGrouped, partitionByGroup } from "./utils"

/**
 * Library-agnostic code-generation helpers shared between the React Hook Form
 * and TanStack Form generators. Anything here produces identical output
 * regardless of the selected form library — escaping, options constants, the
 * Zod schema/defaults, and the shadcn component imports. Only the field
 * binding layer (Controller vs form.Field) lives in the per-library generators.
 */

/** Emits the Zod schema source for a field (mirror of the live schema). */
export function getZodType(field: FormField): string {
  return field.type === "date"
    ? dateZodString(field)
    : serializeSpec(fieldSchemaSpec(field))
}

/** Emits the default-value literal for a field (mirror of the live default). */
export function getDefaultValue(field: FormField): string {
  return field.type === "date"
    ? dateDefaultString(field)
    : serializeDefault(defaultValueFor(field))
}

export function indent(str: string, spaces: number): string {
  const pad = " ".repeat(spaces)
  return str
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : pad + line))
    .join("\n")
}

function toScreamingSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, "_$1").toUpperCase()
}

export function getOptionsConstName(fieldName: string): string {
  return `${toScreamingSnakeCase(fieldName)}_OPTIONS`
}

export function generateOptionsConst(
  field: SelectField | RadioGroupField | CheckboxGroupField | ComboboxField
): string {
  const constName = getOptionsConstName(field.name)

  // Grouped select/combobox emit the nested `[{ label, items }]` shape. The
  // inner key is `items` (not `options`) because base-ui detects grouping via
  // `'items' in items[0]`; the label key is ours.
  if (isGroupableField(field) && isGrouped(field)) {
    const partitioned = partitionByGroup(field)
    // A degenerate empty grouped field would emit `[]`, which TS infers as
    // `any[]` and fails to compile downstream — annotate the empty case.
    if (partitioned.length === 0) {
      return `const ${constName}: { label: string; items: { label: string; value: string }[] }[] = []`
    }
    const groups = partitioned
      .map((group) => {
        const items = group.items
          .map(
            (o) =>
              `      { label: ${jsString(o.label)}, value: ${jsString(o.value)} },`
          )
          .join("\n")
        return `  {\n    label: ${jsString(group.label)},\n    items: [\n${items}\n    ],\n  },`
      })
      .join("\n")
    return `const ${constName} = [\n${groups}\n]`
  }

  if (field.options.length === 0) {
    return `const ${constName}: { label: string; value: string }[] = []`
  }
  const rows = field.options
    .map((o) => `  { label: ${jsString(o.label)}, value: ${jsString(o.value)} },`)
    .join("\n")
  return `const ${constName} = [\n${rows}\n]`
}

/**
 * Escapes a string for use as JSX text content (between tags). `{` and `}` would
 * otherwise open a JS expression and `<`/`>` would start a tag, so they are
 * encoded as HTML entities, which JSX decodes back to the literal characters.
 */
export function escapeJsxText(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;")
}

/** Escapes a string for use inside a double-quoted JSX attribute value. */
export function escapeJsxAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/** Renders a string as a valid double-quoted JS string literal. */
export function jsString(str: string): string {
  return JSON.stringify(str)
}

/** Emits a JSX placeholder attribute, using an expression for multiline values. */
export function placeholderProp(str: string): string {
  if (!str.includes("\n")) return `placeholder="${escapeJsxAttr(str)}"`
  return `placeholder={${jsString(str)}}`
}

/** The escaped label text for a field, falling back to "Field". */
export function labelText(field: FormField): string {
  return escapeJsxText(field.label || "Field")
}

/** The trailing required asterisk span, or empty when the field is optional. */
export function requiredSpan(field: FormField): string {
  return field.required
    ? `{" "}<span className="text-destructive">*</span>`
    : ""
}

/** A `<FieldDescription>` fragment when the field's description sits at `pos`. */
export function descEl(
  field: FormField,
  pos: "above-control" | "below-control"
): string {
  const { description, descriptionPosition } = field
  return description && descriptionPosition === pos
    ? `\n  <FieldDescription>${escapeJsxText(description)}</FieldDescription>`
    : ""
}

/** The flex layout class for a horizontally/vertically arranged option group. */
export function groupLayoutClass(orientation: GroupOrientation): string {
  return orientation === "horizontal"
    ? "flex flex-row flex-wrap gap-3"
    : "flex flex-col gap-3"
}

/**
 * The library-independent codegen inputs for a combobox field: its options
 * const name, resolved/escaped placeholder + empty text, and the base-ui
 * `items`/flattened-value expressions. Both generators consume these verbatim;
 * only the binding wrapper around the control differs per library.
 *
 * When grouped, base-ui needs grouped value-strings (`{ label, items }` where
 * items are the option values) so the committed value stays a string; labels
 * are resolved against the flattened option list. Ungrouped passes plain values.
 */
export function comboboxCodegenParts(f: ComboboxField) {
  const constName = getOptionsConstName(f.name)
  const placeholderRaw =
    f.placeholder || (f.multiple ? "Select options" : "Select an option")
  const grouped = isGrouped(f)
  const flatExpr = grouped ? `${constName}.flatMap((g) => g.items)` : constName
  const itemsExpr = grouped
    ? `${constName}.map((g) => ({ label: g.label, items: g.items.map((o) => o.value) }))`
    : `${constName}.map((o) => o.value)`
  return {
    constName,
    placeholderRaw,
    placeholderAttr: escapeJsxAttr(placeholderRaw),
    placeholderText: escapeJsxText(placeholderRaw),
    searchPlaceholderAttr: escapeJsxAttr(f.searchPlaceholder || "Search..."),
    emptyTextText: escapeJsxText(f.emptyText || "No results found."),
    grouped,
    flatExpr,
    itemsExpr,
  }
}

/**
 * Builds the import block. The form-library imports differ per library and are
 * passed in via `formLibraryImports`; everything else (shadcn field + UI
 * components) is derived from the field set and shared.
 */
export function buildImports(
  fields: FormField[],
  formLibraryImports: string[]
): string {
  const types = new Set(fields.map((f) => f.type))
  const hasDescription = fields.some((f) => f.description)
  const hasHorizontal = types.has("checkbox") || types.has("switch")
  const hasGrouped = types.has("radio-group") || types.has("checkbox-group")
  // A password field renders via the self-contained PasswordInput component,
  // which owns its own visibility-toggle state — so the form only needs to
  // import it (the eye toggle and useState live inside that companion file).
  const hasPassword = types.has("password")
  const hasPlainInput = types.has("input")
  const fieldComponents = [
    "Field",
    ...(hasHorizontal ? ["FieldContent"] : []),
    ...(hasDescription ? ["FieldDescription"] : []),
    "FieldError",
    "FieldGroup",
    "FieldLabel",
    ...(hasGrouped ? ["FieldLegend", "FieldSet"] : []),
  ].join(", ")

  const imports: string[] = [
    '"use client"',
    "",
    ...formLibraryImports,
    "",
    'import { Button } from "@/components/ui/button"',
    `import { ${fieldComponents} } from "@/components/ui/field"`,
  ]

  if (hasPlainInput)
    imports.push('import { Input } from "@/components/ui/input"')
  if (hasPassword)
    imports.push(
      'import { PasswordInput } from "@/components/ui/password-input"'
    )
  if (types.has("textarea"))
    imports.push('import { Textarea } from "@/components/ui/textarea"')
  if (types.has("checkbox") || types.has("checkbox-group"))
    imports.push('import { Checkbox } from "@/components/ui/checkbox"')
  if (types.has("switch"))
    imports.push('import { Switch } from "@/components/ui/switch"')
  if (types.has("select")) {
    const selectGrouped = fields.some(
      (f) => f.type === "select" && isGrouped(f)
    )
    const selectParts = [
      "Select",
      "SelectContent",
      ...(selectGrouped ? ["SelectGroup"] : []),
      "SelectItem",
      ...(selectGrouped ? ["SelectLabel", "SelectSeparator"] : []),
      "SelectTrigger",
      "SelectValue",
    ]
    imports.push(
      `import { ${selectParts.join(", ")} } from "@/components/ui/select"`
    )
  }
  if (types.has("radio-group"))
    imports.push(
      'import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"'
    )
  if (types.has("slider"))
    imports.push('import { Slider } from "@/components/ui/slider"')
  if (types.has("combobox")) {
    const comboFields = fields.filter(
      (f): f is ComboboxField => f.type === "combobox"
    )
    const parts = new Set<string>([
      "Combobox",
      "ComboboxContent",
      "ComboboxEmpty",
      "ComboboxList",
      "ComboboxItem",
    ])
    for (const f of comboFields) {
      if (f.multiple && f.displayStyle === "input") {
        parts.add("ComboboxChips")
        parts.add("ComboboxChip")
        parts.add("ComboboxChipsInput")
        parts.add("ComboboxValue")
        if (f.clearable) parts.add("ComboboxClear")
      } else {
        parts.add("ComboboxInput")
      }
      if (f.displayStyle === "trigger") parts.add("ComboboxTrigger")
      if (isGrouped(f)) {
        parts.add("ComboboxGroup")
        parts.add("ComboboxLabel")
        parts.add("ComboboxCollection")
        parts.add("ComboboxSeparator")
      }
    }
    const ordered = [
      "Combobox",
      "ComboboxChip",
      "ComboboxChips",
      "ComboboxChipsInput",
      "ComboboxClear",
      "ComboboxCollection",
      "ComboboxContent",
      "ComboboxEmpty",
      "ComboboxGroup",
      "ComboboxInput",
      "ComboboxItem",
      "ComboboxLabel",
      "ComboboxList",
      "ComboboxSeparator",
      "ComboboxTrigger",
      "ComboboxValue",
    ].filter((p) => parts.has(p))
    imports.push(
      `import { ${ordered.join(", ")} } from "@/components/ui/combobox"`
    )
  }
  if (types.has("date")) {
    imports.push('import { cn } from "@/lib/utils"')
    imports.push('import { Calendar } from "@/components/ui/calendar"')
    imports.push(
      'import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"'
    )
    imports.push('import { CalendarIcon } from "lucide-react"')
    if (fields.some((f) => f.type === "date" && f.mode === "range"))
      imports.push('import type { DateRange } from "react-day-picker"')
    const dateFns = dateFnsImportsFor(fields)
    if (dateFns.length)
      imports.push(`import { ${dateFns.join(", ")} } from "date-fns"`)
  }

  return imports.join("\n")
}

/** The `const X_OPTIONS = [...]` section (with trailing spacing), or "". */
export function buildOptionsSection(fields: FormField[]): string {
  const optionFields = fields.filter(
    (f): f is SelectField | RadioGroupField | CheckboxGroupField | ComboboxField =>
      f.type === "select" ||
      f.type === "radio-group" ||
      f.type === "checkbox-group" ||
      f.type === "combobox"
  )
  return optionFields.length > 0
    ? optionFields.map(generateOptionsConst).join("\n\n") + "\n\n"
    : ""
}

/** The Zod schema constant and inferred type alias, shared by both libraries. */
export function buildSchemaBlock(
  camel: string,
  pascal: string,
  fields: FormField[]
): string {
  const schemaFields = fields
    .map((f) => `  ${f.name}: ${getZodType(f)},`)
    .join("\n")
  // The form holds the schema's INPUT type (what the controls produce), which
  // diverges from the output only when a field narrows on parse — e.g. a
  // required number is `number | undefined` while editing but `number` after
  // validation. For every non-narrowing field `z.input` equals `z.infer`, so
  // this is identical to the inferred type everywhere except those cases.
  return `const ${camel}FormSchema = z.object({
${schemaFields}
})

type ${pascal}FormValues = z.input<typeof ${camel}FormSchema>`
}

/** The default-value object entries, indented for a `defaultValues: { ... }`. */
export function buildDefaultValueLines(fields: FormField[]): string {
  return fields
    .map((f) => `      ${f.name}: ${getDefaultValue(f)},`)
    .join("\n")
}
