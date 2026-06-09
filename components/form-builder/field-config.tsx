"use client"

import { useEffect, useRef } from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"
import type {
  FormField,
  InputType,
  CheckboxGroupOrientation,
  DescriptionPosition,
} from "@/lib/form-builder/types"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import { labelToKey } from "@/lib/form-builder/utils"
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
  { value: "responsive", label: "Responsive" },
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

interface FieldConfigProps {
  field: FormField
}

export function FieldConfig({ field }: FieldConfigProps) {
  const { updateField, addOption, updateOption, removeOption } =
    useFormBuilderStore()

  const labelInputRef = useRef<HTMLInputElement>(null)
  const nameManuallyEdited = useRef(false)

  useEffect(() => {
    nameManuallyEdited.current = false
    labelInputRef.current?.focus()
  }, [field.id])

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
    <div className="space-y-3 p-4">
      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Field Settings
      </p>

      <div className="space-y-2.5">
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
          field.type !== "checkbox-group" && (
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
      </div>

      <Separator />

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

      <Separator />

      <div className="space-y-2.5">
        <SwitchRow
          label="Required"
          checked={field.required}
          onChange={(v) => updateField(field.id, { required: v })}
        />
        <SwitchRow
          label="Disabled"
          checked={field.disabled}
          onChange={(v) => updateField(field.id, { disabled: v })}
        />
      </div>

      {/* Input-specific: type selector */}
      {field.type === "input" && (
        <>
          <Separator />
          <LabeledRow label="Input type">
            <Select
              value={field.inputType}
              onValueChange={(v) =>
                updateField(field.id, { inputType: v as InputType })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  ["text", "email", "password", "url", "tel"] as InputType[]
                ).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </LabeledRow>
        </>
      )}

      {/* Textarea-specific: rows */}
      {field.type === "textarea" && (
        <>
          <Separator />
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
        </>
      )}

      {/* CheckboxGroup-specific: orientation selector */}
      {field.type === "checkbox-group" && (
        <>
          <Separator />
          <LabeledRow label="Orientation">
            <Select
              value={field.orientation}
              onValueChange={(v) =>
                updateField(field.id, {
                  orientation: v as CheckboxGroupOrientation,
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
        </>
      )}

      {/* Select / RadioGroup / CheckboxGroup: options editor */}
      {(field.type === "select" ||
        field.type === "radio-group" ||
        field.type === "checkbox-group") && (
        <>
          <Separator />
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
        </>
      )}
    </div>
  )
}
