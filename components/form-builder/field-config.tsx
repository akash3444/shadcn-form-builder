"use client"

import { useEffect, useRef, useState } from "react"
import {
  PlusIcon,
  Trash2Icon,
  ChevronDownIcon,
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
  InputType,
  GroupOrientation,
  DescriptionPosition,
  ComboboxDisplayStyle,
  NumberValidation,
  StringValidation,
} from "@/lib/form-builder/types"
import { cn } from "@/lib/utils"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import { labelToKey, coerceComboboxDefault } from "@/lib/form-builder/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const ORIENTATION_OPTIONS = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
]

interface LabeledRowProps {
  label: string
  htmlFor?: string
  children: React.ReactNode
}

function LabeledRow({ label, htmlFor, children }: LabeledRowProps) {
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

function SwitchRow({
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
  options: import("@/lib/form-builder/types").FieldOption[]
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

interface FieldConfigProps {
  field: FormField
}

export function FieldConfig({ field }: FieldConfigProps) {
  const { updateField, addOption, updateOption, removeOption } =
    useFormBuilderStore()

  const labelInputRef = useRef<HTMLInputElement>(null)
  const nameManuallyEdited = useRef(false)
  const [validationOpen, setValidationOpen] = useState(false)

  useEffect(() => {
    nameManuallyEdited.current = false
    setValidationOpen(false)
    labelInputRef.current?.focus()
  }, [field.id])

  const showNumberValidation =
    field.type === "input" && field.inputType === "number"
  const showStringValidation =
    field.type === "textarea" ||
    (field.type === "input" &&
      ["text", "password", "tel"].includes(field.inputType))
  const hasValidation = showNumberValidation || showStringValidation

  const numVal: NumberValidation =
    field.type === "input" && field.inputType === "number"
      ? ((field.validation ?? {}) as NumberValidation)
      : {}

  const strVal: StringValidation =
    field.type === "input" || field.type === "textarea"
      ? ((field.validation ?? {}) as StringValidation)
      : {}

  const numError =
    numVal.min !== undefined &&
    numVal.max !== undefined &&
    numVal.min > numVal.max
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

  function handleLabelChange(label: string) {
    const updates: Partial<FormField> = { label }
    if (!nameManuallyEdited.current) {
      updates.name = labelToKey(label)
    }
    updateField(field.id, updates)
  }

  function handleNameChange(name: string) {
    nameManuallyEdited.current = true
    updateField(field.id, { name })
  }

  return (
    <div className="divide-y *:p-4">
      <div className="space-y-2.5">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Field Settings
        </p>

        <LabeledRow label="Label" htmlFor={`label-${field.id}`}>
          <Input
            ref={labelInputRef}
            id={`label-${field.id}`}
            value={field.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="Field label"
          />
        </LabeledRow>

        <LabeledRow label="Field name" htmlFor={`name-${field.id}`}>
          <Input
            id={`name-${field.id}`}
            value={field.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="fieldName"
            className="font-mono text-xs"
            disabled
          />
        </LabeledRow>

        {field.type !== "checkbox" &&
          field.type !== "switch" &&
          field.type !== "checkbox-group" &&
          field.type !== "slider" && (
            <LabeledRow label="Placeholder" htmlFor={`placeholder-${field.id}`}>
              <Input
                id={`placeholder-${field.id}`}
                value={field.placeholder}
                onChange={(e) =>
                  updateField(field.id, { placeholder: e.target.value })
                }
                placeholder="Placeholder text"
              />
            </LabeledRow>
          )}

        {field.type === "input" && (
          <LabeledRow label="Input type">
            <Select
              value={field.inputType}
              onValueChange={(v) =>
                updateField(field.id, {
                  inputType: v as InputType,
                  validation: undefined,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  [
                    "text",
                    "number",
                    "email",
                    "password",
                    "url",
                    "tel",
                  ] as InputType[]
                ).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </LabeledRow>
        )}
      </div>

      <div className="space-y-2.5">
        <LabeledRow label="Description" htmlFor={`description-${field.id}`}>
          <Textarea
            id={`description-${field.id}`}
            value={field.description}
            onChange={(e) =>
              updateField(field.id, { description: e.target.value })
            }
            placeholder="Helper text shown below the field"
            rows={2}
            className="resize-none"
          />
        </LabeledRow>

        <LabeledRow label="Position">
          <Tabs
            value={field.descriptionPosition}
            onValueChange={(v) =>
              updateField(field.id, {
                descriptionPosition: v as DescriptionPosition,
              })
            }
          >
            <TabsList className="h-7 w-full">
              <TabsTrigger value="above-control" className="text-[13px]">
                Above control
              </TabsTrigger>
              <TabsTrigger value="below-control" className="text-[13px]">
                Below control
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </LabeledRow>
      </div>

      {/* Default value — excluded for password subtype */}
      {!(field.type === "input" && field.inputType === "password") && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Default Value
            </p>
            {field.defaultValue !== undefined && (
              <button
                onClick={() =>
                  updateField(field.id, { defaultValue: undefined })
                }
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
                  defaultValue:
                    e.target.value === "" ? undefined : e.target.value,
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
                  updateField(field.id, {
                    defaultValue: v ? true : undefined,
                  })
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
      )}

      {field.type !== "slider" && (
        <div className="space-y-2.5">
          <SwitchRow
            label="Required"
            checked={field.required}
            onChange={(v) => updateField(field.id, { required: v })}
          />
        </div>
      )}

      {/* Textarea-specific: rows */}
      {field.type === "textarea" && (
        <LabeledRow label="Rows" htmlFor={`rows-${field.id}`}>
          <Input
            id={`rows-${field.id}`}
            type="number"
            min={1}
            max={20}
            value={field.rows}
            onChange={(e) =>
              updateField(field.id, {
                rows: Math.max(1, parseInt(e.target.value) || 1),
              })
            }
          />
        </LabeledRow>
      )}

      {/* RadioGroup / CheckboxGroup: orientation selector */}
      {(field.type === "radio-group" || field.type === "checkbox-group") && (
        <LabeledRow label="Orientation">
          <Select
            value={field.orientation}
            onValueChange={(v) =>
              updateField(field.id, {
                orientation: v as GroupOrientation,
              })
            }
            items={ORIENTATION_OPTIONS}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORIENTATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </LabeledRow>
      )}

      {/* Combobox: behavior + text */}
      {field.type === "combobox" && (
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
                updateField(field.id, {
                  displayStyle: v as ComboboxDisplayStyle,
                })
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
      )}

      {/* Slider: min / max / step */}
      {field.type === "slider" && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Range
          </p>
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[11px] text-muted-foreground">Min</label>
              <Input
                type="number"
                value={field.min}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  updateField(field.id, {
                    min: isNaN(v) ? 0 : v,
                  } as Partial<FormField>)
                }}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[11px] text-muted-foreground">Max</label>
              <Input
                type="number"
                value={field.max}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  updateField(field.id, {
                    max: isNaN(v) ? 100 : v,
                  } as Partial<FormField>)
                }}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[11px] text-muted-foreground">Step</label>
              <Input
                type="number"
                value={field.step}
                min={0.001}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  updateField(field.id, {
                    step: isNaN(v) || v <= 0 ? 1 : v,
                  } as Partial<FormField>)
                }}
                className="h-7 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Validation */}
      {hasValidation && (
        <div className="space-y-2.5">
          <button
            className="flex w-full items-center justify-between"
            onClick={() => setValidationOpen((v) => !v)}
          >
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Validation
            </p>
            <ChevronDownIcon
              className={cn(
                "size-3.5 text-muted-foreground transition-transform",
                validationOpen && "rotate-180"
              )}
            />
          </button>

          {validationOpen && (
            <div className="space-y-1">
              <div className="flex gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-[11px] text-muted-foreground">
                    Min {showNumberValidation ? "value" : "length"}
                  </label>
                  <Input
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
                      showNumberValidation
                        ? patchNumVal({ min: v })
                        : patchStrVal({ minLength: v })
                    }}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-[11px] text-muted-foreground">
                    Max {showNumberValidation ? "value" : "length"}
                  </label>
                  <Input
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
                      showNumberValidation
                        ? patchNumVal({ max: v })
                        : patchStrVal({ maxLength: v })
                    }}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              {(numError || strError) && (
                <p className="text-xs text-destructive">
                  {numError || strError}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Select / RadioGroup / CheckboxGroup / Combobox: options editor */}
      {(field.type === "select" ||
        field.type === "radio-group" ||
        field.type === "checkbox-group" ||
        field.type === "combobox") && (
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
                    updateOption(field.id, option.id, {
                      value: e.target.value,
                    })
                  }
                  placeholder="value"
                  className="h-7 w-24 shrink-0 font-mono text-xs"
                />
                <button
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
      )}
    </div>
  )
}
