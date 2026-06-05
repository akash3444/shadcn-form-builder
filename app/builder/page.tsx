"use client"

import { BuilderHeader } from "@/components/form-builder/header"
import { FieldPalette } from "@/components/form-builder/palette"
import { FieldEditor } from "@/components/form-builder/editor"
import { FormPreview } from "@/components/form-builder/preview"

export default function BuilderPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <BuilderHeader />

      <main className="grid min-h-0 flex-1 grid-cols-[220px_380px_1fr] divide-x">
        <FieldPalette />
        <FieldEditor />
        <FormPreview />
      </main>
    </div>
  )
}
