import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { ThemeToggle } from "./theme-toggle"

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Builder", href: "/builder" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          href="/"
          aria-label="Homepage"
          className="flex items-center gap-2"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary">
            <span className="text-xs font-bold text-primary-foreground">F</span>
          </span>
          <span className="text-sm font-semibold tracking-tight">
            FormCanvas
          </span>
        </Link>

        <nav
          className="flex items-center gap-1 max-sm:hidden"
          aria-label="Main"
        >
          {NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              nativeButton={false}
              render={<Link href={link.href} />}
            >
              {link.label}
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/builder" />}
          >
            Open builder
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </header>
  )
}
