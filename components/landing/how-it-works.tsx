const STEPS = [
  {
    title: "Drag in your fields",
    description:
      "Start from a blank canvas or a preset, then drop in the controls your form needs and order them.",
  },
  {
    title: "Configure and validate",
    description:
      "Set labels, placeholders, defaults and validation rules. The Zod schema updates as you go.",
  },
  {
    title: "Copy the generated code",
    description:
      "Choose React Hook Form or TanStack Form and copy production-ready code into your codebase.",
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 border-t border-border/60 bg-muted/30 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            How it works
          </p>
          <h2 className="mt-2 max-w-[20ch] text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            From blank canvas to code in three steps.
          </h2>
        </div>

        <ol role="list" className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-xl border bg-card p-6 dark:inset-ring dark:inset-ring-white/5"
            >
              <div className="flex size-8 items-center justify-center rounded-lg border border-dashed bg-muted/70 text-sm font-semibold text-foreground tabular-nums">
                {index + 1}
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
