import type { Metadata } from "next"

import { getMDXComponents } from "@/components/mdx"
import { SiteHeader } from "@/components/landing/site-header"
import { changelogSource } from "@/lib/source"

export const metadata: Metadata = {
  title: "Changelog · FormCanvas",
  description:
    "New features, improvements, and fixes shipped to FormCanvas.",
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
})

/** Each entry's slug is its release date, e.g. `2026-06-16`. */
function formatReleaseDate(slug: string): string {
  const [year, month, day] = slug.split("-").map(Number)
  if (!year || !month || !day) return slug
  // Construct via UTC so the printed day never shifts with the local timezone.
  return dateFormatter.format(new Date(Date.UTC(year, month - 1, day)))
}

export default function ChangelogPage() {
  const components = getMDXComponents()

  // Newest first — slugs are ISO dates, so a string sort is chronological.
  const entries = [...changelogSource.getPages()].sort((a, b) =>
    b.slugs[0].localeCompare(a.slugs[0])
  )

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <header className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Changelog
          </h1>
          <p className="mt-3 text-balance text-base text-muted-foreground">
            New features, improvements, and fixes we&apos;ve shipped.
          </p>
        </header>

        <ol className="space-y-16">
          {entries.map((entry) => {
            const MDX = entry.data.body
            return (
              <li
                key={entry.url}
                className="relative grid gap-x-10 gap-y-4 sm:grid-cols-[10rem_1fr]"
              >
                <div className="sm:sticky sm:top-24 sm:self-start">
                  <time
                    dateTime={entry.slugs[0]}
                    className="text-sm font-medium text-muted-foreground"
                  >
                    {formatReleaseDate(entry.slugs[0])}
                  </time>
                </div>

                <article className="min-w-0 border-l border-border/60 pl-8 sm:border-l-0 sm:pl-0">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {entry.data.title}
                  </h2>
                  <div className="prose prose-no-margin text-foreground/70 mt-4 max-w-none">
                    <MDX components={components} />
                  </div>
                </article>
              </li>
            )
          })}
        </ol>
      </main>
    </div>
  )
}
