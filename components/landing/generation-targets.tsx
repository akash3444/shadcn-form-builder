import {
  ReactHookForm,
  ShadcnUi,
  TanStack,
  TypeScript,
  Zod,
} from "@/components/icons"

const TARGETS = [
  {
    name: "React Hook Form",
    Icon: ReactHookForm,
  },
  { name: "TanStack Form", Icon: TanStack },
  { name: "Zod", Icon: Zod },
  { name: "shadcn/ui", Icon: ShadcnUi },
  { name: "TypeScript", Icon: TypeScript },
]

export function GenerationTargets() {
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Generates code for the stack you already use
        </p>
        <ul
          role="list"
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-0 sm:gap-y-0"
        >
          {TARGETS.map((target) => (
            <li
              key={target.name}
              className="inline-flex items-center gap-2.5 text-sm font-medium text-foreground/70 sm:border-l sm:border-border/60 sm:px-6 sm:first:border-l-0"
            >
              <target.Icon className="size-6" />
              {target.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
