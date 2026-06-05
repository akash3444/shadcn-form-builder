"use client"

import { Trash2Icon } from "lucide-react"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function BuilderHeader() {
  const { clearForm, fields } = useFormBuilderStore()

  return (
    <header className="flex shrink-0 items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary">
          <span className="text-xs font-bold text-primary-foreground">F</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold">Shadcn Form Builder</h1>
          <p className="text-xs text-muted-foreground">
            Build forms visually, copy production-ready code
          </p>
        </div>
      </div>

      {fields.length > 0 && (
        <Tooltip>
          <TooltipTrigger
            render={<Button variant="destructive" onClick={clearForm} />}
          >
            <Trash2Icon />
            Clear form
          </TooltipTrigger>
          <TooltipContent>
            <p>Remove all fields and reset settings</p>
          </TooltipContent>
        </Tooltip>
      )}
    </header>
  )
}
