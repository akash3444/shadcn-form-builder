import {
  Code2Icon,
  EyeIcon,
  GitBranchIcon,
  LayersIcon,
  MousePointerClickIcon,
  ShieldCheckIcon,
} from "lucide-react"

const FEATURES = [
  {
    icon: MousePointerClickIcon,
    title: "Drag-and-drop editor",
    description:
      "Compose forms by dragging fields onto the canvas and reordering them — no boilerplate to write.",
  },
  {
    icon: LayersIcon,
    title: "Nine field types",
    description:
      "Inputs, selects, checkboxes, switches, radios, sliders, comboboxes and more, each fully configurable.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Zod validation built in",
    description:
      "Toggle requirements, lengths and ranges in the UI and get a matching Zod schema generated for you.",
  },
  {
    icon: GitBranchIcon,
    title: "Pick your form library",
    description:
      "Emit React Hook Form or TanStack Form from the same schema — switch output with a single click.",
  },
  {
    icon: Code2Icon,
    title: "Clean, copyable code",
    description:
      "Readable, typed TypeScript wired to real shadcn/ui components — copy it straight into your project.",
  },
  {
    icon: EyeIcon,
    title: "Live preview",
    description:
      "See the working form update as you build, with validation and submit behavior running in the browser.",
  },
]

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-x-8 gap-y-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Everything you need
            </p>
            <h2 className="mt-2 max-w-[20ch] text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              A faster way to build real forms.
            </h2>
          </div>
          <p className="max-w-[52ch] text-base text-pretty text-muted-foreground lg:text-right">
            FormCanvas handles the wiring so you can focus on the form itself.
            Structure, validation, and the code you actually ship.
          </p>
        </div>

        <dl className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border bg-card p-6 dark:inset-ring dark:inset-ring-white/5"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                <feature.icon className="size-4.5" />
              </span>
              <dt className="mt-4 text-base font-semibold tracking-tight">
                {feature.title}
              </dt>
              <dd className="mt-1.5 text-sm text-pretty text-muted-foreground">
                {feature.description}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
