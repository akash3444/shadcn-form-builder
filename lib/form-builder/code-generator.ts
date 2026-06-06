import type { FormField, InputField, TextareaField, SelectField, RadioGroupField } from "./types"
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
  }
}

function indent(str: string, spaces: number): string {
  const pad = " ".repeat(spaces)
  return str
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : pad + line))
    .join("\n")
}

function generateFieldJSX(field: FormField): string {
  const label = field.label || "Field"
  const description = field.description

  const requiredSpan = field.required
    ? `{" "}<span className="ml-1 text-destructive">*</span>`
    : ""

  const descEl = description
    ? `\n  <FieldDescription>${description}</FieldDescription>`
    : ""

  const errorEl = `\n  {form.formState.errors.${field.name} && (
    <FieldError>{form.formState.errors.${field.name}?.message}</FieldError>
  )}`

  switch (field.type) {
    case "input": {
      const f = field as InputField
      return `<Field data-invalid={!!form.formState.errors.${f.name}}>
  <FieldLabel className="text-sm leading-none font-medium">
    ${label}${requiredSpan}
  </FieldLabel>
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
  />${descEl}${errorEl}
</Field>`
    }

    case "textarea": {
      const f = field as TextareaField
      return `<Field data-invalid={!!form.formState.errors.${f.name}}>
  <FieldLabel className="text-sm leading-none font-medium">
    ${label}${requiredSpan}
  </FieldLabel>
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
  />${descEl}${errorEl}
</Field>`
    }

    case "checkbox": {
      const descInner = description
        ? `\n      <FieldDescription>${description}</FieldDescription>`
        : ""
      return `<Field data-invalid={!!form.formState.errors.${field.name}}>
  <div className="flex items-start gap-3 rounded-md border p-4">
    <Controller
      name="${field.name}"
      control={form.control}
      render={({ field: f }) => (
        <Checkbox
          id="${field.name}"
          checked={Boolean(f.value)}
          onCheckedChange={f.onChange}
          disabled={${field.disabled}}
          aria-invalid={!!form.formState.errors.${field.name}}
        />
      )}
    />
    <div className="flex flex-col gap-1">
      <FieldLabel className="text-sm leading-none font-medium">
        ${label}${requiredSpan}
      </FieldLabel>${descInner}
    </div>
  </div>
  {form.formState.errors.${field.name} && (
    <FieldError>{form.formState.errors.${field.name}?.message}</FieldError>
  )}
</Field>`
    }

    case "switch": {
      const descInner = description
        ? `\n      <FieldDescription>${description}</FieldDescription>`
        : ""
      return `<Field data-invalid={!!form.formState.errors.${field.name}}>
  <div className="flex items-center justify-between rounded-md border p-4">
    <div className="flex flex-col gap-0.5">
      <FieldLabel className="text-sm font-medium">
        ${label}${requiredSpan}
      </FieldLabel>${descInner}
    </div>
    <Controller
      name="${field.name}"
      control={form.control}
      render={({ field: f }) => (
        <Switch
          id="${field.name}"
          checked={Boolean(f.value)}
          onCheckedChange={f.onChange}
          disabled={${field.disabled}}
        />
      )}
    />
  </div>
  {form.formState.errors.${field.name} && (
    <FieldError>{form.formState.errors.${field.name}?.message}</FieldError>
  )}
</Field>`
    }

    case "select": {
      const f = field as SelectField
      const optionItems = f.options
        .map(
          (o) =>
            `          <SelectItem value="${o.value}">${o.label}</SelectItem>`
        )
        .join("\n")
      return `<Field data-invalid={!!form.formState.errors.${f.name}}>
  <FieldLabel className="text-sm leading-none font-medium">
    ${label}${requiredSpan}
  </FieldLabel>
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ field: f, fieldState }) => (
      <Select value={String(f.value ?? "")} onValueChange={f.onChange}>
        <SelectTrigger id="${f.name}" aria-invalid={fieldState.invalid} className="w-full">
          <SelectValue placeholder="${f.placeholder || "Select an option"}" />
        </SelectTrigger>
        <SelectContent>
${optionItems}
        </SelectContent>
      </Select>
    )}
  />${descEl}${errorEl}
</Field>`
    }

    case "radio-group": {
      const f = field as RadioGroupField
      const radioItems = f.options
        .map(
          (o) => `        <div className="flex items-center gap-2">
          <RadioGroupItem value="${o.value}" id="${f.name}-${o.value}" />
          <label htmlFor="${f.name}-${o.value}" className="cursor-pointer text-sm font-medium">${o.label}</label>
        </div>`
        )
        .join("\n")
      return `<Field data-invalid={!!form.formState.errors.${f.name}}>
  <FieldLabel className="text-sm leading-none font-medium">
    ${label}${requiredSpan}
  </FieldLabel>
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ field: f }) => (
      <RadioGroup value={String(f.value ?? "")} onValueChange={f.onChange} disabled={${f.disabled}}>
${radioItems}
      </RadioGroup>
    )}
  />${descEl}${errorEl}
</Field>`
    }
  }
}

function getRequiredImports(fields: FormField[]): string {
  const types = new Set(fields.map((f) => f.type))
  const imports: string[] = [
    '"use client"',
    "",
    'import { useForm, Controller } from "react-hook-form"',
    'import { zodResolver } from "@hookform/resolvers/zod"',
    'import { z } from "zod"',
    "",
    'import { Button } from "@/components/ui/button"',
    'import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"',
  ]

  if (types.has("input")) imports.push('import { Input } from "@/components/ui/input"')
  if (types.has("textarea")) imports.push('import { Textarea } from "@/components/ui/textarea"')
  if (types.has("checkbox")) imports.push('import { Checkbox } from "@/components/ui/checkbox"')
  if (types.has("switch")) imports.push('import { Switch } from "@/components/ui/switch"')
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

  const schemaFields = fields
    .map((f) => `  ${f.name}: ${getZodType(f)},`)
    .join("\n")

  const defaultValues = fields
    .map((f) => `    ${f.name}: ${getDefaultValue(f)},`)
    .join("\n")

  const fieldJSX = fields
    .map((f) => indent(generateFieldJSX(f), 6))
    .join("\n\n")

  return `${getRequiredImports(fields)}

const ${camel}Schema = z.object({
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
${fieldJSX}

      <Button type="submit" className="w-full" size="lg">${submitLabel}</Button>
    </form>
  )
}
`
}
