"use client"

import posthog from "posthog-js"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { FIELD_ICONS, type PaletteItem } from "@/config/field"
import { cn } from "@/lib/utils"

interface FieldPaletteItemProps {
  item: PaletteItem
  showExpanded: boolean
}

export function FieldPaletteItem({
  item,
  showExpanded,
}: FieldPaletteItemProps) {
  const addField = useFormBuilderStore((s) => s.addField)
  const Icon = FIELD_ICONS[item.type]

  const handleAdd = () => {
    addField(item.type)
    posthog.capture("field_added", { field_type: item.type })
  }

  if (!showExpanded) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label={`Add ${item.label}`}
              onClick={handleAdd}
              className={cn(
                "flex aspect-square w-full items-center justify-center rounded-md border bg-background",
                "hover:bg-accent"
              )}
            />
          }
        >
          <Icon className="size-4 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent side="right">
          <span className="flex flex-col">
            <span className="font-medium">{item.label}</span>
            <span className="text-background/70">{item.description}</span>
          </span>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={cn(
        "flex w-full items-center rounded-md border bg-background text-left",
        "hover:bg-accent"
      )}
    >
      <div className="flex shrink-0 items-center justify-center self-stretch border-e border-dashed border-border px-3">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 px-3 py-1.5 opacity-100 transition-opacity duration-200 group-data-collapsed/palette:opacity-0">
        <span className="block truncate text-sm font-medium">{item.label}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {item.description}
        </span>
      </div>
    </button>
  )
}
