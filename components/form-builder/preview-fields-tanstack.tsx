"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import type { FormField } from "@/lib/form-builder/types"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxClear,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import { cn } from "@/lib/utils"

function FieldWrapper({
  label,
  required,
  description,
  descriptionPosition,
  isInvalid,
  errors,
  htmlFor,
  children,
}: {
  label: string
  required: boolean
  description: string
  descriptionPosition: "above-control" | "below-control"
  isInvalid: boolean
  errors: Array<{ message?: string } | undefined>
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      {description && descriptionPosition === "above-control" && (
        <FieldDescription>{description}</FieldDescription>
      )}
      {children}
      {description && descriptionPosition === "below-control" && (
        <FieldDescription>{description}</FieldDescription>
      )}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  )
}

interface TanstackPreviewFieldProps {
  field: FormField
  /** The TanStack field API from the surrounding `<form.Field>` render prop. */
  api: AnyFieldApi
}

/** Runtime mirror of the TanStack code generator, for the live preview. */
export function TanstackPreviewField({ field, api }: TanstackPreviewFieldProps) {
  const isInvalid = api.state.meta.isTouched && !api.state.meta.isValid
  const errors = api.state.meta.errors as Array<{ message?: string } | undefined>

  switch (field.type) {
    case "input":
      return (
        <FieldWrapper
          label={field.label}
          required={field.required}
          description={field.description}
          descriptionPosition={field.descriptionPosition}
          isInvalid={isInvalid}
          errors={errors}
          htmlFor={field.name}
        >
          <Input
            id={field.name}
            name={field.name}
            type={field.inputType}
            placeholder={field.placeholder}
            aria-invalid={isInvalid}
            value={api.state.value ?? ""}
            onChange={
              field.inputType === "number"
                ? (e) =>
                    api.handleChange(
                      e.target.value === ""
                        ? undefined
                        : e.target.valueAsNumber
                    )
                : (e) => api.handleChange(e.target.value)
            }
            onBlur={api.handleBlur}
          />
        </FieldWrapper>
      )

    case "textarea":
      return (
        <FieldWrapper
          label={field.label}
          required={field.required}
          description={field.description}
          descriptionPosition={field.descriptionPosition}
          isInvalid={isInvalid}
          errors={errors}
          htmlFor={field.name}
        >
          <Textarea
            id={field.name}
            name={field.name}
            placeholder={field.placeholder}
            rows={field.rows}
            aria-invalid={isInvalid}
            className="resize-none"
            value={api.state.value ?? ""}
            onChange={(e) => api.handleChange(e.target.value)}
            onBlur={api.handleBlur}
          />
        </FieldWrapper>
      )

    case "checkbox":
      return (
        <Field orientation="horizontal" data-invalid={isInvalid}>
          <Checkbox
            id={field.name}
            name={field.name}
            checked={Boolean(api.state.value)}
            onCheckedChange={(checked) => api.handleChange(checked === true)}
            onBlur={api.handleBlur}
            aria-invalid={isInvalid}
          />
          <FieldContent>
            <FieldLabel htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </FieldLabel>
            {field.description && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
            {isInvalid && <FieldError errors={errors} />}
          </FieldContent>
        </Field>
      )

    case "switch":
      return (
        <Field orientation="horizontal" data-invalid={isInvalid}>
          <FieldContent>
            <FieldLabel htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </FieldLabel>
            {field.description && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
            {isInvalid && <FieldError errors={errors} />}
          </FieldContent>
          <Switch
            id={field.name}
            name={field.name}
            checked={Boolean(api.state.value)}
            onCheckedChange={(checked) => api.handleChange(checked)}
            onBlur={api.handleBlur}
          />
        </Field>
      )

    case "select":
      return (
        <FieldWrapper
          label={field.label}
          required={field.required}
          description={field.description}
          descriptionPosition={field.descriptionPosition}
          isInvalid={isInvalid}
          errors={errors}
          htmlFor={field.name}
        >
          <Select
            value={String(api.state.value ?? "")}
            onValueChange={api.handleChange}
            items={field.options}
          >
            <SelectTrigger
              id={field.name}
              aria-invalid={isInvalid}
              className="w-full"
            >
              <SelectValue
                placeholder={field.placeholder || "Select an option"}
              />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt.id} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>
      )

    case "radio-group":
      return (
        <FieldSet>
          <FieldLegend variant="label">
            {field.label}
            {field.required && (
              <span className="ms-1 text-destructive">*</span>
            )}
          </FieldLegend>
          {field.description &&
            field.descriptionPosition === "above-control" && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
          <RadioGroup
            value={String(api.state.value ?? "")}
            onValueChange={api.handleChange}
            className={cn(
              "flex gap-3",
              field.orientation === "horizontal"
                ? "flex-row flex-wrap"
                : "flex-col"
            )}
          >
            {field.options.map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <RadioGroupItem
                  value={opt.value}
                  id={`${field.name}-${opt.value}`}
                />
                <FieldLabel htmlFor={`${field.name}-${opt.value}`}>
                  {opt.label}
                </FieldLabel>
              </div>
            ))}
          </RadioGroup>
          {field.description &&
            field.descriptionPosition === "below-control" && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
          {isInvalid && <FieldError errors={errors} />}
        </FieldSet>
      )

    case "checkbox-group":
      return (
        <FieldSet>
          <FieldLegend variant="label">
            {field.label}
            {field.required && (
              <span className="ms-1 text-destructive">*</span>
            )}
          </FieldLegend>
          {field.description &&
            field.descriptionPosition === "above-control" && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
          <div
            className={cn(
              "flex gap-3",
              field.orientation === "horizontal"
                ? "flex-row flex-wrap"
                : "flex-col"
            )}
          >
            {field.options.map((opt) => {
              const current = (api.state.value as string[]) ?? []
              return (
                <div key={opt.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`${field.name}-${opt.value}`}
                    checked={current.includes(opt.value)}
                    onCheckedChange={(checked) =>
                      api.handleChange(
                        checked
                          ? [...current, opt.value]
                          : current.filter((v) => v !== opt.value)
                      )
                    }
                  />
                  <FieldLabel htmlFor={`${field.name}-${opt.value}`}>
                    {opt.label}
                  </FieldLabel>
                </div>
              )
            })}
          </div>
          {field.description &&
            field.descriptionPosition === "below-control" && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
          {isInvalid && <FieldError errors={errors} />}
        </FieldSet>
      )

    case "slider":
      return (
        <Field data-invalid={isInvalid}>
          <div className="flex items-center justify-between">
            <FieldLabel>{field.label}</FieldLabel>
            <span className="text-sm font-medium tabular-nums">
              {api.state.value as number}
            </span>
          </div>
          {field.description &&
            field.descriptionPosition === "above-control" && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
          <Slider
            value={(api.state.value as number) ?? field.min}
            onValueChange={api.handleChange}
            min={field.min}
            max={field.max}
            step={field.step}
          />
          {field.description &&
            field.descriptionPosition === "below-control" && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
          {isInvalid && <FieldError errors={errors} />}
        </Field>
      )

    case "combobox": {
      const opts = field.options
      const values = opts.map((o) => o.value)
      const labelFor = (v: string) =>
        opts.find((o) => o.value === v)?.label ?? v
      const placeholder =
        field.placeholder ||
        (field.multiple ? "Select options" : "Select an option")
      const emptyText = field.emptyText || "No results found."
      const searchPlaceholder = field.searchPlaceholder || "Search..."
      const triggerClass =
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"

      let control: React.ReactNode
      if (field.multiple) {
        const arr = Array.isArray(api.state.value)
          ? (api.state.value as string[])
          : []
        if (field.displayStyle === "input") {
          control = (
            <Combobox
              multiple
              items={values}
              itemToStringLabel={labelFor}
              value={arr}
              onValueChange={api.handleChange}
            >
              <ComboboxChips>
                <ComboboxValue>
                  {(value: string[] | null) =>
                    (value ?? []).map((v) => (
                      <ComboboxChip key={v}>{labelFor(v)}</ComboboxChip>
                    ))
                  }
                </ComboboxValue>
                <ComboboxChipsInput id={field.name} placeholder={placeholder} />
                {field.clearable && <ComboboxClear />}
              </ComboboxChips>
              <ComboboxContent>
                <ComboboxEmpty>{emptyText}</ComboboxEmpty>
                <ComboboxList>
                  {(v: string) => (
                    <ComboboxItem key={v} value={v}>
                      {labelFor(v)}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          )
        } else {
          control = (
            <Combobox
              multiple
              items={values}
              itemToStringLabel={labelFor}
              value={arr}
              onValueChange={api.handleChange}
            >
              <ComboboxTrigger
                id={field.name}
                aria-invalid={isInvalid}
                className={triggerClass}
              >
                <span className="truncate">
                  {arr.length > 0 ? (
                    `${arr.length} selected`
                  ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                  )}
                </span>
              </ComboboxTrigger>
              <ComboboxContent>
                <ComboboxInput
                  showTrigger={false}
                  showClear={field.clearable}
                  placeholder={searchPlaceholder}
                />
                <ComboboxEmpty>{emptyText}</ComboboxEmpty>
                <ComboboxList>
                  {(v: string) => (
                    <ComboboxItem key={v} value={v}>
                      {labelFor(v)}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          )
        }
      } else {
        const single =
          typeof api.state.value === "string" ? (api.state.value as string) : ""
        if (field.displayStyle === "trigger") {
          control = (
            <Combobox
              items={values}
              itemToStringLabel={labelFor}
              value={single || null}
              onValueChange={(v) => api.handleChange(v ?? "")}
            >
              <ComboboxTrigger
                id={field.name}
                aria-invalid={isInvalid}
                className={triggerClass}
              >
                <span className="truncate">
                  {single ? (
                    labelFor(single)
                  ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                  )}
                </span>
              </ComboboxTrigger>
              <ComboboxContent>
                <ComboboxInput
                  showTrigger={false}
                  showClear={field.clearable}
                  placeholder={searchPlaceholder}
                />
                <ComboboxEmpty>{emptyText}</ComboboxEmpty>
                <ComboboxList>
                  {(v: string) => (
                    <ComboboxItem key={v} value={v}>
                      {labelFor(v)}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          )
        } else {
          control = (
            <Combobox
              items={values}
              itemToStringLabel={labelFor}
              value={single || null}
              onValueChange={(v) => api.handleChange(v ?? "")}
            >
              <ComboboxInput
                id={field.name}
                placeholder={placeholder}
                showClear={field.clearable}
                aria-invalid={isInvalid}
              />
              <ComboboxContent>
                <ComboboxEmpty>{emptyText}</ComboboxEmpty>
                <ComboboxList>
                  {(v: string) => (
                    <ComboboxItem key={v} value={v}>
                      {labelFor(v)}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          )
        }
      }

      return (
        <FieldWrapper
          label={field.label}
          required={field.required}
          description={field.description}
          descriptionPosition={field.descriptionPosition}
          isInvalid={isInvalid}
          errors={errors}
          htmlFor={field.name}
        >
          {control}
        </FieldWrapper>
      )
    }
  }
}
