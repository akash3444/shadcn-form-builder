"use client"

import { Controller, type Control } from "react-hook-form"
import { FieldError } from "@/components/ui/field"
import type { FormField } from "@/lib/form-builder/types"
import { FieldControl } from "./field-control"

// The preview form's value shape is dynamic (one key per field), so the control
// is typed loosely; the shared renderer casts field values as needed.
type PreviewControl = Control<Record<string, unknown>>

interface PreviewFieldProps {
  field: FormField
  control: PreviewControl
  error?: string
}

/**
 * React Hook Form preview adapter. Wraps each field in a `<Controller>` and maps
 * its render-prop into the normalized {@link FieldControl} binding — RHF's
 * `field.onChange` accepts raw values, so the shared renderer's value-first
 * `onChange` flows straight through. All control markup lives in FieldControl.
 */
export function PreviewField({ field, control, error }: PreviewFieldProps) {
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: f, fieldState }) => (
        <FieldControl
          field={field}
          binding={{
            value: f.value,
            onChange: f.onChange,
            onBlur: f.onBlur,
            invalid: fieldState.invalid,
            name: f.name,
            ref: f.ref,
            errorNode: <FieldError>{error}</FieldError>,
          }}
        />
      )}
    />
  )
}
