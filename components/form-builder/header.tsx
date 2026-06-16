"use client"

import Link from "next/link"
import posthog from "posthog-js"
import { ArrowLeftIcon, Trash2Icon } from "lucide-react"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import { Logo } from "@/components/logo"
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
      <div className="flex items-center gap-3.5">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/" />}
          className="hit-area-y-3.5 hit-area-r-2 -ms-5"
        >
          <ArrowLeftIcon />
          Back
        </Button>
        <div className="-ms-2 h-8 w-px bg-border" />
        <Link
          href="/"
          aria-label="Back to home"
          className="flex items-center gap-3 rounded-md transition-opacity hover:opacity-80"
        >
          <Logo showWordmark={false} />
          <div>
            <h1 className="text-sm font-semibold">FormCanvas</h1>
            <p className="text-xs text-muted-foreground">
              Build forms visually, copy production-ready code
            </p>
          </div>
        </Link>
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
