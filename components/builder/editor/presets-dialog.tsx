"use client"

import posthog from "posthog-js"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import { FORM_PRESETS, type FormPreset } from "@/lib/form-builder/presets"
import { cn } from "@/lib/utils"
import { LayoutTemplateIcon, TriangleAlertIcon } from "lucide-react"

export function PresetsDialog() {
  const loadPreset = useFormBuilderStore((s) => s.loadPreset)
  const hasFields = useFormBuilderStore((s) => s.fields.length > 0)
  const [open, setOpen] = useState(false)
  // Which preset is awaiting a replace confirmation (null = no confirm shown).
  const [pendingPreset, setPendingPreset] = useState<FormPreset | null>(null)

  function capturePresetLoaded(preset: FormPreset, replacedExisting: boolean) {
    posthog.capture("preset_loaded", {
      preset_id: preset.id,
      preset_name: preset.name,
      preset_field_count: preset.fields.length,
      replaced_existing: replacedExisting,
    })
  }

  function handleSelect(preset: FormPreset) {
    // With existing fields, confirm before replacing. Otherwise load right away.
    if (hasFields) {
      setPendingPreset(preset)
      return
    }
    loadPreset(preset)
    capturePresetLoaded(preset, false)
    setOpen(false)
  }

  function handleConfirm() {
    if (!pendingPreset) return
    loadPreset(pendingPreset)
    capturePresetLoaded(pendingPreset, true)
    setPendingPreset(null)
    setOpen(false)
  }

  function handleCancel() {
    if (pendingPreset) {
      posthog.capture("preset_load_cancelled", { preset_id: pendingPreset.id })
    }
    setPendingPreset(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant="outline" size="sm">
              <LayoutTemplateIcon />
              Templates
            </Button>
          }
        />
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Start from a template</DialogTitle>
            <DialogDescription>
              Pick a starting point and tailor it to your needs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {FORM_PRESETS.map((preset) => {
              const Icon = preset.icon
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelect(preset)}
                  className={cn(
                    "flex flex-col gap-3 rounded-lg border bg-background p-3 text-left transition-colors",
                    "hover:border-foreground/20 hover:bg-accent/50",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none"
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Icon className="size-3.5 text-muted-foreground" />
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {preset.fields.length} fields
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm leading-tight font-semibold">
                      {preset.name}
                    </p>
                    <p className="mt-0.75 line-clamp-2 text-xs leading-snug text-muted-foreground">
                      {preset.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingPreset !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingPreset(null)
        }}
      >
        <AlertDialogContent size="sm" forceRender>
          <AlertDialogHeader>
            <TriangleAlertIcon className="my-2 size-8 fill-warning/10 stroke-[1.5] text-warning" />
            <AlertDialogTitle>Replace current form?</AlertDialogTitle>
            <AlertDialogDescription>
              Loading &ldquo;{pendingPreset?.name}&rdquo; will replace all your
              current fields. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
