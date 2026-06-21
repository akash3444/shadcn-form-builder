"use client"

import type { ReactNode, Ref } from "react"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import type { FormField, DateField } from "@/lib/form-builder/types"
import {
  comboboxItems,
  ComboboxOptions,
  SelectOptions,
} from "./preview-option-renderers"
import { isGrouped, partitionByGroup } from "@/lib/form-builder/utils"
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

/**
 * The single binding contract the live preview renders against. React Hook Form
 * and TanStack Form expose the same four things in different shapes; each
 * preview adapter normalizes its library into this interface so the control
 * markup below is written exactly once. `onChange` always takes the next raw
 * value (RHF's `field.onChange` accepts raw values too), so neither library's
 * event/value quirks leak into the renderer.
 */
export interface FieldBinding {
  value: unknown
  /** Commit the next value. RHF: `field.onChange`. TanStack: `field.handleChange`. */
  onChange: (value: unknown) => void
  onBlur: () => void
  /** Whether the field should render in its invalid state. */
  invalid: boolean
  /** The field's form name, used for the control's `id`/`name`/`htmlFor`. */
  name: string
  /** The error element to place in this field's error slot (library-specific). */
  errorNode: ReactNode
  /** RHF wires the control ref for focus management; TanStack leaves it unset. */
  ref?: Ref<HTMLInputElement>
}

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

/** The standard label + description + error frame shared by most field types. */
function FieldWrapper({
  field,
  binding,
  children,
}: {
  field: FormField
  binding: FieldBinding
  children: ReactNode
}) {
  return (
    <Field data-invalid={binding.invalid}>
      <FieldLabel htmlFor={field.name}>
        {field.label}
        {field.required && <span className="text-destructive">*</span>}
      </FieldLabel>
      {field.description && field.descriptionPosition === "above-control" && (
        <FieldDescription>{field.description}</FieldDescription>
      )}
      {children}
      {field.description && field.descriptionPosition === "below-control" && (
        <FieldDescription>{field.description}</FieldDescription>
      )}
      {binding.errorNode}
    </Field>
  )
}

interface FieldControlProps {
  field: FormField
  binding: FieldBinding
}

/**
 * Renders a single configured field's control against a normalized
 * {@link FieldBinding}. Shared by both preview adapters (RHF and TanStack) so
 * the live preview can no longer drift between form libraries — the same
 * guarantee the code generator gets from validation-spec.ts. The adapter owns
 * the per-library wiring (Controller / form.Field); this is binding-in, JSX-out.
 */
