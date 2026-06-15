"use client"

import posthog from "posthog-js"
import type { FieldType } from "@/lib/form-builder/types"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FIELD_ICONS } from "@/config/field"
import { cn } from "@/lib/utils"

interface PaletteItem {
  type: FieldType
  label: string
  description: string
}

interface PaletteCategory {
  label: string
  items: PaletteItem[]
}

const PALETTE_CATEGORIES: PaletteCategory[] = [
  {
    label: "Text",
    items: [
      { type: "input", label: "Input", description: "Single-line text" },
      { type: "password", label: "Password", description: "Masked input" },
      { type: "textarea", label: "Textarea", description: "Multi-line text" },
    ],
  },
  {
    label: "Selection",
    items: [
      { type: "select", label: "Select", description: "Dropdown picker" },
      {
        type: "radio-group",
        label: "Radio Group",
        description: "Single choice",
      },
      {
        type: "checkbox-group",
        label: "Checkbox Group",
        description: "Multiple choices",
      },
      { type: "combobox", label: "Combobox", description: "Searchable picker" },
    ],
  },
  {
    label: "Toggle & Numeric",
    items: [
      { type: "checkbox", label: "Checkbox", description: "Boolean toggle" },
      { type: "switch", label: "Switch", description: "On/off toggle" },
      { type: "slider", label: "Slider", description: "Range selector" },
    ],
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
        <div className="space-y-4 p-3">
          {PALETTE_CATEGORIES.map((category) => (
            <div key={category.label} className="space-y-2">
              <p className="px-1 text-xs font-medium text-muted-foreground">
                {category.label}
              </p>
              <div className="space-y-1">
                {category.items.map((item) => {
                  const Icon = FIELD_ICONS[item.type]
                  return (
                    <button
                      key={item.type}
                      onClick={() => {
                        addField(item.type)
                        posthog.capture("field_added", {
                          field_type: item.type,
                        })
                      }}
                      className={cn(
                        "flex w-full items-center rounded-md border bg-background text-left",
                        "hover:bg-accent"
                      )}
                    >
                      <div className="flex shrink-0 items-center justify-center self-stretch border-e border-dashed border-border px-3">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 px-3 py-1.5">
                        <span className="block truncate text-sm font-medium">
                          {item.label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
