"use client"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { LayoutTemplateIcon } from "lucide-react"
import { FieldItem } from "./field-item"

export function FieldEditor() {
  const {
    formName,
    submitLabel,
    fields,
    selectedFieldId,
    setFormName,
    setSubmitLabel,
    reorderFields,
  } = useFormBuilderStore()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderFields(String(active.id), String(over.id))
    }
  }

  return (
    <div className="flex min-h-0 flex-col overflow-hidden bg-sidebar">
      {/* Form-level settings */}
      <div className="shrink-0 border-b px-4 py-3">
        <h2 className="mb-3 text-sm font-semibold">Form Settings</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
            <label
              htmlFor="form-name"
              className="text-xs font-medium text-muted-foreground"
            >
              Form name
            </label>
            <Input
              id="form-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="My Form"
            />
          </div>
          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
            <label
              htmlFor="submit-label"
              className="text-xs font-medium text-muted-foreground"
            >
              Submit label
            </label>
            <Input
              id="submit-label"
              value={submitLabel}
              onChange={(e) => setSubmitLabel(e.target.value)}
              placeholder="Submit"
            />
          </div>
        </div>
      </div>

      {/* Field list */}
      <div className="flex shrink-0 items-center justify-between border-b bg-background px-4 py-2">
        <h2 className="text-sm font-semibold">
          Fields{" "}
          <span className="font-normal text-muted-foreground">
            ({fields.length})
          </span>
        </h2>
      </div>

      {fields.length === 0 ? (
        <Empty className="border-none">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutTemplateIcon />
            </EmptyMedia>
            <EmptyTitle>No fields yet</EmptyTitle>
            <EmptyDescription>
              Click a field type on the left to add it
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 scroll-mask-y-from-90%">
              {fields.map((field) => (
                <FieldItem
                  key={field.id}
                  field={field}
                  isSelected={selectedFieldId === field.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {fields.length > 0 && (
        <>
          <Separator />
          <p className="bg-background px-4 py-2 text-xs text-muted-foreground">
            Drag fields to reorder · Click to edit
          </p>
        </>
      )}
    </div>
  )
}
