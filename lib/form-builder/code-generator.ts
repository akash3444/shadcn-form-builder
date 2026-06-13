import type {
  FormField,
  InputField,
  TextareaField,
  SelectField,
  RadioGroupField,
  CheckboxGroupField,
  SliderField,
  ComboboxField,
  NumberValidation,
  StringValidation,
} from "./types"
import { toPascalCase } from "./utils"

function getZodType(field: FormField): string {
  switch (field.type) {
    case "input": {
      const f = field as InputField
      if (f.inputType === "number") {
        const v = (f.validation ?? {}) as NumberValidation
        let chain = f.required
          ? 'z.number({ required_error: "This field is required" })'
          : "z.number()"
        if (v.min !== undefined) chain += `.min(${v.min}, "Must be at least ${v.min}")`
        if (v.max !== undefined) chain += `.max(${v.max}, "Must be at most ${v.max}")`
        if (!f.required) chain += ".optional()"
        return chain
      }
      const v = (f.validation ?? {}) as StringValidation
      let base = "z.string()"
      if (f.inputType === "email") base += '.email("Invalid email address")'
      if (f.inputType === "url") base += '.url("Invalid URL")'
      if (f.required && !v.minLength) base += '.min(1, "This field is required")'
      if (v.minLength && f.required) base += `.min(${v.minLength}, "Must be at least ${v.minLength} characters")`
      if (v.maxLength) base += `.max(${v.maxLength}, "Must be at most ${v.maxLength} characters")`
      if (v.minLength && !f.required) base += `.refine((v) => v.length === 0 || v.length >= ${v.minLength}, "Must be at least ${v.minLength} characters")`
      return base
    }
    case "textarea": {
      const v = (field.validation ?? {}) as StringValidation
      let base = "z.string()"
      if (field.required && !v.minLength) base += '.min(1, "This field is required")'
      if (v.minLength && field.required) base += `.min(${v.minLength}, "Must be at least ${v.minLength} characters")`
      if (v.maxLength) base += `.max(${v.maxLength}, "Must be at most ${v.maxLength} characters")`
      if (v.minLength && !field.required) base += `.refine((v) => v.length === 0 || v.length >= ${v.minLength}, "Must be at least ${v.minLength} characters")`
      return base
    }
    case "checkbox":
    case "switch":
      return field.required
        ? 'z.boolean().refine((val) => val === true, "This field is required")'
        : "z.boolean().default(false)"
    case "select":
    case "radio-group": {
      let base = "z.string()"
      if (field.required) base += '.min(1, "Please select an option")'
      return base
    }
    case "checkbox-group":
      return field.required
        ? 'z.array(z.string()).min(1, "Select at least one option")'
        : "z.array(z.string()).default([])"
    case "combobox": {
      if (field.multiple) {
        return field.required
          ? 'z.array(z.string()).min(1, "Select at least one option")'
          : "z.array(z.string()).default([])"
      }
      let base = "z.string()"
      if (field.required) base += '.min(1, "Please select an option")'
      return base
    }
    case "slider": {
      const f = field as SliderField
      return `z.number().min(${f.min}).max(${f.max})`
    }
  }
}

function getDefaultValue(field: FormField): string {
  if (field.defaultValue !== undefined) {
    if (typeof field.defaultValue === "string") return JSON.stringify(field.defaultValue)
    if (typeof field.defaultValue === "number") return String(field.defaultValue)
    if (typeof field.defaultValue === "boolean") return String(field.defaultValue)
    if (Array.isArray(field.defaultValue)) return JSON.stringify(field.defaultValue)
  }
  switch (field.type) {
    case "input":
      return (field as InputField).inputType === "number" ? "undefined" : '""'
    case "textarea":
    case "select":
    case "radio-group":
      return '""'
    case "checkbox":
    case "switch":
      return "false"
    case "checkbox-group":
      return "[]"
    case "combobox":
      return field.multiple ? "[]" : '""'
    case "slider": {
      const f = field as SliderField
      return String(f.min + (f.max - f.min) / 2)
    }
  }
}

function indent(str: string, spaces: number): string {
  const pad = " ".repeat(spaces)
  return str
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : pad + line))
    .join("\n")
}

function toScreamingSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, "_$1").toUpperCase()
}

function getOptionsConstName(fieldName: string): string {
  return `${toScreamingSnakeCase(fieldName)}_OPTIONS`
}

