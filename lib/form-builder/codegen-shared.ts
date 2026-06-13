import type {
  FormField,
  SelectField,
  RadioGroupField,
  CheckboxGroupField,
  ComboboxField,
} from "./types"
import {
  fieldSchemaSpec,
  serializeSpec,
  defaultValueFor,
  serializeDefault,
} from "./validation-spec"

/**
 * Library-agnostic code-generation helpers shared between the React Hook Form
 * and TanStack Form generators. Anything here produces identical output
 * regardless of the selected form library — escaping, options constants, the
 * Zod schema/defaults, and the shadcn component imports. Only the field
 * binding layer (Controller vs form.Field) lives in the per-library generators.
 */

/** Emits the Zod schema source for a field (mirror of the live schema). */
export function getZodType(field: FormField): string {
  return serializeSpec(fieldSchemaSpec(field))
}

/** Emits the default-value literal for a field (mirror of the live default). */
export function getDefaultValue(field: FormField): string {
  return serializeDefault(defaultValueFor(field))
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

  if (types.has("input"))
    imports.push('import { Input } from "@/components/ui/input"')
  if (types.has("textarea"))
    imports.push('import { Textarea } from "@/components/ui/textarea"')
  if (types.has("checkbox") || types.has("checkbox-group"))
    imports.push('import { Checkbox } from "@/components/ui/checkbox"')
  if (types.has("switch"))
    imports.push('import { Switch } from "@/components/ui/switch"')
  if (types.has("select"))
    imports.push(
      'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"'
    )
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
    }
    const ordered = [
      "Combobox",
      "ComboboxChip",
      "ComboboxChips",
      "ComboboxChipsInput",
      "ComboboxClear",
      "ComboboxContent",
      "ComboboxEmpty",
      "ComboboxInput",
      "ComboboxItem",
      "ComboboxList",
      "ComboboxTrigger",
      "ComboboxValue",
    ].filter((p) => parts.has(p))
    imports.push(
      `import { ${ordered.join(", ")} } from "@/components/ui/combobox"`
    )
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
  return `const ${camel}FormSchema = z.object({
${schemaFields}
})

type ${pascal}FormValues = z.infer<typeof ${camel}FormSchema>`
}

/** The default-value object entries, indented for a `defaultValues: { ... }`. */
export function buildDefaultValueLines(fields: FormField[]): string {
  return fields
    .map((f) => `      ${f.name}: ${getDefaultValue(f)},`)
    .join("\n")
}
