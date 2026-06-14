import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function Cta() {
  return (
    <section className="px-6 pb-20 sm:pb-28">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-primary px-6 py-16 text-center sm:py-20">
        <h2 className="mx-auto max-w-[24ch] text-3xl font-semibold tracking-tight text-balance text-primary-foreground sm:text-4xl">
          Start building your form now.
        </h2>
        <p className="mx-auto mt-4 max-w-[48ch] text-base text-pretty text-primary-foreground/70">
          No signup, no setup. Open the builder and copy production-ready code in
          minutes.
        </p>
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            className="bg-background text-foreground hover:bg-background/90"
            nativeButton={false}
            render={<Link href="/builder" />}
          >
            Open the builder
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </section>
  )
}
