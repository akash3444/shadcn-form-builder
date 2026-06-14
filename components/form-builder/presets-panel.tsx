"use client"

import posthog from "posthog-js"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
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
import { TriangleAlertIcon } from "lucide-react"

interface PresetsPanelProps {
  onLoad: () => void
}

export function PresetsPanel({ onLoad }: PresetsPanelProps) {
  const loadPreset = useFormBuilderStore((s) => s.loadPreset)
  const hasFields = useFormBuilderStore((s) => s.fields.length > 0)
  const [pendingPreset, setPendingPreset] = useState<FormPreset | null>(null)

  function capturePresetLoaded(preset: FormPreset, replacedExisting: boolean) {
    posthog.capture("preset_loaded", {
      preset_id: preset.id,
      preset_name: preset.name,
      preset_field_count: preset.fields.length,
      replaced_existing: replacedExisting,
    })
  }

  function handleCardClick(preset: FormPreset) {
    if (hasFields) {
      setPendingPreset(preset)
    } else {
      loadPreset(preset)
      capturePresetLoaded(preset, false)
      onLoad()
    }
  }

  function handleConfirm() {
    if (!pendingPreset) return
    loadPreset(pendingPreset)
    capturePresetLoaded(pendingPreset, true)
    setPendingPreset(null)
    onLoad()
  }

  function handleCancel() {
    if (pendingPreset) {
      posthog.capture("preset_load_cancelled", { preset_id: pendingPreset.id })
    }
    setPendingPreset(null)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 p-3">
        {FORM_PRESETS.map((preset) => {
          const Icon = preset.icon
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleCardClick(preset)}
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

      <AlertDialog
        open={pendingPreset !== null}
        onOpenChange={(open) => {
          if (!open) setPendingPreset(null)
        }}
      >
        <AlertDialogContent size="sm">
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
