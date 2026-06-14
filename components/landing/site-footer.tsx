import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <Link
          href="/"
          aria-label="Homepage"
          className="flex items-center gap-2"
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-primary">
            <span className="text-[0.625rem] font-bold text-primary-foreground">
              F
            </span>
          </span>
          <span className="text-sm font-semibold tracking-tight">
            FormCanvas
          </span>
        </Link>
        <nav
          className="flex items-center gap-6 text-sm text-muted-foreground"
          aria-label="Footer"
        >
          <Link href="#features" className="font-normal hover:text-foreground">
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="font-normal hover:text-foreground"
          >
            How it works
          </Link>
          <Link href="/builder" className="font-normal hover:text-foreground">
            Builder
          </Link>
        </nav>
      </div>
    </footer>
  )
}
