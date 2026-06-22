import type { Metadata } from "next"

// Internal developer-tooling segment (schema parity inspector, etc.). These
// pages exist to inspect/verify the builder's behaviour — they are not part of
// the product surface, so keep them out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b bg-amber-500/10 px-4 py-1.5 text-xs text-amber-700 dark:text-amber-400">
        <span className="font-medium">Internal tool</span>
        <span className="text-amber-700/70 dark:text-amber-400/70">
          Inspection/verification page — not part of the product.
        </span>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
