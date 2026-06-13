"use client"

import { useEffect } from "react"
import { EyeIcon } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import type { FormField } from "@/lib/form-builder/types"
import { buildSchema, buildDefaultValues } from "@/lib/form-builder/schema"
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
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"

// ---------------------------------------------------------------------------
// Individual field renderers
// ---------------------------------------------------------------------------

function FieldWrapper({
  label,
  required,
  description,
  descriptionPosition,
  error,
  htmlFor,
  children,
}: {
  label: string
  required: boolean
  description: string
  descriptionPosition: "above-control" | "below-control"
  error?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <Field data-invalid={!!error}>
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
      <FieldError>{error}</FieldError>
    </Field>
  )
}

// ---------------------------------------------------------------------------
// Main preview form
// ---------------------------------------------------------------------------

interface PreviewFormProps {
  formName: string
  submitLabel: string
  fields: FormField[]
}

export function PreviewForm({
  formName,
  submitLabel,
  fields,
}: PreviewFormProps) {
  const schema = buildSchema(fields)
  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(fields) as FormValues,
  })

  // Reset form when fields change to avoid stale field state
  const fieldResetKey = JSON.stringify(
    fields.map((f) => ({
      name: f.name,
      defaultValue: f.defaultValue,
      // The combobox value SHAPE depends on `multiple` (string vs string[]).
      // Toggling it must re-init the form, or the control receives a stale
      // value of the wrong shape.
      multiple: f.type === "combobox" ? f.multiple : undefined,
    }))
  )
  useEffect(() => {
    form.reset(buildDefaultValues(fields) as FormValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldResetKey])

  function onSubmit(values: FormValues) {
    toast.message("Form submitted", {
      description: (
        <pre className="mt-1 max-h-48 overflow-auto rounded bg-background/5 text-xs">
          {JSON.stringify(values, null, 2)}
        </pre>
      ),
    })
  }

  if (fields.length === 0) {
    return (
      <Empty className="border-none">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <EyeIcon />
          </EmptyMedia>
          <EmptyTitle>Your form preview will appear here</EmptyTitle>
          <EmptyDescription>
            Add fields from the left panel to get started
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {formName && <h2 className="mb-6 text-xl font-semibold">{formName}</h2>}
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="mb-6">
          {fields.map((field) => {
            const error = form.formState.errors[field.name]?.message as
              | string
              | undefined

            switch (field.type) {
              case "input":
                return (
                  <FieldWrapper
                    key={field.id}
                    label={field.label}
                    required={field.required}
                    description={field.description}
                    descriptionPosition={field.descriptionPosition}
                    error={error}
                    htmlFor={field.name}
                  >
                    <Controller
                      name={field.name}
                      control={form.control}
                      render={({ field: f, fieldState }) => (
                        <Input
                          id={field.name}
                          type={field.inputType}
                          placeholder={field.placeholder}
                          aria-invalid={fieldState.invalid}
                          value={f.value ?? ""}
                          onChange={
                            field.inputType === "number"
                              ? (e) =>
                                  f.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : e.target.valueAsNumber
                                  )
                              : f.onChange
                          }
                          onBlur={f.onBlur}
                          name={f.name}
                          ref={f.ref}
                        />
                      )}
                    />
                  </FieldWrapper>
                )

              case "textarea":
                return (
                  <FieldWrapper
                    key={field.id}
                    label={field.label}
                    required={field.required}
                    description={field.description}
                    descriptionPosition={field.descriptionPosition}
                    error={error}
                    htmlFor={field.name}
                  >
                    <Controller
                      name={field.name}
                      control={form.control}
                      render={({ field: f, fieldState }) => (
                        <Textarea
                          id={field.name}
                          placeholder={field.placeholder}
                          rows={field.rows}
                          aria-invalid={fieldState.invalid}
                          className="resize-none"
                          value={f.value as string}
                          onChange={f.onChange}
                          onBlur={f.onBlur}
                          name={f.name}
                          ref={f.ref}
                        />
                      )}
                    />
                  </FieldWrapper>
                )

              case "checkbox":
                return (
                  <Field
                    key={field.id}
                    orientation="horizontal"
                    data-invalid={!!error}
                  >
                    <Controller
                      name={field.name}
                      control={form.control}
                      render={({ field: f }) => (
                        <Checkbox
                          id={field.name}
                          checked={Boolean(f.value)}
                          onCheckedChange={f.onChange}
                          aria-invalid={!!error}
                        />
                      )}
                    />
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>
                        {field.label}
                        {field.required && (
                          <span className="text-destructive">*</span>
                        )}
                      </FieldLabel>
                      {field.description && (
                        <FieldDescription>{field.description}</FieldDescription>
                      )}
                      <FieldError>{error}</FieldError>
                    </FieldContent>
                  </Field>
                )

              case "switch":
                return (
                  <Field
                    key={field.id}
                    orientation="horizontal"
                    data-invalid={!!error}
                  >
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>
                        {field.label}
                        {field.required && (
                          <span className="text-destructive">*</span>
                        )}
                      </FieldLabel>
                      {field.description && (
                        <FieldDescription>{field.description}</FieldDescription>
                      )}
                      <FieldError>{error}</FieldError>
                    </FieldContent>
                    <Controller
                      name={field.name}
                      control={form.control}
                      render={({ field: f }) => (
                        <Switch
                          id={field.name}
                          checked={Boolean(f.value)}
                          onCheckedChange={f.onChange}
                        />
                      )}
                    />
                  </Field>
                )

              case "select":
                return (
                  <FieldWrapper
                    key={field.id}
                    label={field.label}
                    required={field.required}
                    description={field.description}
                    descriptionPosition={field.descriptionPosition}
                    error={error}
                    htmlFor={field.name}
                  >
                    <Controller
                      name={field.name}
                      control={form.control}
                      render={({ field: f, fieldState }) => (
                        <Select
                          value={String(f.value ?? "")}
                          onValueChange={f.onChange}
                          items={field.options}
                        >
                          <SelectTrigger
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                            className="w-full"
                          >
                            <SelectValue
                              placeholder={
                                field.placeholder || "Select an option"
                              }
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
                      )}
                    />
                  </FieldWrapper>
                )

              case "radio-group":
                return (
                  <FieldSet key={field.id}>
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
                    <Controller
                      name={field.name}
                      control={form.control}
                      render={({ field: f }) => (
                        <RadioGroup
                          value={String(f.value ?? "")}
                          onValueChange={f.onChange}
                          className={cn(
                            "flex gap-3",
                            field.orientation === "horizontal"
                              ? "flex-row flex-wrap"
                              : "flex-col"
                          )}
                        >
                          {field.options.map((opt) => (
                            <div
                              key={opt.id}
                              className="flex items-center gap-2"
                            >
                              <RadioGroupItem
                                value={opt.value}
                                id={`${field.name}-${opt.value}`}
                              />
                              <FieldLabel
                                htmlFor={`${field.name}-${opt.value}`}
                              >
                                {opt.label}
                              </FieldLabel>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    />
                    {field.description &&
                      field.descriptionPosition === "below-control" && (
                        <FieldDescription>{field.description}</FieldDescription>
                      )}
                    <FieldError>{error}</FieldError>
                  </FieldSet>
                )

              case "checkbox-group":
                return (
                  <FieldSet key={field.id}>
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
                    <Controller
                      name={field.name}
                      control={form.control}
                      render={({ field: f }) => (
                        <div
                          className={cn(
                            "flex gap-3",
                            field.orientation === "horizontal"
                              ? "flex-row flex-wrap"
                              : "flex-col"
                          )}
                        >
                          {field.options.map((opt) => (
                            <div
                              key={opt.id}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={`${field.name}-${opt.value}`}
                                checked={((f.value as string[]) ?? []).includes(
                                  opt.value
                                )}
                                onCheckedChange={(checked) => {
                                  const current = (f.value as string[]) ?? []
                                  f.onChange(
                                    checked
                                      ? [...current, opt.value]
                                      : current.filter((v) => v !== opt.value)
                                  )
                                }}
                              />
                              <FieldLabel
                                htmlFor={`${field.name}-${opt.value}`}
                              >
                                {opt.label}
                              </FieldLabel>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                    {field.description &&
                      field.descriptionPosition === "below-control" && (
                        <FieldDescription>{field.description}</FieldDescription>
                      )}
                    <FieldError>{error}</FieldError>
                  </FieldSet>
                )

              case "slider":
                return (
                  <Field
                    key={field.id}
                    data-invalid={!!error}
                  >
                    <Controller
                      name={field.name}
                      control={form.control}
                      render={({ field: f }) => (
                        <>
                          <div className="flex items-center justify-between">
                            <FieldLabel>{field.label}</FieldLabel>
                            <span className="text-sm font-medium tabular-nums">
                              {f.value as number}
                            </span>
                          </div>
                          {field.description &&
                            field.descriptionPosition === "above-control" && (
                              <FieldDescription>
                                {field.description}
                              </FieldDescription>
                            )}
                          <Slider
                            value={(f.value as number) ?? field.min}
                            onValueChange={f.onChange}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                          />
                          {field.description &&
                            field.descriptionPosition === "below-control" && (
                              <FieldDescription>
                                {field.description}
                              </FieldDescription>
                            )}
                        </>
                      )}
                    />
                    <FieldError>{error}</FieldError>
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

                return (
                  <FieldWrapper
                    key={field.id}
                    label={field.label}
                    required={field.required}
                    description={field.description}
                    descriptionPosition={field.descriptionPosition}
                    error={error}
                    htmlFor={field.name}
                  >
                    <Controller
                      name={field.name}
                      control={form.control}
                      render={({ field: f, fieldState }) => {
                        if (field.multiple) {
                          const arr = Array.isArray(f.value)
                            ? (f.value as string[])
                            : []
                          if (field.displayStyle === "input") {
                            return (
                              <Combobox
                                multiple
                                items={values}
                                itemToStringLabel={labelFor}
                                value={arr}
                                onValueChange={f.onChange}
                              >
                                <ComboboxChips>
                                  <ComboboxValue>
                                    {(value: string[] | null) =>
                                      (value ?? []).map((v) => (
                                        <ComboboxChip key={v}>
                                          {labelFor(v)}
                                        </ComboboxChip>
                                      ))
                                    }
                                  </ComboboxValue>
                                  <ComboboxChipsInput
                                    id={field.name}
                                    placeholder={placeholder}
                                  />
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
                          }
                          return (
                            <Combobox
                              multiple
                              items={values}
                              itemToStringLabel={labelFor}
                              value={arr}
                              onValueChange={f.onChange}
                            >
                              <ComboboxTrigger
                                id={field.name}
                                aria-invalid={fieldState.invalid}
                                className={triggerClass}
                              >
                                <span className="truncate">
                                  {arr.length > 0 ? (
                                    `${arr.length} selected`
                                  ) : (
                                    <span className="text-muted-foreground">
                                      {placeholder}
                                    </span>
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

                        const single =
                          typeof f.value === "string" ? f.value : ""
                        if (field.displayStyle === "trigger") {
                          return (
                            <Combobox
                              items={values}
                              itemToStringLabel={labelFor}
                              value={single || null}
                              onValueChange={(v) => f.onChange(v ?? "")}
                            >
                              <ComboboxTrigger
                                id={field.name}
                                aria-invalid={fieldState.invalid}
                                className={triggerClass}
                              >
                                <span className="truncate">
                                  {single ? (
                                    labelFor(single)
                                  ) : (
                                    <span className="text-muted-foreground">
                                      {placeholder}
                                    </span>
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

                        return (
                          <Combobox
                            items={values}
                            itemToStringLabel={labelFor}
                            value={single || null}
                            onValueChange={(v) => f.onChange(v ?? "")}
                          >
                            <ComboboxInput
                              id={field.name}
                              placeholder={placeholder}
                              showClear={field.clearable}
                              aria-invalid={fieldState.invalid}
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
                      }}
                    />
                  </FieldWrapper>
                )
              }
            }
          })}
        </FieldGroup>
        <Button type="submit" className="w-full" size="lg">
          {submitLabel}
        </Button>
      </form>
    </div>
  )
}
