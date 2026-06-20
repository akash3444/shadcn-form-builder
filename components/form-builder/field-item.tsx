"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVerticalIcon,
  Trash2Icon,
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
  Maximize2Icon,
} from "lucide-react"
import type { FormField } from "@/lib/form-builder/types"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import { FieldConfig } from "./field-config"
import { FieldConfigDialog } from "./field-config-dialog"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { FIELD_ICONS, FIELD_LABELS } from "@/config/field"
import { cn } from "@/lib/utils"

interface FieldItemProps {
  field: FormField
  isSelected: boolean
}

export function FieldItem({ field, isSelected }: FieldItemProps) {
  const { selectField, removeField, toggleFieldVisibility } =
    useFormBuilderStore()

  const [expanded, setExpanded] = useState(false)

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
  const isHidden = Boolean(field.hidden)

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
      {/* Row header: three sibling interactive zones (drag / toggle / remove)
          — no nested interactive elements. */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Drag handle */}
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVerticalIcon className="size-4" />
        </button>

        {/* Type icon + label — toggles the inline config panel */}
        <button
          type="button"
          onClick={() => selectField(isSelected ? null : field.id)}
          aria-expanded={isSelected}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 text-left",
            isHidden && "opacity-50"
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {field.label || "Untitled"}
            </span>
            <span className="block text-xs text-muted-foreground">
              {isHidden ? "Hidden" : FIELD_LABELS[field.type]}
              {field.required && (
                <span className="ml-1 text-destructive">*</span>
              )}
            </span>
          </span>
        </button>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              delay={300}
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setExpanded(true)}
                  className="hit-area-x-0.75 hit-area-y-4 text-muted-foreground"
                  aria-label="Expand field"
                />
              }
            >
              <Maximize2Icon />
            </TooltipTrigger>
            <TooltipContent>
              <p>Expand for more space</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              delay={300}
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => toggleFieldVisibility(field.id)}
                  className="hit-area-x-1 hit-area-y-4 text-muted-foreground"
                  aria-label={isHidden ? "Show field" : "Hide field"}
                />
              }
            >
              {isHidden ? <EyeOffIcon /> : <EyeIcon />}
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isHidden
                  ? "Show in preview & code"
                  : "Hide from preview & code"}
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              delay={300}
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeField(field.id)}
                  className="hit-area-x-0.75 hit-area-y-4 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove field"
                />
              }
            >
              <Trash2Icon />
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove field</p>
            </TooltipContent>
          </Tooltip>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => selectField(isSelected ? null : field.id)}
            aria-expanded={isSelected}
            aria-label={isSelected ? "Collapse field" : "Expand field"}
            className="hit-area-x-0.75 hit-area-y-4 text-muted-foreground"
          >
            <ChevronDownIcon
              className={cn("transition-transform", isSelected && "rotate-180")}
            />
          </Button>
        </div>
      </div>

      {/* Inline config panel */}
      {isSelected && (
        <div className="border-t">
          <FieldConfig key={field.id} field={field} />
        </div>
      )}

      <FieldConfigDialog
        field={field}
        open={expanded}
        onClose={() => setExpanded(false)}
      />
    </div>
  )
}
