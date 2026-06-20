"use client"

import type { FormField } from "@/lib/form-builder/types"
import { FieldConfig } from "./field-config"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FIELD_ICONS, FIELD_LABELS } from "@/config/field"
import { ScrollArea } from "../ui/scroll-area"

interface FieldConfigDialogProps {
  field: FormField
  open: boolean
  onClose: () => void
}

export function FieldConfigDialog({
  field,
  open,
  onClose,
}: FieldConfigDialogProps) {
  const Icon = FIELD_ICONS[field.type]

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="flex shrink-0 flex-row items-center gap-3 border-b px-4 py-3 pr-12 text-left">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-sm font-semibold">
              {field.label || "Untitled"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {FIELD_LABELS[field.type]}
            </DialogDescription>
          </div>
        </DialogHeader>

        <ScrollArea
          className="min-h-0 flex-1"
          viewportClassName="max-h-[calc(85vh-3.75rem)] scroll-mask-y"
        >
          <FieldConfig key={field.id} field={field} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
