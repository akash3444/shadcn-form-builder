import type {
  FormField,
  FormLibrary,
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
import { generateTanstackFormCode } from "./code-generator-tanstack"

function generateFieldJSX(field: FormField): string {
  const label = labelText(field)
  const reqSpan = requiredSpan(field)
  const descInner = field.description
    ? `\n    <FieldDescription>${escapeJsxText(field.description)}</FieldDescription>`
    : ""

  const errorEl = `\n  <FieldError>{form.formState.errors.${field.name}?.message}</FieldError>`

  switch (field.type) {
    case "input": {
      const f = field as InputField
      const inputProps =
        f.inputType === "number"
          ? `id="${f.name}"
        type="number"
        ${placeholderProp(f.placeholder)}
        aria-invalid={fieldState.invalid}
        value={field.value ?? ""}
        onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)}
        onBlur={field.onBlur}
        name={field.name}
        ref={field.ref}`
          : `id="${f.name}"
        type="${f.inputType}"
        ${placeholderProp(f.placeholder)}
        aria-invalid={fieldState.invalid}
        {...field}`
      return `<Field data-invalid={!!form.formState.errors.${f.name}}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${reqSpan}
  </FieldLabel>${descEl(field, "above-control")}
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ field, fieldState }) => (
      <Input
        ${inputProps}
      />
    )}
  />${descEl(field, "below-control")}${errorEl}
</Field>`
    }

    case "textarea": {
      const f = field as TextareaField
      return `<Field data-invalid={!!form.formState.errors.${f.name}}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${reqSpan}
  </FieldLabel>${descEl(field, "above-control")}
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ field, fieldState }) => (
      <Textarea
        id="${f.name}"
        ${placeholderProp(f.placeholder)}
        rows={${f.rows}}
        aria-invalid={fieldState.invalid}
        className="resize-none"
        {...field}
      />
    )}
  />${descEl(field, "below-control")}${errorEl}
</Field>`
    }

    case "checkbox": {
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
      ${label}${reqSpan}
    </FieldLabel>${descInner}
    <FieldError>{form.formState.errors.${field.name}?.message}</FieldError>
  </FieldContent>
</Field>`
    }

    case "switch": {
      return `<Field orientation="horizontal" data-invalid={!!form.formState.errors.${field.name}}>
  <FieldContent>
    <FieldLabel htmlFor="${field.name}">
      ${label}${reqSpan}
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
    ${label}${reqSpan}
  </FieldLabel>${descEl(field, "above-control")}
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
  />${descEl(field, "below-control")}${errorEl}
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
  />${descEl(field, "below-control")}
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
    ${label}${reqSpan}
  </FieldLegend>${descEl(field, "above-control")}
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
  />${descEl(field, "below-control")}
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
        </div>${descEl(field, "above-control")}
        <Slider
          value={field.value}
          onValueChange={field.onChange}
          min={${f.min}}
          max={${f.max}}
          step={${f.step}}
        />
      </>
    )}
  />${descEl(field, "below-control")}${errorEl}
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
            {(value: string[] | null) =>
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
    ${label}${reqSpan}
  </FieldLabel>${descEl(field, "above-control")}
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
  />${descEl(field, "below-control")}${errorEl}
</Field>`
    }
  }
}

/** Generates a React Hook Form + Zod form component. */
function generateReactHookFormCode(
  formName: string,
  submitLabel: string,
  fields: FormField[]
): string {
  const pascal = toPascalCase(formName) || "My"
  const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1)

  const imports = buildImports(fields, [
    'import { useForm, Controller } from "react-hook-form"',
    'import { zodResolver } from "@hookform/resolvers/zod"',
    'import { z } from "zod"',
  ])

  const fieldJSX = fields
    .map((f) => indent(generateFieldJSX(f), 8))
    .join("\n\n")

  return `${imports}

${buildOptionsSection(fields)}${buildSchemaBlock(camel, pascal, fields)}

export function ${pascal}Form() {
  const form = useForm<${pascal}FormValues>({
    resolver: zodResolver(${camel}FormSchema),
    defaultValues: {
${buildDefaultValueLines(fields)}
    },
  })

  function onSubmit(values: ${pascal}FormValues) {
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

/**
 * Generates the form component source for the given fields and selected form
 * library. Dispatches to the per-library generator; both share the Zod schema,
 * options constants, and shadcn imports via codegen-shared.ts.
 */
export function generateFormCode(
  formName: string,
  submitLabel: string,
  fields: FormField[],
  formLibrary: FormLibrary = "react-hook-form"
): string {
  if (fields.length === 0) {
    return `// Add fields to your form to generate code.`
  }

  if (formLibrary === "tanstack-form") {
    return generateTanstackFormCode(formName, submitLabel, fields)
  }

  return generateReactHookFormCode(formName, submitLabel, fields)
}
