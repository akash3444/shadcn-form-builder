"use client"

import posthog from "posthog-js"
import { Trash2Icon } from "lucide-react"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function BuilderHeader() {
  const clearForm = useFormBuilderStore((s) => s.clearForm)
  const hasFields = useFormBuilderStore((s) => s.fields.length > 0)

  return (
    <header className="flex shrink-0 items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary">
          <span className="text-xs font-bold text-primary-foreground">F</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold">FormCanvas</h1>
          <p className="text-xs text-muted-foreground">
            Build forms visually, copy production-ready code
          </p>
        </div>
      </div>

      {hasFields && (
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger
              render={
                <AlertDialogTrigger render={<Button variant="destructive" />} />
              }
            >
              <Trash2Icon />
              Clear form
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove all fields and reset settings</p>
            </TooltipContent>
          </Tooltip>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear form?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all fields and reset all settings. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  posthog.capture("form_cleared")
                  clearForm()
                }}
              >
                Clear form
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </header>
  )
}
