"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { FieldError } from "@/components/ui/field"
import type { FormField } from "@/lib/form-builder/types"
import { FieldControl } from "./field-control"

interface TanstackPreviewFieldProps {
  field: FormField
  /** The TanStack field API from the surrounding `<form.Field>` render prop. */
  api: AnyFieldApi
}

/**
 * TanStack Form preview adapter. Maps the field API into the normalized
 * {@link FieldControl} binding. Errors stay gated behind `isTouched && !isValid`
 * so they only surface once a field is blurred or the form is submitted — all
 * control markup lives in FieldControl, shared with the RHF adapter.
 */
export function TanstackPreviewField({ field, api }: TanstackPreviewFieldProps) {
  const isInvalid = api.state.meta.isTouched && !api.state.meta.isValid
  const errors = api.state.meta.errors as Array<{ message?: string } | undefined>

  return (
    <FieldControl
      field={field}
      binding={{
        value: api.state.value,
        onChange: api.handleChange,
        onBlur: api.handleBlur,
        invalid: isInvalid,
        name: field.name,
        errorNode: isInvalid ? <FieldError errors={errors} /> : null,
      }}
    />
  )
}
