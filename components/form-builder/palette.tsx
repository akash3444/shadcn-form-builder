"use client"

import { useEffect, useState } from "react"
import posthog from "posthog-js"
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react"
import type { FieldType } from "@/lib/form-builder/types"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  {
    label: "Date & Time",
    items: [
      { type: "date", label: "Date", description: "Date or range picker" },
    ],
  },
]

interface FieldPaletteProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function FieldPalette({
  collapsed = false,
  onToggleCollapse,
}: FieldPaletteProps) {
  const addField = useFormBuilderStore((s) => s.addField)

  // `collapsed` drives the panel width immediately (see workspace.tsx), but we
  // delay swapping the expanded content to the icon-only layout so the labels
  // fade out as the column shrinks instead of vanishing the instant it starts.
  const [showExpanded, setShowExpanded] = useState(!collapsed)

  // Expanding should reveal the content right away; only collapsing is delayed.
  // Adjusting state during render (rather than in an effect) avoids an extra
  // commit and keeps the content in sync before the browser paints.
  if (!collapsed && !showExpanded) {
    setShowExpanded(true)
  }

  useEffect(() => {
    if (!collapsed) return
    const timeout = setTimeout(() => setShowExpanded(false), 200)
    return () => clearTimeout(timeout)
  }, [collapsed])

  const handleAdd = (type: FieldType) => {
    addField(type)
    posthog.capture("field_added", { field_type: type })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sidebar">
      <div
        className={cn(
          "flex h-[63px] shrink-0 items-center border-b",
          showExpanded ? "justify-between px-4" : "justify-center px-2"
        )}
      >
        {showExpanded && (
          <div
            className={cn(
              "min-w-0 transition-opacity duration-200",
              collapsed ? "opacity-0" : "opacity-100"
            )}
          >
            <h2 className="truncate text-sm font-semibold">Field Types</h2>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Click to add a field
            </p>
          </div>
        )}
        {onToggleCollapse && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={collapsed ? "Expand panel" : "Collapse panel"}
                  aria-expanded={!collapsed}
                  onClick={onToggleCollapse}
                  className="text-muted-foreground"
                />
              }
            >
              {collapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Expand field types" : "Collapse field types"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <ScrollArea
        className="min-h-0 flex-1"
        viewportClassName="scroll-mask-y-from-85%"
      >
        <div className={cn("space-y-4", showExpanded ? "p-3" : "p-2")}>
          {PALETTE_CATEGORIES.map((category) => (
            <div key={category.label} className="space-y-2">
              {showExpanded && (
                <p
                  className={cn(
                    "px-1 text-xs font-medium text-muted-foreground transition-opacity duration-200",
                    collapsed ? "opacity-0" : "opacity-100"
                  )}
                >
                  {category.label}
                </p>
              )}
              <div className="space-y-1">
                {category.items.map((item) => {
                  const Icon = FIELD_ICONS[item.type]

                  if (!showExpanded) {
                    return (
                      <Tooltip key={item.type}>
                        <TooltipTrigger
                          render={
                            <button
                              aria-label={`Add ${item.label}`}
                              onClick={() => handleAdd(item.type)}
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
                            <span className="text-background/70">
                              {item.description}
                            </span>
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return (
                    <button
                      key={item.type}
                      onClick={() => handleAdd(item.type)}
                      className={cn(
                        "flex w-full items-center rounded-md border bg-background text-left",
                        "hover:bg-accent"
                      )}
                    >
                      <div className="flex shrink-0 items-center justify-center self-stretch border-e border-dashed border-border px-3">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div
                        className={cn(
                          "min-w-0 px-3 py-1.5 transition-opacity duration-200",
                          collapsed ? "opacity-0" : "opacity-100"
                        )}
                      >
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
