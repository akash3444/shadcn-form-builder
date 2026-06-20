"use client"

import { Controller, type Control } from "react-hook-form"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import type { FormField, DateField } from "@/lib/form-builder/types"
import { isGrouped, partitionByGroup } from "@/lib/form-builder/utils"
import {
  comboboxItems,
  ComboboxOptions,
  SelectOptions,
} from "./preview-option-renderers"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format, isWeekend, parseISO, startOfToday } from "date-fns"
import type { DateRange, Matcher } from "react-day-picker"
import { PasswordInput } from "@/components/ui/password-input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
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
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import { cn } from "@/lib/utils"

// The preview form's value shape is dynamic (one key per field), so the control
// is typed loosely; individual renderers cast field values as needed.
type PreviewControl = Control<Record<string, unknown>>

/**
 * A date field's stored form value can briefly hold the wrong shape — toggling
 * a field between single and range mode leaves the previous value in the live
 * form until the next edit. `format()` throws on a non-Date, so the value is
 * sanitized to the shape the current mode expects before it's rendered.
 */
function asDateValue(v: unknown): Date | undefined {
  return v instanceof Date && !isNaN(v.getTime()) ? v : undefined
}
function asRangeValue(v: unknown): DateRange | undefined {
  if (!v || typeof v !== "object" || v instanceof Date) return undefined
  const r = v as { from?: unknown; to?: unknown }
  const from = asDateValue(r.from)
  const to = asDateValue(r.to)
  return from || to ? { from, to } : undefined
}

/** Builds the react-day-picker `disabled` matchers from a date field's rules. */
function dateDisabledMatchers(field: DateField): Matcher[] {
  const m: Matcher[] = []
  if (field.minDate) m.push({ before: parseISO(field.minDate) })
  if (field.maxDate) m.push({ after: parseISO(field.maxDate) })
  if (field.disablePastDates) m.push({ before: startOfToday() })
  if (field.disableWeekends) m.push((date: Date) => isWeekend(date))
  return m
}

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

interface PreviewFieldProps {
  field: FormField
  control: PreviewControl
  error?: string
}

