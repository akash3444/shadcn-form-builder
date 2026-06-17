"use client"

import { useState } from "react"

import { FieldPalette } from "@/components/form-builder/palette"
import { FieldEditor } from "@/components/form-builder/editor"
import { FormPreview } from "@/components/form-builder/preview"
import { cn } from "@/lib/utils"

export function BuilderWorkspace() {
  const [paletteCollapsed, setPaletteCollapsed] = useState(false)

  return (
    // The palette shrinks by exactly the amount the editor grows (164px), so the
    // two fixed tracks always sum to 600px. That keeps the `1fr` preview column
    // pinned to the same width while the freed space flows into the editor.
    <main
      className={cn(
        "grid min-h-0 flex-1 divide-x transition-[grid-template-columns] duration-300 ease-in-out",
        paletteCollapsed
          ? "grid-cols-[56px_544px_1fr]"
          : "grid-cols-[220px_380px_1fr]"
      )}
    >
      <FieldPalette
        collapsed={paletteCollapsed}
        onToggleCollapse={() => setPaletteCollapsed((prev) => !prev)}
      />
      <FieldEditor />
      <FormPreview />
    </main>
  )
}
