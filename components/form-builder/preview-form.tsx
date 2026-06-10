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
import type {
  FormField,
  NumberValidation,
  StringValidation,
} from "@/lib/form-builder/types"
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
// Dynamic schema builder
// ---------------------------------------------------------------------------

function buildSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of fields) {
    switch (field.type) {
      case "input": {
        if (field.inputType === "number") {
          const v = (field.validation ?? {}) as NumberValidation
          let n = field.required
            ? z.number({ required_error: "This field is required" })
            : z.number()
          if (v.min !== undefined) n = n.min(v.min, `Must be at least ${v.min}`)
          if (v.max !== undefined) n = n.max(v.max, `Must be at most ${v.max}`)
          shape[field.name] = field.required ? n : n.optional()
          break
        }
        const v = (field.validation ?? {}) as StringValidation
        let s = z.string()
        if (field.inputType === "email") s = s.email("Invalid email address")
        if (field.inputType === "url") s = s.url("Invalid URL")
        if (field.required && !v.minLength) s = s.min(1, "This field is required")
        if (v.minLength && field.required) s = s.min(v.minLength, `Must be at least ${v.minLength} characters`)
        if (v.maxLength) s = s.max(v.maxLength, `Must be at most ${v.maxLength} characters`)
        shape[field.name] =
          v.minLength && !field.required
            ? s.refine((val) => val.length === 0 || val.length >= v.minLength!, `Must be at least ${v.minLength} characters`)
            : s
        break
      }
      case "textarea": {
        const v = (field.validation ?? {}) as StringValidation
        let s = z.string()
        if (field.required && !v.minLength) s = s.min(1, "This field is required")
        if (v.minLength && field.required) s = s.min(v.minLength, `Must be at least ${v.minLength} characters`)
        if (v.maxLength) s = s.max(v.maxLength, `Must be at most ${v.maxLength} characters`)
        shape[field.name] =
          v.minLength && !field.required
            ? s.refine((val) => val.length === 0 || val.length >= v.minLength!, `Must be at least ${v.minLength} characters`)
            : s
        break
      }
      case "checkbox":
      case "switch":
        shape[field.name] = field.required
          ? z.boolean().refine((v) => v === true, "This field is required")
          : z.boolean().default(false)
        break
      case "select":
      case "radio-group":
        shape[field.name] = field.required
          ? z.string().min(1, "Please select an option")
          : z.string()
        break
      case "checkbox-group":
        shape[field.name] = field.required
          ? z.array(z.string()).min(1, "Select at least one option")
          : z.array(z.string()).default([])
        break
    }
  }
  return z.object(shape)
}

function buildDefaultValues(fields: FormField[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}
  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      defaults[field.name] = field.defaultValue
      continue
    }
    switch (field.type) {
      case "input":
        defaults[field.name] = field.inputType === "number" ? undefined : ""
        break
      case "textarea":
      case "select":
      case "radio-group":
        defaults[field.name] = ""
        break
      case "checkbox":
      case "switch":
        defaults[field.name] = false
        break
      case "checkbox-group":
        defaults[field.name] = []
        break
    }
  }
  return defaults
}

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
  disabled,
  children,
}: {
  label: string
  required: boolean
  description: string
  descriptionPosition: "above-control" | "below-control"
  error?: string
  htmlFor?: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Field data-invalid={!!error} data-disabled={disabled}>
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
    fields.map((f) => ({ name: f.name, defaultValue: f.defaultValue }))
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
                    disabled={field.disabled}
                  >
                    <Controller
                      name={field.name}
                      control={form.control}
                      render={({ field: f, fieldState }) => (
                        <Input
                          id={field.name}
                          type={field.inputType}
                          placeholder={field.placeholder}
                          disabled={field.disabled}
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
                    disabled={field.disabled}
                  >
                    <Controller
                      name={field.name}
                      control={form.control}
                      render={({ field: f, fieldState }) => (
                        <Textarea
                          id={field.name}
                          placeholder={field.placeholder}
                          rows={field.rows}
                          disabled={field.disabled}
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
                    data-disabled={field.disabled}
                  >
                    <Controller
                      name={field.name}
                      control={form.control}
                      render={({ field: f }) => (
                        <Checkbox
                          id={field.name}
                          checked={Boolean(f.value)}
                          onCheckedChange={f.onChange}
                          disabled={field.disabled}
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
                    data-disabled={field.disabled}
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
                          disabled={field.disabled}
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
                    disabled={field.disabled}
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
                          disabled={field.disabled}
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
                                disabled={field.disabled}
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
