import type {
  FormField,
  InputField,
  TextareaField,
  SelectField,
  RadioGroupField,
  CheckboxGroupField,
  SliderField,
  ComboboxField,
} from "./types"
import { toPascalCase } from "./utils"
import {
  indent,
  getOptionsConstName,
  escapeJsxText,
  escapeJsxAttr,
  placeholderProp,
  labelText,
  requiredSpan,
  descEl,
  buildImports,
  buildOptionsSection,
  buildSchemaBlock,
  buildDefaultValueLines,
} from "./codegen-shared"

/**
 * TanStack Form generator. Shares the Zod schema, options constants, labels,
 * descriptions, and shadcn imports with the React Hook Form generator (via
 * codegen-shared.ts); only the field-binding layer differs. Validation mirrors
 * the reference component: schema validators on submit and blur, with errors
 * gated behind `isTouched && !isValid`.
 */

/** Wraps a field's inner JSX in a `<form.Field>` render-prop with touched gating. */
function wrapField(name: string, inner: string): string {
  return `<form.Field name="${name}">
  {(field) => {
    const isInvalid =
      field.state.meta.isTouched && !field.state.meta.isValid

    return (
${indent(inner, 6)}
    )
  }}
</form.Field>`
}

/** The touched-gated `<FieldError>` line at a given indent (2 or 4 spaces). */
function errorLine(spaces: number): string {
  const pad = " ".repeat(spaces)
  return `\n${pad}{isInvalid && <FieldError errors={field.state.meta.errors} />}`
}

