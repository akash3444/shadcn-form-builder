import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { ReactHookForm, TanStack } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BuilderShowcase } from "@/components/landing/builder-showcase"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--color-muted)_0%,transparent_100%)]"
        aria-hidden
      />
      <div className="mx-auto max-w-6xl px-6 pt-20 sm:pt-28">
        <div className="flex flex-col items-center text-center">
          <Badge
            variant="outline"
            className="mb-6 h-auto gap-1.5 bg-card px-2.5 py-1 text-sm"
          >
            <span className="inline-flex items-center gap-1.5">
              <ReactHookForm viewBox="0 0 203 202" className="size-4.5" />
              React Hook Form
            </span>
            <span className="mx-1 text-muted-foreground">&</span>
            <span className="inline-flex items-center gap-1.5">
              <TanStack className="size-4.5" />
              TanStack Form
            </span>
          </Badge>
          <h1 className="mx-auto max-w-[20ch] text-4xl font-semibold tracking-tighter text-balance sm:text-6xl/[1.15]">
            Build forms visually. Ship production code.
          </h1>
          <p className="mx-auto mt-6 max-w-[52ch] text-base text-pretty text-muted-foreground sm:text-lg">
            Drag fields, set validation, and copy fully typed React Hook Form or
            TanStack Form code with Zod — no boilerplate.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/builder" />}
            >
              Open the builder
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="#how-it-works" />}
            >
              See how it works
            </Button>
          </div>
        </div>
      </div>

      <BuilderShowcase />
    </section>
  )
}