/** Renders a single configured field bound to the preview form's control. */
export function PreviewField({ field, control, error }: PreviewFieldProps) {
  switch (field.type) {
    case "input":
      return (
        <FieldWrapper
          label={field.label}
          required={field.required}
          description={field.description}
          descriptionPosition={field.descriptionPosition}
          error={error}
          htmlFor={field.name}
        >
          <Controller
            name={field.name}
            control={control}
            render={({ field: f, fieldState }) => (
              <Input
                id={field.name}
                type={field.inputType}
                placeholder={field.placeholder}
                aria-invalid={fieldState.invalid}
                value={(f.value as string | number | undefined) ?? ""}
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

    case "password":
      return (
        <FieldWrapper
          label={field.label}
          required={field.required}
          description={field.description}
          descriptionPosition={field.descriptionPosition}
          error={error}
          htmlFor={field.name}
        >
          <Controller
            name={field.name}
            control={control}
            render={({ field: f, fieldState }) => (
              <PasswordInput
                id={field.name}
                showToggle={field.showToggle}
                placeholder={field.placeholder}
                aria-invalid={fieldState.invalid}
                value={(f.value as string | undefined) ?? ""}
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
          label={field.label}
          required={field.required}
          description={field.description}
          descriptionPosition={field.descriptionPosition}
          error={error}
          htmlFor={field.name}
        >
          <Controller
            name={field.name}
            control={control}
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
        <Field orientation="horizontal" data-invalid={!!error}>
          <Controller
            name={field.name}
            control={control}
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
              {field.required && <span className="text-destructive">*</span>}
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
        <Field orientation="horizontal" data-invalid={!!error}>
          <FieldContent>
            <FieldLabel htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </FieldLabel>
            {field.description && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
            <FieldError>{error}</FieldError>
          </FieldContent>
          <Controller
            name={field.name}
            control={control}
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

    case "select": {
      const selectGroups = isGrouped(field) ? partitionByGroup(field) : null
      return (
        <FieldWrapper
          label={field.label}
          required={field.required}
          description={field.description}
          descriptionPosition={field.descriptionPosition}
          error={error}
          htmlFor={field.name}
        >
          <Controller
            name={field.name}
            control={control}
            render={({ field: f, fieldState }) => (
              <Select
                value={String(f.value ?? "")}
                onValueChange={f.onChange}
                items={selectGroups ?? field.options}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  className="w-full"
                >
                  <SelectValue
                    placeholder={field.placeholder || "Select an option"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectOptions
                    groups={selectGroups}
                    options={field.options}
                  />
                </SelectContent>
              </Select>
            )}
          />
        </FieldWrapper>
      )
    }

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
          <Controller
            name={field.name}
            control={control}
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
          <Controller
            name={field.name}
            control={control}
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
                    />
                    <FieldLabel htmlFor={`${field.name}-${opt.value}`}>
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
        <Field data-invalid={!!error}>
          <Controller
            name={field.name}
            control={control}
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
                    <FieldDescription>{field.description}</FieldDescription>
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
                    <FieldDescription>{field.description}</FieldDescription>
                  )}
              </>
            )}
          />
          <FieldError>{error}</FieldError>
        </Field>
      )

    case "combobox": {
      const opts = field.options
      const labelFor = (v: string) =>
        opts.find((o) => o.value === v)?.label ?? v
      const placeholder =
        field.placeholder ||
        (field.multiple ? "Select options" : "Select an option")
      const emptyText = field.emptyText || "No results found."
      const searchPlaceholder = field.searchPlaceholder || "Search..."
      const triggerClass =
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"

      // Shared across every display variant below.
      const comboItems = comboboxItems(field)
      const comboList = <ComboboxOptions field={field} labelFor={labelFor} />

      return (
        <FieldWrapper
          label={field.label}
          required={field.required}
          description={field.description}
          descriptionPosition={field.descriptionPosition}
          error={error}
          htmlFor={field.name}
        >
          <Controller
            name={field.name}
            control={control}
            render={({ field: f, fieldState }) => {
              if (field.multiple) {
                const arr = Array.isArray(f.value) ? (f.value as string[]) : []
                if (field.displayStyle === "input") {
                  return (
                    <Combobox
                      multiple
                      items={comboItems}
                      itemToStringLabel={labelFor}
                      value={arr}
                      onValueChange={f.onChange}
                    >
                      <ComboboxChips>
                        <ComboboxValue>
                          {(value: string[] | null) =>
                            (value ?? []).map((v) => (
                              <ComboboxChip key={v}>{labelFor(v)}</ComboboxChip>
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
                        {comboList}
                      </ComboboxContent>
                    </Combobox>
                  )
                }
                return (
                  <Combobox
                    multiple
                    items={comboItems}
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
                      {comboList}
                    </ComboboxContent>
                  </Combobox>
                )
              }

              const single = typeof f.value === "string" ? f.value : ""
              if (field.displayStyle === "trigger") {
                return (
                  <Combobox
                    items={comboItems}
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
                      {comboList}
                    </ComboboxContent>
                  </Combobox>
                )
              }

              return (
                <Combobox
                  items={comboItems}
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
                    {comboList}
                  </ComboboxContent>
                </Combobox>
              )
            }}
          />
        </FieldWrapper>
      )
    }

    case "date": {
      const disabled = dateDisabledMatchers(field)
      const placeholder = field.placeholder || "Pick a date"
      return (
        <FieldWrapper
          label={field.label}
          required={field.required}
          description={field.description}
          descriptionPosition={field.descriptionPosition}
          error={error}
          htmlFor={field.name}
        >
          <Controller
            name={field.name}
            control={control}
            render={({ field: f, fieldState }) => {
              if (field.mode === "range") {
                const value = asRangeValue(f.value)
                return (
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          id={field.name}
                          variant="outline"
                          aria-invalid={fieldState.invalid}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !value?.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon />
                          {value?.from
                            ? value.to
                              ? `${format(value.from, "LLL dd, y")} – ${format(value.to, "LLL dd, y")}`
                              : format(value.from, "LLL dd, y")
                            : placeholder}
                        </Button>
                      }
                    />
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        captionLayout={field.captionLayout}
                        selected={value}
                        onSelect={(range) => f.onChange(range)}
                        disabled={disabled}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                )
              }
              const value = asDateValue(f.value)
              return (
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        id={field.name}
                        variant="outline"
                        aria-invalid={fieldState.invalid}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon />
                        {value ? format(value, "PPP") : placeholder}
                      </Button>
                    }
                  />
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      captionLayout={field.captionLayout}
                      selected={value}
                      onSelect={(date) => f.onChange(date)}
                      disabled={disabled}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              )
            }}
          />
        </FieldWrapper>
      )
    }
  }
}
