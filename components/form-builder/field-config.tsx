"use client"

import type {
  FormField,
  InputType,
  GroupOrientation,
  DescriptionPosition,
} from "@/lib/form-builder/types"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import { labelToKey } from "@/lib/form-builder/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LabeledRow,
  SwitchRow,
  DefaultValueSection,
  ComboboxSettingsSection,
  SliderRangeSection,
  ValidationSection,
  OptionsSection,
} from "./field-config-sections"

const ORIENTATION_OPTIONS = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
]

interface FieldConfigProps {
  field: FormField
}

export function FieldConfig({ field }: FieldConfigProps) {
  const updateField = useFormBuilderStore((s) => s.updateField)

  // The field name is a read-only, auto-derived schema key — it always tracks
  // the label.
  function handleLabelChange(label: string) {
    updateField(field.id, { label, name: labelToKey(label) })
  }

  return (
    <div className="divide-y *:p-4">
      <div className="space-y-2.5">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Field Settings
        </p>

        <LabeledRow label="Label" htmlFor={`label-${field.id}`}>
          <Input
            autoFocus
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
            readOnly
            placeholder="fieldName"
            className="font-mono text-xs"
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

      <DefaultValueSection field={field} />

      {field.type !== "slider" && (
        <div className="space-y-2.5">
          <SwitchRow
            label="Required"
            checked={field.required}
            onChange={(v) => updateField(field.id, { required: v })}
          />
        </div>
      )}

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

      {(field.type === "radio-group" || field.type === "checkbox-group") && (
        <LabeledRow label="Orientation">
          <Select
            value={field.orientation}
            onValueChange={(v) =>
              updateField(field.id, { orientation: v as GroupOrientation })
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

      <ComboboxSettingsSection field={field} />
      <SliderRangeSection field={field} />
      <ValidationSection field={field} />
      <OptionsSection field={field} />
    </div>
  )
}
