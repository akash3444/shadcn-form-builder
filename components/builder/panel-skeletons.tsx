import { ChevronDownIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"

/**
 * Chrome-matching placeholders shown while the persisted store rehydrates on the
 * client (see {@link useHydrated}). They reproduce each panel's static headers
 * and background so the real editor/preview slot in without a layout shift — the
 * store-dependent values are the only thing that appears once hydration lands.
 */

/** Mirrors a {@link FieldItem} row: drag handle, icon tile, two text lines. */
function FieldRowSkeleton() {
  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Skeleton className="size-4 shrink-0 rounded-sm" />
        <Skeleton className="size-8 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

export function EditorSkeleton() {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden bg-sidebar">
      <div className="shrink-0 border-b">
        <div className="flex h-12 w-full items-center justify-between px-4 text-sm font-semibold">
          Form Settings
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </div>
        <div className="space-y-2 px-4 pt-0.75 pb-3">
          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Form name
            </span>
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Submit label
            </span>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
          <span className="text-sm font-semibold">Fields</span>
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="space-y-2 p-3">
          {[0, 1, 2, 3].map((i) => (
            <FieldRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function PreviewSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b bg-sidebar px-4 py-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-8 w-46" />
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-md">
          <Skeleton className="mb-6 h-7 w-40" />
          <div className="mb-6 flex flex-col gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}
