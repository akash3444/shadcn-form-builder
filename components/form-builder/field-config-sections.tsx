"use client"

import {
  PlusIcon,
  Trash2Icon,
  XIcon,
  AlertCircleIcon,
} from "lucide-react"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox"
import type {
  FormField,
  FieldOption,
  ComboboxDisplayStyle,
  NumberValidation,
  StringValidation,
} from "@/lib/form-builder/types"
import { cn } from "@/lib/utils"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import { coerceComboboxDefault, isOptionField } from "@/lib/form-builder/utils"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ---------------------------------------------------------------------------
// Shared layout helpers
// ---------------------------------------------------------------------------

interface LabeledRowProps {
  label: string
  htmlFor?: string
  children: React.ReactNode
}

export function LabeledRow({ label, htmlFor, children }: LabeledRowProps) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-center gap-2">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  )
}

export function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} size="sm" />
    </div>
  )
}

function MultiSelectCombobox({
  options,
  value,
  onChange,
}: {
  options: FieldOption[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const items = options.map((o) => o.value)

  const displayText =
    value.length === 0
      ? "No default"
      : value.length === 1
        ? (options.find((o) => o.value === value[0])?.label ?? value[0])
        : `${value.length} selected`

  return (
    <Combobox
      multiple
      items={items}
      value={value as never}
      onValueChange={onChange as never}
      disabled={options.length === 0}
    >
      <ComboboxTrigger className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-[13px] data-disabled:cursor-not-allowed data-disabled:opacity-50">
        <span className="truncate">{displayText}</span>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput showTrigger={false} placeholder="Search options..." />
        <ComboboxEmpty>No options found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => {
            const option = options.find((o) => o.value === item)
            return (
              <ComboboxItem key={item} value={item}>
                {option?.label ?? item}
              </ComboboxItem>
            )
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

// ---------------------------------------------------------------------------
// Default value
// ---------------------------------------------------------------------------

export function DefaultValueSection({ field }: { field: FormField }) {
  const updateField = useFormBuilderStore((s) => s.updateField)

  // Excluded for password fields.
  if (field.type === "password") return null

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Default Value
        </p>
        {field.defaultValue !== undefined && (
          <button
            type="button"
            onClick={() => updateField(field.id, { defaultValue: undefined })}
            className="text-muted-foreground transition-colors hover:text-destructive"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>

      {/* Text-like inputs */}
      {(field.type === "textarea" ||
        (field.type === "input" &&
          ["text", "email", "url", "tel"].includes(field.inputType))) && (
        <Input
          value={(field.defaultValue as string | undefined) ?? ""}
          onChange={(e) =>
            updateField(field.id, {
              defaultValue: e.target.value === "" ? undefined : e.target.value,
            })
          }
          placeholder="Enter default value"
          type={
            field.type === "input" &&
            ["email", "url", "tel"].includes(field.inputType)
              ? field.inputType
              : "text"
          }
          className="h-7 text-xs"
        />
      )}

      {/* Number input */}
      {field.type === "input" && field.inputType === "number" && (
        <Input
          type="number"
          value={(field.defaultValue as number | undefined) ?? ""}
          onChange={(e) => {
            const raw = Number(e.target.value)
            updateField(field.id, {
              defaultValue:
                e.target.value === "" || isNaN(raw) ? undefined : raw,
            })
          }}
          placeholder="Enter default value"
          className="h-7 text-xs"
        />
      )}

      {/* Boolean toggle */}
      {(field.type === "checkbox" || field.type === "switch") && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {field.defaultValue === true ? "true" : "false"}
          </span>
          <Switch
            checked={field.defaultValue === true}
            onCheckedChange={(v) =>
              updateField(field.id, { defaultValue: v ? true : undefined })
            }
            size="sm"
          />
        </div>
      )}

      {/* Select / RadioGroup / single Combobox: single option picker */}
      {(field.type === "select" ||
        field.type === "radio-group" ||
        (field.type === "combobox" && !field.multiple)) && (
        <Select
          value={(field.defaultValue as string | undefined) ?? ""}
          onValueChange={(v) =>
            updateField(field.id, {
              defaultValue: !v || v === "" ? undefined : v,
            })
          }
          disabled={field.options.length === 0}
        >
          <SelectTrigger className="h-7 w-full text-xs">
            <SelectValue placeholder="No default" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">— No default —</SelectItem>
            {field.options.map((opt) => (
              <SelectItem key={opt.id} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* CheckboxGroup / multiple Combobox: multi-select */}
      {(field.type === "checkbox-group" ||
        (field.type === "combobox" && field.multiple)) && (
        <MultiSelectCombobox
          options={field.options}
          value={(field.defaultValue as string[] | undefined) ?? []}
          onChange={(v) =>
            updateField(field.id, {
              defaultValue: v.length === 0 ? undefined : v,
            })
          }
        />
      )}

      {/* Slider: number input */}
      {field.type === "slider" &&
        (() => {
          const dv = (field.defaultValue as number | undefined) ?? 50
          const outOfRange = dv < field.min || dv > field.max
          const offStep =
            !outOfRange &&
            Math.abs((dv - field.min) % field.step) > 1e-9 &&
            Math.abs(((dv - field.min) % field.step) - field.step) > 1e-9
          const warning = outOfRange
            ? `Value ${dv} is outside range [${field.min}, ${field.max}]`
            : offStep
              ? `Value ${dv} is not a multiple of step ${field.step} from min ${field.min}`
              : null
          return (
            <>
              <Input
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={dv}
                onChange={(e) => {
                  const raw = Number(e.target.value)
                  updateField(field.id, {
                    defaultValue: isNaN(raw) ? undefined : raw,
                  })
                }}
                className="h-7 text-xs"
              />
              {warning && (
                <p className="flex items-start gap-1.5 text-xs text-warning">
                  <AlertCircleIcon className="mt-0.5 size-3 shrink-0 fill-warning/10" />
                  {warning}
                </p>
              )}
            </>
          )
        })()}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Combobox behavior + text
// ---------------------------------------------------------------------------

export function ComboboxSettingsSection({ field }: { field: FormField }) {
  const updateField = useFormBuilderStore((s) => s.updateField)
  if (field.type !== "combobox") return null

  return (
    <div className="space-y-2.5">
      <SwitchRow
        label="Multiple"
        checked={field.multiple}
        onChange={(v) => {
          // Toggling mode flips the value shape (string <-> string[]).
          // Coerce the configured default so it never holds the wrong shape.
          updateField(field.id, {
            multiple: v,
            defaultValue: coerceComboboxDefault(field.defaultValue, v),
          })
        }}
      />

      <LabeledRow label="Style">
        <Tabs
          value={field.displayStyle}
          onValueChange={(v) =>
            updateField(field.id, { displayStyle: v as ComboboxDisplayStyle })
          }
        >
          <TabsList className="h-7 w-full">
            <TabsTrigger value="input" className="text-[13px]">
              Input
            </TabsTrigger>
            <TabsTrigger value="trigger" className="text-[13px]">
              Trigger
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </LabeledRow>

      <SwitchRow
        label="Clearable"
        checked={field.clearable}
        onChange={(v) => updateField(field.id, { clearable: v })}
      />

      {field.displayStyle === "trigger" && (
        <LabeledRow label="Search text" htmlFor={`search-${field.id}`}>
          <Input
            id={`search-${field.id}`}
            value={field.searchPlaceholder}
            onChange={(e) =>
              updateField(field.id, { searchPlaceholder: e.target.value })
            }
            placeholder="Search..."
          />
        </LabeledRow>
      )}

      <LabeledRow label="Empty text" htmlFor={`empty-${field.id}`}>
        <Input
          id={`empty-${field.id}`}
          value={field.emptyText}
          onChange={(e) =>
            updateField(field.id, { emptyText: e.target.value })
          }
          placeholder="No results found."
        />
      </LabeledRow>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Slider range
// ---------------------------------------------------------------------------

export function SliderRangeSection({ field }: { field: FormField }) {
  const updateField = useFormBuilderStore((s) => s.updateField)
  if (field.type !== "slider") return null

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Range
      </p>
      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <label
            htmlFor={`min-${field.id}`}
            className="text-[11px] text-muted-foreground"
          >
            Min
          </label>
          <Input
            id={`min-${field.id}`}
            type="number"
            value={field.min}
            onChange={(e) => {
              const v = Number(e.target.value)
              updateField(field.id, { min: isNaN(v) ? 0 : v })
            }}
            className="h-7 text-xs"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label
            htmlFor={`max-${field.id}`}
            className="text-[11px] text-muted-foreground"
          >
            Max
          </label>
          <Input
            id={`max-${field.id}`}
            type="number"
            value={field.max}
            onChange={(e) => {
              const v = Number(e.target.value)
              updateField(field.id, { max: isNaN(v) ? 100 : v })
            }}
            className="h-7 text-xs"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label
            htmlFor={`step-${field.id}`}
            className="text-[11px] text-muted-foreground"
          >
            Step
          </label>
          <Input
            id={`step-${field.id}`}
            type="number"
            value={field.step}
            min={0.001}
            onChange={(e) => {
              const v = Number(e.target.value)
              updateField(field.id, { step: isNaN(v) || v <= 0 ? 1 : v })
            }}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Validation (number value / string length min+max)
// ---------------------------------------------------------------------------

export function ValidationSection({ field }: { field: FormField }) {
  const updateField = useFormBuilderStore((s) => s.updateField)

  if (field.type === "slider") return null

  const showNumberValidation =
    field.type === "input" && field.inputType === "number"
  const showStringValidation =
    field.type === "textarea" ||
    field.type === "password" ||
    (field.type === "input" && ["text", "tel"].includes(field.inputType))

  const numVal: NumberValidation =
    field.type === "input" && field.inputType === "number"
      ? ((field.validation ?? {}) as NumberValidation)
      : {}
  const strVal: StringValidation =
    field.type === "input" ||
    field.type === "textarea" ||
    field.type === "password"
      ? ((field.validation ?? {}) as StringValidation)
      : {}

  const numError =
    numVal.min !== undefined && numVal.max !== undefined && numVal.min > numVal.max
      ? "Min must be ≤ max"
      : ""
  const strError =
    strVal.minLength !== undefined &&
    strVal.maxLength !== undefined &&
    strVal.minLength > strVal.maxLength
      ? "Min must be ≤ max"
      : ""

  function patchNumVal(patch: Partial<NumberValidation>) {
    updateField(field.id, {
      validation: { ...numVal, ...patch },
    } as Partial<FormField>)
  }
  function patchStrVal(patch: Partial<StringValidation>) {
    updateField(field.id, {
      validation: { ...strVal, ...patch },
    } as Partial<FormField>)
  }

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Validation
      </p>

      <SwitchRow
        label="Required"
        checked={field.required}
        onChange={(v) => updateField(field.id, { required: v })}
      />

      {(showNumberValidation || showStringValidation) && (
        <div className="space-y-1">
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <label
                htmlFor={`val-min-${field.id}`}
                className="text-[11px] text-muted-foreground"
              >
                Min {showNumberValidation ? "value" : "length"}
              </label>
              <Input
                id={`val-min-${field.id}`}
                type="number"
                min={showNumberValidation ? undefined : 1}
                value={
                  showNumberValidation
                    ? (numVal.min ?? "")
                    : (strVal.minLength ?? "")
                }
                placeholder="–"
                onChange={(e) => {
                  const raw = Number(e.target.value)
                  const v =
                    e.target.value === "" || isNaN(raw) ? undefined : raw
                  if (showNumberValidation) patchNumVal({ min: v })
                  else patchStrVal({ minLength: v })
                }}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label
                htmlFor={`val-max-${field.id}`}
                className="text-[11px] text-muted-foreground"
              >
                Max {showNumberValidation ? "value" : "length"}
              </label>
              <Input
                id={`val-max-${field.id}`}
                type="number"
                min={showNumberValidation ? undefined : 1}
                value={
                  showNumberValidation
                    ? (numVal.max ?? "")
                    : (strVal.maxLength ?? "")
                }
                placeholder="–"
                onChange={(e) => {
                  const raw = Number(e.target.value)
                  const v =
                    e.target.value === "" || isNaN(raw) ? undefined : raw
                  if (showNumberValidation) patchNumVal({ max: v })
                  else patchStrVal({ maxLength: v })
                }}
                className="h-7 text-xs"
              />
            </div>
          </div>
          {(numError || strError) && (
            <p className="text-xs text-destructive">{numError || strError}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Options editor
// ---------------------------------------------------------------------------

export function OptionsSection({ field }: { field: FormField }) {
  const addOption = useFormBuilderStore((s) => s.addOption)
  const updateOption = useFormBuilderStore((s) => s.updateOption)
  const removeOption = useFormBuilderStore((s) => s.removeOption)
  if (!isOptionField(field)) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Options
      </p>
      <div className="space-y-1.5">
        {field.options.map((option) => (
          <div key={option.id} className="flex items-center gap-1.5">
            <Input
              value={option.label}
              onChange={(e) =>
                updateOption(field.id, option.id, {
                  label: e.target.value,
                  value: e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, ""),
                })
              }
              placeholder="Option label"
              className="h-7 text-xs"
            />
            <Input
              value={option.value}
              onChange={(e) =>
                updateOption(field.id, option.id, { value: e.target.value })
              }
              placeholder="value"
              className="h-7 w-24 shrink-0 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => removeOption(field.id, option.id)}
              disabled={field.options.length <= 1}
              className="shrink-0 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-30"
            >
              <Trash2Icon className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-full text-xs"
        onClick={() => addOption(field.id)}
      >
        <PlusIcon className="mr-1 size-3.5" />
        Add option
      </Button>
    </div>
  )
}
