"use client"

import { useState } from "react"

import { FieldPalette } from "@/components/builder/palette/palette"
import { FieldEditor } from "@/components/builder/editor/editor"
import { FormPreview } from "@/components/builder/preview/preview"
import {
  EditorSkeleton,
  PreviewSkeleton,
} from "@/components/builder/panel-skeletons"
import { useHydrated } from "@/hooks/use-hydrated"
import { cn } from "@/lib/utils"

export function BuilderWorkspace() {
  const [paletteCollapsed, setPaletteCollapsed] = useState(false)
  // The palette only reads store actions, so it renders identically on the
  // server and client. The editor and preview render persisted form state, so
  // they wait for client hydration to avoid a flash of the default form.
  const hydrated = useHydrated()

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
      {hydrated ? <FieldEditor /> : <EditorSkeleton />}
      {hydrated ? <FormPreview /> : <PreviewSkeleton />}
    </main>
  )
}
