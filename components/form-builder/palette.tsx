"use client"

import {
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
import type { FieldType } from "@/lib/form-builder/types"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaletteItem {
  type: FieldType
  label: string
  description: string
  icon: LucideIcon
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: "input",
    label: "Input",
    description: "Single-line text field",
    icon: Type,
  },
  {
    type: "textarea",
    label: "Textarea",
    description: "Multi-line text field",
    icon: AlignLeft,
  },
  {
    type: "checkbox",
    label: "Checkbox",
    description: "Boolean toggle with label",
    icon: CheckSquare,
  },
  {
    type: "checkbox-group",
    label: "Checkbox Group",
    description: "Multiple choices from a list",
    icon: ListChecks,
  },
  {
    type: "switch",
    label: "Switch",
    description: "On/off toggle control",
    icon: ToggleLeft,
  },
  {
    type: "select",
    label: "Select",
    description: "Dropdown option picker",
    icon: ChevronsUpDown,
  },
  {
    type: "combobox",
    label: "Combobox",
    description: "Searchable option picker",
    icon: TextSearch,
  },
  {
    type: "radio-group",
    label: "Radio Group",
    description: "Single choice from a list",
    icon: CircleDot,
  },
  {
    type: "slider",
    label: "Slider",
    description: "Numeric range selector",
    icon: SlidersHorizontal,
  },
]

export function FieldPalette() {
  const addField = useFormBuilderStore((s) => s.addField)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sidebar">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Field Types</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Click to add a field
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 gap-2 p-3">
          {PALETTE_ITEMS.map((item) => (
            <Tooltip key={item.type}>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    onClick={() => addField(item.type)}
                    className={cn(
                      "group h-auto w-full justify-start gap-3 p-1.5",
                      "bg-background! hover:bg-accent!"
                    )}
                  />
                }
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted transition-colors group-hover:bg-background">
                  <item.icon className="size-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
