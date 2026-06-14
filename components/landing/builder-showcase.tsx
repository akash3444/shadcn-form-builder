/**
 * The real form builder, embedded and interactive on the landing page — drag
 * fields, tweak validation, and watch the generated code update. Renders an
 * iframe of /builder/embed inside window chrome.
 */
export function BuilderShowcase() {
  return (
    <div className="mx-auto mt-14 max-w-7xl px-6 pb-16">
      <div className="rounded-2xl border border-border/80 bg-background p-1 shadow-[0_0_6px_1px_rgba(0,0,0,0.04)] dark:border-foreground/15">
        <div className="overflow-hidden rounded-xl border border-border/80 bg-background dark:border-foreground/15">
          <iframe
            src="/builder/embed"
            title="Interactive FormCanvas builder"
            loading="lazy"
            className="block h-144 w-full sm:h-160"
          />
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Build it right here — drag fields, set validation, switch libraries.
        Real generated code, not a mockup.
      </p>
    </div>
  )
}