function generateOptionsConst(
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
function escapeJsxText(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;")
}

/** Escapes a string for use inside a double-quoted JSX attribute value. */
function escapeJsxAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/** Renders a string as a valid double-quoted JS string literal. */
function jsString(str: string): string {
  return JSON.stringify(str)
}

function generateFieldJSX(field: FormField): string {
  const label = escapeJsxText(field.label || "Field")
  const { description, descriptionPosition } = field

  const requiredSpan = field.required
    ? `{" "}<span className="text-destructive">*</span>`
    : ""

  const descEl = (pos: "above-control" | "below-control") =>
    description && descriptionPosition === pos
      ? `\n  <FieldDescription>${escapeJsxText(description)}</FieldDescription>`
      : ""

  const errorEl = `\n  <FieldError>{form.formState.errors.${field.name}?.message}</FieldError>`

  switch (field.type) {
    case "input": {
      const f = field as InputField
      const inputProps =
        f.inputType === "number"
          ? `id="${f.name}"
        type="number"
        placeholder="${escapeJsxAttr(f.placeholder)}"
        aria-invalid={fieldState.invalid}
        value={field.value ?? ""}
        onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)}
        onBlur={field.onBlur}
        name={field.name}
        ref={field.ref}`
          : `id="${f.name}"
        type="${f.inputType}"
        placeholder="${escapeJsxAttr(f.placeholder)}"
        aria-invalid={fieldState.invalid}
        {...field}`
      return `<Field data-invalid={!!form.formState.errors.${f.name}}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${requiredSpan}
  </FieldLabel>${descEl("above-control")}
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ field, fieldState }) => (
      <Input
        ${inputProps}
      />
    )}
  />${descEl("below-control")}${errorEl}
</Field>`
    }

    case "textarea": {
      const f = field as TextareaField
      return `<Field data-invalid={!!form.formState.errors.${f.name}}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${requiredSpan}
  </FieldLabel>${descEl("above-control")}
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ field, fieldState }) => (
      <Textarea
        id="${f.name}"
        placeholder="${escapeJsxAttr(f.placeholder)}"
        rows={${f.rows}}
        aria-invalid={fieldState.invalid}
        className="resize-none"
        {...field}
      />
    )}
  />${descEl("below-control")}${errorEl}
</Field>`
    }

    case "checkbox": {
      const descInner = description
        ? `\n    <FieldDescription>${escapeJsxText(description)}</FieldDescription>`
        : ""
      return `<Field orientation="horizontal" data-invalid={!!form.formState.errors.${field.name}}>
  <Controller
    name="${field.name}"
    control={form.control}
    render={({ field }) => (
      <Checkbox
        id="${field.name}"
        checked={Boolean(field.value)}
        onCheckedChange={field.onChange}
        aria-invalid={!!form.formState.errors.${field.name}}
      />
    )}
  />
  <FieldContent>
    <FieldLabel htmlFor="${field.name}">
      ${label}${requiredSpan}
    </FieldLabel>${descInner}
    <FieldError>{form.formState.errors.${field.name}?.message}</FieldError>
  </FieldContent>
</Field>`
    }

    case "switch": {
      const descInner = description
        ? `\n    <FieldDescription>${escapeJsxText(description)}</FieldDescription>`
        : ""
      return `<Field orientation="horizontal" data-invalid={!!form.formState.errors.${field.name}}>
  <FieldContent>
    <FieldLabel htmlFor="${field.name}">
      ${label}${requiredSpan}
    </FieldLabel>${descInner}
    <FieldError>{form.formState.errors.${field.name}?.message}</FieldError>
  </FieldContent>
  <Controller
    name="${field.name}"
    control={form.control}
    render={({ field }) => (
      <Switch
        id="${field.name}"
        checked={Boolean(field.value)}
        onCheckedChange={field.onChange}
      />
    )}
  />
</Field>`
    }

    case "select": {
      const f = field as SelectField
      const constName = getOptionsConstName(f.name)
      return `<Field data-invalid={!!form.formState.errors.${f.name}}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${requiredSpan}
  </FieldLabel>${descEl("above-control")}
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ field, fieldState }) => (
      <Select value={String(field.value ?? "")} onValueChange={field.onChange} items={${constName}}>
        <SelectTrigger id="${f.name}" aria-invalid={fieldState.invalid} className="w-full">
          <SelectValue placeholder="${escapeJsxAttr(f.placeholder) || "Select an option"}" />
        </SelectTrigger>
        <SelectContent>
          {${constName}.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
  />${descEl("below-control")}${errorEl}
</Field>`
    }

    case "radio-group": {
      const f = field as RadioGroupField
      const constName = getOptionsConstName(f.name)
      const layoutClass = f.orientation === "horizontal"
        ? "flex flex-row flex-wrap gap-3"
        : "flex flex-col gap-3"
      return `<FieldSet>
  <FieldLegend variant="label">
    ${label}${requiredSpan}
  </FieldLegend>${descEl("above-control")}
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ field }) => (
      <RadioGroup value={String(field.value ?? "")} onValueChange={field.onChange} className="${layoutClass}">
        {${constName}.map((o) => (
          <div key={o.value} className="flex items-center gap-2">
            <RadioGroupItem value={o.value} id={\`${f.name}-\${o.value}\`} />
            <FieldLabel htmlFor={\`${f.name}-\${o.value}\`}>{o.label}</FieldLabel>
          </div>
        ))}
      </RadioGroup>
    )}
  />${descEl("below-control")}
  <FieldError>{form.formState.errors.${f.name}?.message}</FieldError>
</FieldSet>`
    }

    case "checkbox-group": {
      const f = field as CheckboxGroupField
      const constName = getOptionsConstName(f.name)
      const layoutClass = f.orientation === "horizontal"
        ? "flex flex-row flex-wrap gap-3"
        : "flex flex-col gap-3"
      return `<FieldSet>
  <FieldLegend variant="label">
    ${label}${requiredSpan}
  </FieldLegend>${descEl("above-control")}
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ field }) => (
      <div className="${layoutClass}">
        {${constName}.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <Checkbox
              id={\`${f.name}-\${option.value}\`}
              checked={(field.value ?? []).includes(option.value)}
              onCheckedChange={(checked) => {
                const current = field.value ?? []
                field.onChange(
                  checked
                    ? [...current, option.value]
                    : current.filter((v) => v !== option.value)
                )
              }}
            />
            <FieldLabel htmlFor={\`${f.name}-\${option.value}\`}>{option.label}</FieldLabel>
          </div>
        ))}
      </div>
    )}
  />${descEl("below-control")}
  <FieldError>{form.formState.errors.${f.name}?.message}</FieldError>
</FieldSet>`
    }

    case "slider": {
      const f = field as SliderField
      return `<Field data-invalid={!!form.formState.errors.${f.name}}>
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ field }) => (
      <>
        <div className="flex items-center justify-between">
          <FieldLabel>${label}</FieldLabel>
          <span className="text-sm font-medium tabular-nums">{field.value}</span>
        </div>${descEl("above-control")}
        <Slider
          value={field.value}
          onValueChange={field.onChange}
          min={${f.min}}
          max={${f.max}}
          step={${f.step}}
        />
      </>
    )}
  />${descEl("below-control")}${errorEl}
</Field>`
    }

    case "combobox": {
      const f = field as ComboboxField
      const constName = getOptionsConstName(f.name)
      const placeholderRaw =
        f.placeholder || (f.multiple ? "Select options" : "Select an option")
      const placeholderAttr = escapeJsxAttr(placeholderRaw)
      const placeholderText = escapeJsxText(placeholderRaw)
      const searchPlaceholderAttr = escapeJsxAttr(f.searchPlaceholder || "Search...")
      const emptyTextText = escapeJsxText(f.emptyText || "No results found.")

      const rootProps = f.multiple
        ? `multiple
        items={${constName}.map((o) => o.value)}
        itemToStringLabel={(value) =>
          ${constName}.find((o) => o.value === value)?.label ?? value
        }
        value={field.value ?? []}
        onValueChange={field.onChange}`
        : `items={${constName}.map((o) => o.value)}
        itemToStringLabel={(value) =>
          ${constName}.find((o) => o.value === value)?.label ?? value
        }
        value={field.value || null}
        onValueChange={(value) => field.onChange(value ?? "")}`

      const list = `<ComboboxList>
          {(value) => {
            const option = ${constName}.find((o) => o.value === value)
            return (
              <ComboboxItem key={value} value={value}>
                {option?.label ?? value}
              </ComboboxItem>
            )
          }}
        </ComboboxList>`

      const usesFieldState = !(f.multiple && f.displayStyle === "input")

      let control: string
      if (f.multiple && f.displayStyle === "input") {
        control = `<ComboboxChips>
          <ComboboxValue>
            {(value) =>
              (value ?? []).map((v) => (
                <ComboboxChip key={v}>
                  {${constName}.find((o) => o.value === v)?.label ?? v}
                </ComboboxChip>
              ))
            }
          </ComboboxValue>
          <ComboboxChipsInput id="${f.name}" placeholder="${placeholderAttr}" />${
            f.clearable ? `\n          <ComboboxClear />` : ""
          }
        </ComboboxChips>
        <ComboboxContent>
          <ComboboxEmpty>${emptyTextText}</ComboboxEmpty>
          ${list}
        </ComboboxContent>`
      } else if (f.displayStyle === "trigger") {
        const triggerInner = f.multiple
          ? `{field.value && field.value.length > 0 ? \`\${field.value.length} selected\` : <span className="text-muted-foreground">${placeholderText}</span>}`
          : `{field.value ? (${constName}.find((o) => o.value === field.value)?.label ?? field.value) : <span className="text-muted-foreground">${placeholderText}</span>}`
        control = `<ComboboxTrigger id="${f.name}" aria-invalid={fieldState.invalid} className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs">
          <span className="truncate">
            ${triggerInner}
          </span>
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput showTrigger={false}${f.clearable ? " showClear" : ""} placeholder="${searchPlaceholderAttr}" />
          <ComboboxEmpty>${emptyTextText}</ComboboxEmpty>
          ${list}
        </ComboboxContent>`
      } else {
        control = `<ComboboxInput id="${f.name}" placeholder="${placeholderAttr}"${
          f.clearable ? " showClear" : ""
        } aria-invalid={fieldState.invalid} />
        <ComboboxContent>
          <ComboboxEmpty>${emptyTextText}</ComboboxEmpty>
          ${list}
        </ComboboxContent>`
      }

      const renderArgs = usesFieldState ? "{ field, fieldState }" : "{ field }"

      return `<Field data-invalid={!!form.formState.errors.${f.name}}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${requiredSpan}
  </FieldLabel>${descEl("above-control")}
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ ${renderArgs.slice(2, -2)} }) => (
      <Combobox
        ${rootProps}
      >
        ${control}
      </Combobox>
    )}
  />${descEl("below-control")}${errorEl}
</Field>`
    }
  }
}

function getRequiredImports(fields: FormField[]): string {
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
    'import { useForm, Controller } from "react-hook-form"',
    'import { zodResolver } from "@hookform/resolvers/zod"',
    'import { z } from "zod"',
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

export function generateFormCode(
  formName: string,
  submitLabel: string,
  fields: FormField[]
): string {
  const pascal = toPascalCase(formName) || "My"
  const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1)

  if (fields.length === 0) {
    return `// Add fields to your form to generate code.`
  }

  const optionFields = fields.filter(
    (f): f is SelectField | RadioGroupField | CheckboxGroupField | ComboboxField =>
      f.type === "select" ||
      f.type === "radio-group" ||
      f.type === "checkbox-group" ||
      f.type === "combobox"
  )

  const optionsSection =
    optionFields.length > 0
      ? optionFields.map(generateOptionsConst).join("\n\n") + "\n\n"
      : ""

  const schemaFields = fields
    .map((f) => `  ${f.name}: ${getZodType(f)},`)
    .join("\n")

  const defaultValues = fields
    .map((f) => `    ${f.name}: ${getDefaultValue(f)},`)
    .join("\n")

  const fieldJSX = fields
    .map((f) => indent(generateFieldJSX(f), 8))
    .join("\n\n")

  return `${getRequiredImports(fields)}

${optionsSection}const ${camel}Schema = z.object({
${schemaFields}
})

type ${pascal}Values = z.infer<typeof ${camel}Schema>

export function ${pascal}Form() {
  const form = useForm<${pascal}Values>({
    resolver: zodResolver(${camel}Schema),
    defaultValues: {
${defaultValues}
    },
  })

  function onSubmit(values: ${pascal}Values) {
    console.log(values)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup className="mb-6">
${fieldJSX}
      </FieldGroup>
      <Button type="submit" className="w-full" size="lg">${escapeJsxText(submitLabel)}</Button>
    </form>
  )
}
`
}
