import type { Metadata } from "next"

import { BuilderHeader } from "@/components/form-builder/header"
import { BuilderWorkspace } from "@/components/form-builder/workspace"

export const metadata: Metadata = {
  title: "Builder · FormCanvas",
  description:
    "Build forms visually with shadcn/ui components and copy production-ready React Hook Form + Zod code.",
}

export default function BuilderPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <BuilderHeader />

      <BuilderWorkspace />
    </div>
  )
}
