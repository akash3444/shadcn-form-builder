"use client"

import { useMemo } from "react"
import { EyeIcon } from "lucide-react"
import { useForm, type Control } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { FieldGroup } from "@/components/ui/field"
import type { FormField } from "@/lib/form-builder/types"
import { buildSchema, buildDefaultValues } from "@/lib/form-builder/schema"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { PreviewField } from "./preview-fields"

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

  // The form's identity depends on each field's name, configured default, and
  // (for combobox) the value SHAPE implied by `multiple`. When any of those
  // change, remounting the form via `key` re-initializes react-hook-form with
  // fresh defaults — simpler and safer than resetting all state in an effect.
  const fieldResetKey = JSON.stringify(
    fields.map((f) => ({
      name: f.name,
      defaultValue: f.defaultValue,
      multiple: f.type === "combobox" ? f.multiple : undefined,
    }))
  )

  return (
    <PreviewFormFields
      key={fieldResetKey}
      formName={formName}
      submitLabel={submitLabel}
      fields={fields}
    />
  )
}

function PreviewFormFields({
  formName,
  submitLabel,
  fields,
}: PreviewFormProps) {
  const schema = useMemo(() => buildSchema(fields), [fields])
  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(fields) as FormValues,
  })

  function onSubmit(values: FormValues) {
    toast.message("Form submitted", {
      description: (
        <pre className="mt-1 max-h-48 overflow-auto rounded bg-background/5 text-xs">
          {JSON.stringify(values, null, 2)}
        </pre>
      ),
    })
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

            return (
              <PreviewField
                key={field.id}
                field={field}
                control={
                  form.control as unknown as Control<Record<string, unknown>>
                }
                error={error}
              />
            )
          })}
        </FieldGroup>
        <Button type="submit" className="w-full" size="lg">
          {submitLabel}
        </Button>
      </form>
    </div>
  )
}
