import type {
  FormField,
  InputField,
  TextareaField,
  SelectField,
  RadioGroupField,
  CheckboxGroupField,
} from "./types"
import { toPascalCase } from "./utils"

function getZodType(field: FormField): string {
  switch (field.type) {
    case "input": {
      const f = field as InputField
      let base = "z.string()"
      if (f.inputType === "email") base += '.email("Invalid email address")'
      if (f.inputType === "url") base += '.url("Invalid URL")'
      if (f.required) base += '.min(1, "This field is required")'
      return base
    }
    case "textarea": {
      let base = "z.string()"
      if (field.required) base += '.min(1, "This field is required")'
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
        : "z.array(z.string())"
  }
}

function getDefaultValue(field: FormField): string {
  switch (field.type) {
    case "input":
    case "textarea":
    case "select":
    case "radio-group":
      return '""'
    case "checkbox":
    case "switch":
      return "false"
    case "checkbox-group":
      return "[]"
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
  field: SelectField | RadioGroupField | CheckboxGroupField
): string {
  const constName = getOptionsConstName(field.name)
  const rows = field.options
    .map((o) => `  { label: "${o.label}", value: "${o.value}" },`)
    .join("\n")
  return `const ${constName} = [\n${rows}\n]`
}

function generateFieldJSX(field: FormField): string {
  const label = field.label || "Field"
  const { description, descriptionPosition } = field

  const requiredSpan = field.required
    ? `{" "}<span className="text-destructive">*</span>`
    : ""

  const descEl = (pos: "above-control" | "below-control") =>
    description && descriptionPosition === pos
      ? `\n  <FieldDescription>${description}</FieldDescription>`
      : ""

  const errorEl = `\n  <FieldError>{form.formState.errors.${field.name}?.message}</FieldError>`

  switch (field.type) {
    case "input": {
      const f = field as InputField
      return `<Field data-invalid={!!form.formState.errors.${f.name}} data-disabled={${f.disabled}}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${requiredSpan}
  </FieldLabel>${descEl("above-control")}
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ field, fieldState }) => (
      <Input
        id="${f.name}"
        type="${f.inputType}"
        placeholder="${f.placeholder}"
        disabled={${f.disabled}}
        aria-invalid={fieldState.invalid}
        {...field}
      />
    )}
  />${descEl("below-control")}${errorEl}
</Field>`
    }

    case "textarea": {
      const f = field as TextareaField
      return `<Field data-invalid={!!form.formState.errors.${f.name}} data-disabled={${f.disabled}}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${requiredSpan}
  </FieldLabel>${descEl("above-control")}
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ field, fieldState }) => (
      <Textarea
        id="${f.name}"
        placeholder="${f.placeholder}"
        rows={${f.rows}}
        disabled={${f.disabled}}
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
        ? `\n    <FieldDescription>${description}</FieldDescription>`
        : ""
      return `<Field orientation="horizontal" data-invalid={!!form.formState.errors.${field.name}} data-disabled={${field.disabled}}>
  <Controller
    name="${field.name}"
    control={form.control}
    render={({ field }) => (
      <Checkbox
        id="${field.name}"
        checked={Boolean(field.value)}
        onCheckedChange={field.onChange}
        disabled={${field.disabled}}
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
        ? `\n    <FieldDescription>${description}</FieldDescription>`
        : ""
      return `<Field orientation="horizontal" data-invalid={!!form.formState.errors.${field.name}} data-disabled={${field.disabled}}>
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
        disabled={${field.disabled}}
      />
    )}
  />
</Field>`
    }

    case "select": {
      const f = field as SelectField
      const constName = getOptionsConstName(f.name)
      return `<Field data-invalid={!!form.formState.errors.${f.name}} data-disabled={${f.disabled}}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${requiredSpan}
  </FieldLabel>${descEl("above-control")}
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ field, fieldState }) => (
      <Select value={String(field.value ?? "")} onValueChange={field.onChange} disabled={${f.disabled}} items={${constName}}>
        <SelectTrigger id="${f.name}" aria-invalid={fieldState.invalid} className="w-full">
          <SelectValue placeholder="${f.placeholder || "Select an option"}" />
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
      return `<FieldSet>
  <FieldLegend variant="label">
    ${label}${requiredSpan}
  </FieldLegend>${descEl("above-control")}
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ field }) => (
      <RadioGroup value={String(field.value ?? "")} onValueChange={field.onChange} disabled={${f.disabled}}>
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
              disabled={${f.disabled}}
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
    (f): f is SelectField | RadioGroupField | CheckboxGroupField =>
      f.type === "select" || f.type === "radio-group" || f.type === "checkbox-group"
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
      <Button type="submit" className="w-full" size="lg">${submitLabel}</Button>
    </form>
  )
}
`
}
