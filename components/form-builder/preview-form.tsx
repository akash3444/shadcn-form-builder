"use client"

import { useEffect } from "react"
import { EyeIcon } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import type { FormField } from "@/lib/form-builder/types"
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
        let s = z.string()
        if (field.inputType === "email") s = s.email("Invalid email address")
        if (field.inputType === "url") s = s.url("Invalid URL")
        shape[field.name] = field.required
          ? s.min(1, "This field is required")
          : s
        break
      }
      case "textarea":
        shape[field.name] = field.required
          ? z.string().min(1, "This field is required")
          : z.string()
        break
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
    switch (field.type) {
      case "input":
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
  error,
  htmlFor,
  children,
}: {
  label: string
  required: boolean
  description: string
  error?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel
        htmlFor={htmlFor}
        className="text-sm leading-none font-medium"
      >
        {label}
        {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      {children}
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError>{error}</FieldError>}
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
  useEffect(() => {
    form.reset(buildDefaultValues(fields) as FormValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(fields.map((f) => f.name))])

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
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
      >
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
                        disabled={field.disabled}
                        aria-invalid={fieldState.invalid}
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

            case "textarea":
              return (
                <FieldWrapper
                  key={field.id}
                  label={field.label}
                  required={field.required}
                  description={field.description}
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
                <Field key={field.id} data-invalid={!!error}>
                  <div className="flex items-start gap-3">
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
                    <div className="flex flex-col gap-1">
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-sm leading-none font-medium"
                      >
                        {field.label}
                        {field.required && (
                          <span className="text-destructive">*</span>
                        )}
                      </FieldLabel>
                      {field.description && (
                        <FieldDescription>{field.description}</FieldDescription>
                      )}
                    </div>
                  </div>
                  {error && <FieldError>{error}</FieldError>}
                </Field>
              )

            case "switch":
              return (
                <Field key={field.id} data-invalid={!!error}>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-sm font-medium"
                      >
                        {field.label}
                        {field.required && (
                          <span className="text-destructive">*</span>
                        )}
                      </FieldLabel>
                      {field.description && (
                        <FieldDescription>{field.description}</FieldDescription>
                      )}
                    </div>
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
                  </div>
                  {error && <FieldError>{error}</FieldError>}
                </Field>
              )

            case "select":
              return (
                <FieldWrapper
                  key={field.id}
                  label={field.label}
                  required={field.required}
                  description={field.description}
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
                <FieldWrapper
                  key={field.id}
                  label={field.label}
                  required={field.required}
                  description={field.description}
                  error={error}
                >
                  <Controller
                    name={field.name}
                    control={form.control}
                    render={({ field: f }) => (
                      <RadioGroup
                        value={String(f.value ?? "")}
                        onValueChange={f.onChange}
                        disabled={field.disabled}
                      >
                        {field.options.map((opt) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <RadioGroupItem
                              value={opt.value}
                              id={`${field.name}-${opt.value}`}
                            />
                            <label
                              htmlFor={`${field.name}-${opt.value}`}
                              className="cursor-pointer text-sm font-medium"
                            >
                              {opt.label}
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  />
                </FieldWrapper>
              )

            case "checkbox-group":
              return (
                <Field key={field.id} data-invalid={!!error}>
                  <FieldLabel className="text-sm leading-none font-medium">
                    {field.label}
                    {field.required && (
                      <span className="text-destructive">*</span>
                    )}
                  </FieldLabel>
                  <Controller
                    name={field.name}
                    control={form.control}
                    render={({ field: f }) => (
                      <Field orientation={field.orientation}>
                        {field.options.map((opt) => (
                          <div key={opt.id} className="flex items-center gap-2">
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
                            <label
                              htmlFor={`${field.name}-${opt.value}`}
                              className="cursor-pointer text-sm font-medium"
                            >
                              {opt.label}
                            </label>
                          </div>
                        ))}
                      </Field>
                    )}
                  />
                  {field.description && (
                    <FieldDescription>{field.description}</FieldDescription>
                  )}
                  {error && <FieldError>{error}</FieldError>}
                </Field>
              )
          }
        })}

        <Button type="submit" className="w-full" size="lg">
          {submitLabel}
        </Button>
      </form>
    </div>
  )
}
