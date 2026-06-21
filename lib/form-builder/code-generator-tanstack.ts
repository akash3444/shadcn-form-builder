import type {
  FormField,
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
import { toPascalCase, isGrouped } from "./utils"
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

/**
 * TanStack Form generator. Shares the Zod schema, options constants, labels,
 * descriptions, and shadcn imports with the React Hook Form generator (via
 * codegen-shared.ts); only the field-binding layer differs. Validation runs on
 * change and submit (no onBlur validator) so controls that don't emit a blur —
 * e.g. picking a date in a Calendar popover — still re-run validation and clear
 * a prior error; errors stay gated behind `isTouched && !isValid`, so they only
 * surface once a field is blurred or the form is submitted.
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

    case "password": {
      const f = field as PasswordField
      const showToggleLine = f.showToggle ? "" : `\n    showToggle={false}`
      return `<Field data-invalid={isInvalid}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${reqSpan}
  </FieldLabel>${descEl(field, "above-control")}
  <PasswordInput
    id="${f.name}"
    name="${f.name}"${showToggleLine}
    ${placeholderProp(f.placeholder)}
    value={field.state.value}
    onChange={(e) => field.handleChange(e.target.value)}
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
      return `<Field data-invalid={isInvalid}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${reqSpan}
  </FieldLabel>${descEl(field, "above-control")}
  <Select value={String(field.state.value ?? "")} onValueChange={(value) => field.handleChange(value ?? "")} items={${constName}}>
    <SelectTrigger id="${f.name}" aria-invalid={isInvalid} className="w-full">
      <SelectValue placeholder="${escapeJsxAttr(f.placeholder) || "Select an option"}" />
    </SelectTrigger>
    <SelectContent>
      ${selectInner}
    </SelectContent>
  </Select>${descEl(field, "below-control")}${error}
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
      const layoutClass = groupLayoutClass(f.orientation)
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
    value={field.state.value ?? []}
    onValueChange={field.handleChange}`
        : `items={${itemsExpr}}
    itemToStringLabel={(value) =>
      ${flatExpr}.find((o) => o.value === value)?.label ?? value
    }
    value={field.state.value || null}
    onValueChange={(value) => field.handleChange(value ?? "")}`

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
          : `{field.state.value ? (${flatExpr}.find((o) => o.value === field.state.value)?.label ?? field.state.value) : <span className="text-muted-foreground">${placeholderText}</span>}`
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

    case "date": {
      const f = field as DateField
      const placeholder = jsString(f.placeholder || "Pick a date")
      const matchers = dateMatcherExprs(f)
      const disabledLine = matchers.length
        ? `\n        disabled={[${matchers.join(", ")}]}`
        : ""
      const isRange = f.mode === "range"
      const emptyCheck = isRange ? "field.state.value?.from" : "field.state.value"
      const selectedExpr = isRange
        ? "field.state.value as DateRange | undefined"
        : "field.state.value"
      const triggerLabel = isRange
        ? `{field.state.value?.from ? (field.state.value.to ? \`\${format(field.state.value.from, "LLL dd, y")} – \${format(field.state.value.to, "LLL dd, y")}\` : format(field.state.value.from, "LLL dd, y")) : ${placeholder}}`
        : `{field.state.value ? format(field.state.value, "PPP") : ${placeholder}}`
      return `<Field data-invalid={isInvalid}>
  <FieldLabel htmlFor="${f.name}">
    ${label}${reqSpan}
  </FieldLabel>${descEl(field, "above-control")}
  <Popover>
    <PopoverTrigger
      render={
        <Button
          id="${f.name}"
          variant="outline"
          aria-invalid={isInvalid}
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
        onSelect={(value) => field.handleChange(value)}${disabledLine}
        autoFocus
      />
    </PopoverContent>
  </Popover>${descEl(field, "below-control")}${error}
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
      onChange: ${camel}FormSchema,
      onSubmit: ${camel}FormSchema,
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