export function FieldControl({ field, binding }: FieldControlProps) {
  const { value, onChange, onBlur, invalid, name, errorNode, ref } = binding

  switch (field.type) {
    case "input":
      return (
        <FieldWrapper field={field} binding={binding}>
          <Input
            id={field.name}
            name={name}
            type={field.inputType}
            placeholder={field.placeholder}
            aria-invalid={invalid}
            value={(value as string | number | undefined) ?? ""}
            onChange={(e) =>
              onChange(
                field.inputType === "number"
                  ? e.target.value === ""
                    ? undefined
                    : e.target.valueAsNumber
                  : e.target.value
              )
            }
            onBlur={onBlur}
            ref={ref}
          />
        </FieldWrapper>
      )

    case "password":
      return (
        <FieldWrapper field={field} binding={binding}>
          <PasswordInput
            id={field.name}
            name={name}
            showToggle={field.showToggle}
            placeholder={field.placeholder}
            aria-invalid={invalid}
            value={(value as string | undefined) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            ref={ref}
          />
        </FieldWrapper>
      )

    case "textarea":
      return (
        <FieldWrapper field={field} binding={binding}>
          <Textarea
            id={field.name}
            name={name}
            placeholder={field.placeholder}
            rows={field.rows}
            aria-invalid={invalid}
            className="resize-none"
            value={(value as string | undefined) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            ref={ref as Ref<HTMLTextAreaElement>}
          />
        </FieldWrapper>
      )

    case "checkbox":
      return (
        <Field orientation="horizontal" data-invalid={invalid}>
          <Checkbox
            id={field.name}
            name={name}
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(checked === true)}
            onBlur={onBlur}
            aria-invalid={invalid}
          />
          <FieldContent>
            <FieldLabel htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </FieldLabel>
            {field.description && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
            {errorNode}
          </FieldContent>
        </Field>
      )

    case "switch":
      return (
        <Field orientation="horizontal" data-invalid={invalid}>
          <FieldContent>
            <FieldLabel htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </FieldLabel>
            {field.description && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
            {errorNode}
          </FieldContent>
          <Switch
            id={field.name}
            name={name}
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(checked)}
            onBlur={onBlur}
          />
        </Field>
      )

    case "select": {
      const selectGroups = isGrouped(field) ? partitionByGroup(field) : null
      return (
        <FieldWrapper field={field} binding={binding}>
          <Select
            value={String(value ?? "")}
            onValueChange={onChange}
            items={selectGroups ?? field.options}
          >
            <SelectTrigger id={field.name} aria-invalid={invalid} className="w-full">
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              <SelectOptions groups={selectGroups} options={field.options} />
            </SelectContent>
          </Select>
        </FieldWrapper>
      )
    }

    case "radio-group":
      return (
        <FieldSet>
          <FieldLegend variant="label">
            {field.label}
            {field.required && <span className="ms-1 text-destructive">*</span>}
          </FieldLegend>
          {field.description &&
            field.descriptionPosition === "above-control" && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
          <RadioGroup
            value={String(value ?? "")}
            onValueChange={onChange}
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
          {errorNode}
        </FieldSet>
      )

    case "checkbox-group": {
      const current = (value as string[]) ?? []
      return (
        <FieldSet>
          <FieldLegend variant="label">
            {field.label}
            {field.required && <span className="ms-1 text-destructive">*</span>}
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
            {field.options.map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <Checkbox
                  id={`${field.name}-${opt.value}`}
                  checked={current.includes(opt.value)}
                  onCheckedChange={(checked) =>
                    onChange(
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
            ))}
          </div>
          {field.description &&
            field.descriptionPosition === "below-control" && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
          {errorNode}
        </FieldSet>
      )
    }

    case "slider":
      return (
        <Field data-invalid={invalid}>
          <div className="flex items-center justify-between">
            <FieldLabel>{field.label}</FieldLabel>
            <span className="text-sm font-medium tabular-nums">
              {value as number}
            </span>
          </div>
          {field.description &&
            field.descriptionPosition === "above-control" && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
          <Slider
            value={(value as number) ?? field.min}
            onValueChange={onChange}
            min={field.min}
            max={field.max}
            step={field.step}
          />
          {field.description &&
            field.descriptionPosition === "below-control" && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
          {errorNode}
        </Field>
      )

    case "combobox": {
      const opts = field.options
      const labelFor = (v: string) => opts.find((o) => o.value === v)?.label ?? v
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

      let control: ReactNode
      if (field.multiple) {
        const arr = Array.isArray(value) ? (value as string[]) : []
        if (field.displayStyle === "input") {
          control = (
            <Combobox
              multiple
              items={comboItems}
              itemToStringLabel={labelFor}
              value={arr}
              onValueChange={onChange}
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
                {comboList}
              </ComboboxContent>
            </Combobox>
          )
        } else {
          control = (
            <Combobox
              multiple
              items={comboItems}
              itemToStringLabel={labelFor}
              value={arr}
              onValueChange={onChange}
            >
              <ComboboxTrigger
                id={field.name}
                aria-invalid={invalid}
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
                {comboList}
              </ComboboxContent>
            </Combobox>
          )
        }
      } else {
        const single = typeof value === "string" ? value : ""
        if (field.displayStyle === "trigger") {
          control = (
            <Combobox
              items={comboItems}
              itemToStringLabel={labelFor}
              value={single || null}
              onValueChange={(v) => onChange(v ?? "")}
            >
              <ComboboxTrigger
                id={field.name}
                aria-invalid={invalid}
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
                {comboList}
              </ComboboxContent>
            </Combobox>
          )
        } else {
          control = (
            <Combobox
              items={comboItems}
              itemToStringLabel={labelFor}
              value={single || null}
              onValueChange={(v) => onChange(v ?? "")}
            >
              <ComboboxInput
                id={field.name}
                placeholder={placeholder}
                showClear={field.clearable}
                aria-invalid={invalid}
              />
              <ComboboxContent>
                <ComboboxEmpty>{emptyText}</ComboboxEmpty>
                {comboList}
              </ComboboxContent>
            </Combobox>
          )
        }
      }

      return (
        <FieldWrapper field={field} binding={binding}>
          {control}
        </FieldWrapper>
      )
    }

    case "date": {
      const disabled = dateDisabledMatchers(field)
      const placeholder = field.placeholder || "Pick a date"
      let control: ReactNode
      if (field.mode === "range") {
        const range = asRangeValue(value)
        control = (
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  id={field.name}
                  variant="outline"
                  aria-invalid={invalid}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !range?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon />
                  {range?.from
                    ? range.to
                      ? `${format(range.from, "LLL dd, y")} – ${format(range.to, "LLL dd, y")}`
                      : format(range.from, "LLL dd, y")
                    : placeholder}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                captionLayout={field.captionLayout}
                selected={range}
                onSelect={(next) => onChange(next)}
                disabled={disabled}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        )
      } else {
        const date = asDateValue(value)
        control = (
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  id={field.name}
                  variant="outline"
                  aria-invalid={invalid}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon />
                  {date ? format(date, "PPP") : placeholder}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                captionLayout={field.captionLayout}
                selected={date}
                onSelect={(next) => onChange(next)}
                disabled={disabled}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        )
      }

      return (
        <FieldWrapper field={field} binding={binding}>
          {control}
        </FieldWrapper>
      )
    }
  }
}
