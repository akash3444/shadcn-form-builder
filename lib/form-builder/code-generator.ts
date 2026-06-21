import type {
  FormField,
  FormLibrary,
  InputField,
  PasswordField,
  TextareaField,
  SelectField,
  RadioGroupField,
  CheckboxGroupField,
  SliderField,
  ComboboxField,
  DateField,
} from "./types"
import { toKebabCase, toPascalCase, isGrouped } from "./utils"
import { dateMatcherExprs } from "./validation-spec"
import {
  indent,
  getOptionsConstName,
  escapeJsxText,
  escapeJsxAttr,
  placeholderProp,
  labelText,
  requiredSpan,
  descEl,
  jsString,
  groupLayoutClass,
  comboboxCodegenParts,
  buildImports,
  buildOptionsSection,
  buildSchemaBlock,
  buildDefaultValueLines,
} from "./codegen-shared"
import { collectCompanions, type GeneratedFile } from "./codegen-companions"
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

    case "password": {
      const f = field as PasswordField
      const showToggleLine = f.showToggle ? "" : `\n        showToggle={false}`
      return `<Field data-invalid={!!form.formState.errors.${f.name}}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${reqSpan}
  </FieldLabel>${descEl(field, "above-control")}
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ field, fieldState }) => (
      <PasswordInput
        id="${f.name}"${showToggleLine}
        ${placeholderProp(f.placeholder)}
        aria-invalid={fieldState.invalid}
        {...field}
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
      const selectInner = isGrouped(f)
        ? `{${constName}.map((group, i) => (
            <SelectGroup key={i}>
              {i > 0 ? <SelectSeparator /> : null}
              {group.label ? <SelectLabel>{group.label}</SelectLabel> : null}
              {group.items.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectGroup>
          ))}`
        : `{${constName}.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}`
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
          ${selectInner}
        </SelectContent>
      </Select>
    )}
  />${descEl(field, "below-control")}${errorEl}
</Field>`
    }

    case "radio-group": {
      const f = field as RadioGroupField
      const constName = getOptionsConstName(f.name)
      const layoutClass = groupLayoutClass(f.orientation)
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
      const layoutClass = groupLayoutClass(f.orientation)
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
      const {
        constName,
        placeholderAttr,
        placeholderText,
        searchPlaceholderAttr,
        emptyTextText,
        grouped,
        flatExpr,
        itemsExpr,
      } = comboboxCodegenParts(f)

      const rootProps = f.multiple
        ? `multiple
        items={${itemsExpr}}
        itemToStringLabel={(value) =>
          ${flatExpr}.find((o) => o.value === value)?.label ?? value
        }
        value={field.value ?? []}
        onValueChange={field.onChange}`
        : `items={${itemsExpr}}
        itemToStringLabel={(value) =>
          ${flatExpr}.find((o) => o.value === value)?.label ?? value
        }
        value={field.value || null}
        onValueChange={(value) => field.onChange(value ?? "")}`

      const list = grouped
        ? `<ComboboxList>
          {(group, index) => (
            <ComboboxGroup key={index} items={group.items}>
              {index > 0 ? <ComboboxSeparator /> : null}
              {group.label ? <ComboboxLabel>{group.label}</ComboboxLabel> : null}
              <ComboboxCollection>
                {(value) => {
                  const option = ${flatExpr}.find((o) => o.value === value)
                  return (
                    <ComboboxItem key={value} value={value}>
                      {option?.label ?? value}
                    </ComboboxItem>
                  )
                }}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>`
        : `<ComboboxList>
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
                  {${flatExpr}.find((o) => o.value === v)?.label ?? v}
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
          : `{field.value ? (${flatExpr}.find((o) => o.value === field.value)?.label ?? field.value) : <span className="text-muted-foreground">${placeholderText}</span>}`
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

      const renderArgs = usesFieldState ? "field, fieldState" : "field"

      return `<Field data-invalid={!!form.formState.errors.${f.name}}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${reqSpan}
  </FieldLabel>${descEl(field, "above-control")}
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ ${renderArgs} }) => (
      <Combobox
        ${rootProps}
      >
        ${control}
      </Combobox>
    )}
  />${descEl(field, "below-control")}${errorEl}
</Field>`
    }

    case "date": {
      const f = field as DateField
      const placeholder = jsString(f.placeholder || "Pick a date")
      const matchers = dateMatcherExprs(f)
      const disabledLine = matchers.length
        ? `\n            disabled={[${matchers.join(", ")}]}`
        : ""
      const isRange = f.mode === "range"
      const emptyCheck = isRange ? "field.value?.from" : "field.value"
      const selectedExpr = isRange
        ? "field.value as DateRange | undefined"
        : "field.value"
      const triggerLabel = isRange
        ? `{field.value?.from ? (field.value.to ? \`\${format(field.value.from, "LLL dd, y")} – \${format(field.value.to, "LLL dd, y")}\` : format(field.value.from, "LLL dd, y")) : ${placeholder}}`
        : `{field.value ? format(field.value, "PPP") : ${placeholder}}`
      return `<Field data-invalid={!!form.formState.errors.${f.name}}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${reqSpan}
  </FieldLabel>${descEl(field, "above-control")}
  <Controller
    name="${f.name}"
    control={form.control}
    render={({ field, fieldState }) => (
      <Popover>
        <PopoverTrigger
          render={
            <Button
              id="${f.name}"
              variant="outline"
              aria-invalid={fieldState.invalid}
              className={cn("w-full justify-start text-left font-normal", !${emptyCheck} && "text-muted-foreground")}
            >
              <CalendarIcon />
              ${triggerLabel}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="${f.mode}"
            captionLayout="${f.captionLayout}"
            selected={${selectedExpr}}
            onSelect={field.onChange}${disabledLine}
            autoFocus
          />
        </PopoverContent>
      </Popover>
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
 * Generates the files for the given fields and selected form library: the form
 * component plus any companion component files its field types require (e.g.
 * `password-input.tsx`). Both per-library generators share the Zod schema,
 * options constants, and shadcn imports via codegen-shared.ts. The form file is
 * always first; companions follow in a stable, deduped order.
 */
export function generateFormCode(
  formName: string,
  submitLabel: string,
  fields: FormField[],
  formLibrary: FormLibrary = "react-hook-form"
): GeneratedFile[] {
  if (fields.length === 0) {
    return [
      {
        filename: "form.tsx",
        language: "tsx",
        code: `// Add fields to your form to generate code.`,
      },
    ]
  }

  const pascal = toPascalCase(formName) || "My"
  const formCode =
    formLibrary === "tanstack-form"
      ? generateTanstackFormCode(formName, submitLabel, fields)
      : generateReactHookFormCode(formName, submitLabel, fields)

  const formFile: GeneratedFile = {
    filename: `${toKebabCase(pascal)}-form.tsx`,
    language: "tsx",
    code: formCode,
  }

  return [formFile, ...collectCompanions(fields)]
}
