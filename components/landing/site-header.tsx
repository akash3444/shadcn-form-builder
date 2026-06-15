import Link from "next/link"

import { Logo } from "@/components/logo"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { CtaButton } from "@/components/landing/cta-button"

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
        <Link href="/" aria-label="Homepage">
          <Logo />
        </Link>

        <NavigationMenu className="max-sm:hidden" aria-label="Main">
          <NavigationMenuList className="gap-2">
            {NAV_LINKS.map((link) => (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink render={<Link href={link.href} />}>
                  {link.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <CtaButton location="header" size="sm" label="Open builder" />
        </div>
      </div>
    </header>
  )
}
