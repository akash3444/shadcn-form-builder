import {
  AlignLeftIcon,
  CircleDotIcon,
  ListChecksIcon,
  ListIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  SquareCheckIcon,
  TextCursorInputIcon,
  ToggleRightIcon,
} from "lucide-react"

const FIELD_TYPES = [
  {
    icon: TextCursorInputIcon,
    name: "Input",
    description: "Text, email, password, number and more.",
  },
  {
    icon: AlignLeftIcon,
    name: "Textarea",
    description: "Multi-line text with configurable rows.",
  },
  {
    icon: ListIcon,
    name: "Select",
    description: "Pick one option from a dropdown.",
  },
  {
    icon: SquareCheckIcon,
    name: "Checkbox",
    description: "A single on/off boolean value.",
  },
  {
    icon: ToggleRightIcon,
    name: "Switch",
    description: "A toggle for boolean settings.",
  },
  {
    icon: CircleDotIcon,
    name: "Radio group",
    description: "Choose one from a visible set.",
  },
  {
    icon: ListChecksIcon,
    name: "Checkbox group",
    description: "Select many options from a list.",
  },
  {
    icon: SlidersHorizontalIcon,
    name: "Slider",
    description: "Pick a number within a range.",
  },
  {
    icon: SearchIcon,
    name: "Combobox",
    description: "Searchable select, single or multi.",
  },
]

export function FieldTypes() {
  return (
    <section className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-x-8 gap-y-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Field library
            </p>
            <h2 className="mt-2 max-w-[24ch] text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Nine field types, each ready to ship.
            </h2>
          </div>
          <p className="max-w-[52ch] text-base text-pretty text-muted-foreground lg:text-right">
            Every field maps to a real shadcn/ui component with configurable
            labels, descriptions, defaults, and validation.
          </p>
        </div>

        <ul
          role="list"
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FIELD_TYPES.map((field) => (
            <li
              key={field.name}
              className="flex items-start gap-3 rounded-xl border bg-card p-4 dark:inset-ring dark:inset-ring-white/5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <field.icon className="size-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{field.name}</p>
                <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
                  {field.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
