"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVerticalIcon,
  Trash2Icon,
  ChevronDownIcon,
  Type,
  AlignLeft,
  CheckSquare,
  ToggleLeft,
  ChevronsUpDown,
  CircleDot,
  ListChecks,
  SlidersHorizontal,
  TextSearch,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { FormField, FieldType } from "@/lib/form-builder/types"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import { FieldConfig } from "./field-config"
import { cn } from "@/lib/utils"

const FIELD_ICONS: Record<FieldType, LucideIcon> = {
  input: Type,
  textarea: AlignLeft,
  checkbox: CheckSquare,
  switch: ToggleLeft,
  select: ChevronsUpDown,
  "radio-group": CircleDot,
  "checkbox-group": ListChecks,
  slider: SlidersHorizontal,
  combobox: TextSearch,
}

const FIELD_LABELS: Record<FieldType, string> = {
  input: "Input",
  textarea: "Textarea",
  checkbox: "Checkbox",
  switch: "Switch",
  select: "Select",
  "radio-group": "Radio Group",
  "checkbox-group": "Checkbox Group",
  slider: "Slider",
  combobox: "Combobox",
}

interface FieldItemProps {
  field: FormField
  isSelected: boolean
}

export function FieldItem({ field, isSelected }: FieldItemProps) {
  const { selectField, removeField } = useFormBuilderStore()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Icon = FIELD_ICONS[field.type]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-background transition-shadow",
        isDragging && "opacity-50 shadow-lg",
        isSelected && "border-ring/70"
      )}
    >
      {/* Row header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        onClick={() => selectField(isSelected ? null : field.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            selectField(isSelected ? null : field.id)
          }
        }}
      >
        {/* Drag handle */}
        <button
          className="shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to reorder"
        >
          <GripVerticalIcon className="size-4" />
        </button>

        {/* Type icon */}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>

        {/* Label + type badge */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {field.label || "Untitled"}
          </p>
          <p className="text-xs text-muted-foreground">
            {FIELD_LABELS[field.type]}
            {field.required && <span className="ml-1 text-destructive">*</span>}
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              removeField(field.id)
            }}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
            aria-label="Remove field"
          >
            <Trash2Icon className="size-3.5" />
          </button>
          <ChevronDownIcon
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              isSelected && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* Inline config panel */}
      {isSelected && (
        <div className="border-t">
          <FieldConfig field={field} />
        </div>
      )}
    </div>
  )
}
