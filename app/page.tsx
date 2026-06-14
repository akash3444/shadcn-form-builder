import type { Metadata } from "next"

import { SiteHeader } from "@/components/landing/site-header"
import { Hero } from "@/components/landing/hero"
import { GenerationTargets } from "@/components/landing/generation-targets"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { FieldTypes } from "@/components/landing/field-types"
import { Cta } from "@/components/landing/cta"
import { SiteFooter } from "@/components/landing/site-footer"

export const metadata: Metadata = {
  title: "FormCanvas — Build forms visually, ship production code",
  description:
    "A visual form builder that generates production-ready React Hook Form or TanStack Form code with Zod validation, straight from shadcn/ui components.",
}

export default function Page() {
  return (
    <div className="isolate flex min-h-svh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <Hero />
        <GenerationTargets />
        <Features />
        <HowItWorks />
        <FieldTypes />
        <Cta />
      </main>

      <SiteFooter />
    </div>
  )
}
