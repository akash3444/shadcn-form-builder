"use client"

import { useEffect, useState } from "react"
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PALETTE_CATEGORIES } from "@/config/field"
import { cn } from "@/lib/utils"
import { FieldPaletteItem } from "@/components/builder/palette/palette-item"

interface FieldPaletteProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function FieldPalette({
  collapsed = false,
  onToggleCollapse,
}: FieldPaletteProps) {
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

  return (
    <div
      data-collapsed={collapsed || undefined}
      className="group/palette flex h-full flex-col overflow-hidden bg-sidebar"
    >
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
                {category.items.map((item) => (
                  <FieldPaletteItem
                    key={item.type}
                    item={item}
                    showExpanded={showExpanded}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
