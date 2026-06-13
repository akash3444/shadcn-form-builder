import type { Metadata } from "next"

import { BuilderHeader } from "@/components/form-builder/header"
import { FieldPalette } from "@/components/form-builder/palette"
import { FieldEditor } from "@/components/form-builder/editor"
import { FormPreview } from "@/components/form-builder/preview"

export const metadata: Metadata = {
  title: "Form Builder",
  description:
    "Build forms visually with shadcn/ui components and copy production-ready React Hook Form + Zod code.",
}

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
