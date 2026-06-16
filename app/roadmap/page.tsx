import type { LucideIcon } from "lucide-react"
import { CircleCheckIcon, CircleDashedIcon, LoaderIcon } from "lucide-react"
import type { Metadata } from "next"

import { SiteHeader } from "@/components/landing/site-header"
import { ROADMAP_ITEMS, type RoadmapStatus } from "@/lib/roadmap"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Roadmap · FormCanvas",
  description: "What we're building next, what's in progress, and what's shipped.",
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
})

/** Format an ISO `YYYY-MM-DD` date without shifting the day by timezone. */
function formatShippedDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number)
  if (!year || !month || !day) return date
  return dateFormatter.format(new Date(Date.UTC(year, month - 1, day)))
}

/** Columns in display order, each backed by a roadmap status. */
const COLUMNS: {
  status: RoadmapStatus
  label: string
  icon: LucideIcon
  accent: string
}[] = [
  {
    status: "planned",
    label: "Planned",
    icon: CircleDashedIcon,
    accent: "text-muted-foreground fill-muted/50",
  },
  {
    status: "in-progress",
    label: "In Progress",
    icon: LoaderIcon,
    accent: "text-amber-500",
  },
  {
    status: "shipped",
    label: "Shipped",
    icon: CircleCheckIcon,
    accent: "text-emerald-500 fill-emerald-500/5",
  },
]

export default function RoadmapPage() {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <header className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Roadmap
          </h1>
          <p className="mt-3 max-w-2xl text-balance text-base text-muted-foreground">
            What we&apos;re building next, what&apos;s in progress, and
            what&apos;s already shipped. Ideas and priorities may shift as we go.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-3">
          {COLUMNS.map((column) => {
            const items = ROADMAP_ITEMS.filter(
              (item) => item.status === column.status
            )
            const Icon = column.icon

            return (
              <section key={column.status} className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Icon className={cn("size-4", column.accent)} />
                  <h2 className="text-sm font-semibold tracking-tight">
                    {column.label}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    ({items.length})
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="rounded-lg border border-dashed bg-muted/50 p-4 text-sm text-muted-foreground">
                    Nothing here right now.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {items.map((item) => (
                      <li
                        key={item.title}
                        className="rounded-lg border border-border/80 shadow-xs/2 bg-background p-4"
                      >
                        <h3 className="font-medium tracking-tight">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                        {item.date ? (
                          <time
                            dateTime={item.date}
                            className="mt-3 block text-xs font-medium text-muted-foreground"
                          >
                            {formatShippedDate(item.date)}
                          </time>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      </main>
    </div>
  )
}