function generateFieldInner(field: FormField): string {
  const label = labelText(field)
  const reqSpan = requiredSpan(field)
  const error = errorLine(2)
  const descInner = field.description
    ? `\n    <FieldDescription>${escapeJsxText(field.description)}</FieldDescription>`
    : ""

  switch (field.type) {
    case "input": {
      const f = field as InputField
      const bindings =
        f.inputType === "number"
          ? `    value={field.state.value ?? ""}
    onChange={(e) => field.handleChange(e.target.value === "" ? undefined : e.target.valueAsNumber)}`
          : `    value={field.state.value}
    onChange={(e) => field.handleChange(e.target.value)}`
      return `<Field data-invalid={isInvalid}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${reqSpan}
  </FieldLabel>${descEl(field, "above-control")}
  <Input
    id="${f.name}"
    name="${f.name}"
    type="${f.inputType}"
    ${placeholderProp(f.placeholder)}
${bindings}
    onBlur={field.handleBlur}
    aria-invalid={isInvalid}
  />${descEl(field, "below-control")}${error}
</Field>`
    }

    case "textarea": {
      const f = field as TextareaField
      return `<Field data-invalid={isInvalid}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${reqSpan}
  </FieldLabel>${descEl(field, "above-control")}
  <Textarea
    id="${f.name}"
    name="${f.name}"
    ${placeholderProp(f.placeholder)}
    rows={${f.rows}}
    className="resize-none"
    value={field.state.value}
    onChange={(e) => field.handleChange(e.target.value)}
    onBlur={field.handleBlur}
    aria-invalid={isInvalid}
  />${descEl(field, "below-control")}${error}
</Field>`
    }

    case "checkbox": {
      return `<Field orientation="horizontal" data-invalid={isInvalid}>
  <Checkbox
    id="${field.name}"
    name="${field.name}"
    checked={field.state.value}
    onCheckedChange={(checked) => field.handleChange(checked === true)}
    onBlur={field.handleBlur}
    aria-invalid={isInvalid}
  />
  <FieldContent>
    <FieldLabel htmlFor="${field.name}">
      ${label}${reqSpan}
    </FieldLabel>${descInner}${errorLine(4)}
  </FieldContent>
</Field>`
    }

    case "switch": {
      return `<Field orientation="horizontal" data-invalid={isInvalid}>
  <FieldContent>
    <FieldLabel htmlFor="${field.name}">
      ${label}${reqSpan}
    </FieldLabel>${descInner}${errorLine(4)}
  </FieldContent>
  <Switch
    id="${field.name}"
    name="${field.name}"
    checked={field.state.value}
    onCheckedChange={(checked) => field.handleChange(checked)}
    onBlur={field.handleBlur}
  />
</Field>`
    }

    case "select": {
      const f = field as SelectField
      const constName = getOptionsConstName(f.name)
      return `<Field data-invalid={isInvalid}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${reqSpan}
  </FieldLabel>${descEl(field, "above-control")}
  <Select value={String(field.state.value ?? "")} onValueChange={(value) => field.handleChange(value ?? "")} items={${constName}}>
    <SelectTrigger id="${f.name}" aria-invalid={isInvalid} className="w-full">
      <SelectValue placeholder="${escapeJsxAttr(f.placeholder) || "Select an option"}" />
    </SelectTrigger>
    <SelectContent>
      {${constName}.map((o) => (
        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
      ))}
    </SelectContent>
  </Select>${descEl(field, "below-control")}${error}
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
    ${label}${reqSpan}
  </FieldLegend>${descEl(field, "above-control")}
  <RadioGroup value={String(field.state.value ?? "")} onValueChange={field.handleChange} className="${layoutClass}">
    {${constName}.map((o) => (
      <div key={o.value} className="flex items-center gap-2">
        <RadioGroupItem value={o.value} id={\`${f.name}-\${o.value}\`} />
        <FieldLabel htmlFor={\`${f.name}-\${o.value}\`}>{o.label}</FieldLabel>
      </div>
    ))}
  </RadioGroup>${descEl(field, "below-control")}${error}
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
    ${label}${reqSpan}
  </FieldLegend>${descEl(field, "above-control")}
  <div className="${layoutClass}">
    {${constName}.map((option) => (
      <div key={option.value} className="flex items-center gap-2">
        <Checkbox
          id={\`${f.name}-\${option.value}\`}
          checked={(field.state.value ?? []).includes(option.value)}
          onCheckedChange={(checked) => {
            const current = field.state.value ?? []
            field.handleChange(
              checked
                ? [...current, option.value]
                : current.filter((v) => v !== option.value)
            )
          }}
        />
        <FieldLabel htmlFor={\`${f.name}-\${option.value}\`}>{option.label}</FieldLabel>
      </div>
    ))}
  </div>${descEl(field, "below-control")}${error}
</FieldSet>`
    }

    case "slider": {
      const f = field as SliderField
      return `<Field data-invalid={isInvalid}>
  <div className="flex items-center justify-between">
    <FieldLabel>${label}</FieldLabel>
    <span className="text-sm font-medium tabular-nums">{field.state.value}</span>
  </div>${descEl(field, "above-control")}
  <Slider
    value={field.state.value}
    onValueChange={field.handleChange}
    min={${f.min}}
    max={${f.max}}
    step={${f.step}}
  />${descEl(field, "below-control")}${error}
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
    value={field.state.value ?? []}
    onValueChange={field.handleChange}`
        : `items={${constName}.map((o) => o.value)}
    itemToStringLabel={(value) =>
      ${constName}.find((o) => o.value === value)?.label ?? value
    }
    value={field.state.value || null}
    onValueChange={(value) => field.handleChange(value ?? "")}`

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

      let control: string
      if (f.multiple && f.displayStyle === "input") {
        control = `<ComboboxChips>
      <ComboboxValue>
        {(value: string[] | null) =>
          (value ?? []).map((v) => (
            <ComboboxChip key={v}>
              {${constName}.find((o) => o.value === v)?.label ?? v}
            </ComboboxChip>
          ))
        }
      </ComboboxValue>
      <ComboboxChipsInput id="${f.name}" placeholder="${placeholderAttr}" />${
        f.clearable ? `\n      <ComboboxClear />` : ""
      }
    </ComboboxChips>
    <ComboboxContent>
      <ComboboxEmpty>${emptyTextText}</ComboboxEmpty>
      ${list}
    </ComboboxContent>`
      } else if (f.displayStyle === "trigger") {
        const triggerInner = f.multiple
          ? `{field.state.value && field.state.value.length > 0 ? \`\${field.state.value.length} selected\` : <span className="text-muted-foreground">${placeholderText}</span>}`
          : `{field.state.value ? (${constName}.find((o) => o.value === field.state.value)?.label ?? field.state.value) : <span className="text-muted-foreground">${placeholderText}</span>}`
        control = `<ComboboxTrigger id="${f.name}" aria-invalid={isInvalid} className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs">
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
        } aria-invalid={isInvalid} />
    <ComboboxContent>
      <ComboboxEmpty>${emptyTextText}</ComboboxEmpty>
      ${list}
    </ComboboxContent>`
      }

      return `<Field data-invalid={isInvalid}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${reqSpan}
  </FieldLabel>${descEl(field, "above-control")}
  <Combobox
    ${rootProps}
  >
    ${control}
  </Combobox>${descEl(field, "below-control")}${error}
</Field>`
    }
  }
}

/** Generates a TanStack Form + Zod form component. */
export function generateTanstackFormCode(
  formName: string,
  submitLabel: string,
  fields: FormField[]
): string {
  const pascal = toPascalCase(formName) || "My"
  const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1)

  const imports = buildImports(fields, [
    'import { useForm } from "@tanstack/react-form"',
    'import { z } from "zod"',
  ])

  const fieldJSX = fields
    .map((f) => indent(wrapField(f.name, generateFieldInner(f)), 8))
    .join("\n\n")

  return `${imports}

${buildOptionsSection(fields)}${buildSchemaBlock(camel, pascal, fields)}

export function ${pascal}Form() {
  const form = useForm({
    defaultValues: {
${buildDefaultValueLines(fields)}
    } as ${pascal}FormValues,
    validators: {
      onSubmit: ${camel}FormSchema,
      onBlur: ${camel}FormSchema,
    },
    onSubmit: ({ value }) => {
      console.log(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup className="mb-6">
${fieldJSX}
      </FieldGroup>
      <Button type="submit" className="w-full" size="lg">${escapeJsxText(submitLabel)}</Button>
    </form>
  )
}
`
}
