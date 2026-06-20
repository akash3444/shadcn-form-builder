"use client"

import { useState } from "react"
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react"
import type { FieldOption, GroupableField } from "@/lib/form-builder/types"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import { groupsOf } from "@/lib/form-builder/utils"
import slugify from "@/lib/slugify"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"

/** Label + value inputs and a delete button — shared by every option row. */
function OptionInputs({
  fieldId,
  option,
  onRemove,
  removeDisabled,
}: {
  fieldId: string
  option: FieldOption
  onRemove: () => void
  removeDisabled?: boolean
}) {
  const updateOption = useFormBuilderStore((s) => s.updateOption)
  return (
    <>
      <Input
        value={option.label}
        onChange={(e) =>
          updateOption(fieldId, option.id, {
            label: e.target.value,
            value: slugify(e.target.value, { lower: true, strict: true }),
          })
        }
        placeholder="Option label"
        className="h-7 text-xs"
      />
      <Input
        value={option.value}
        onChange={(e) =>
          updateOption(fieldId, option.id, { value: e.target.value })
        }
        placeholder="value"
        className="h-7 w-20 shrink-0 font-mono text-xs"
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={removeDisabled}
        className="shrink-0 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-30"
        aria-label="Remove option"
      >
        <Trash2Icon className="size-3.5" />
      </button>
    </>
  )
}

/** A draggable option row inside a group card. */
function SortableOption({
  fieldId,
  option,
  removeDisabled,
}: {
  fieldId: string
  option: FieldOption
  removeDisabled?: boolean
}) {
  const removeOption = useFormBuilderStore((s) => s.removeOption)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: option.id })
  // The active row stays put (a dimmed placeholder); the DragOverlay is the
  // moving preview. Other rows still transform to make room.
  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex items-center gap-1.5", isDragging && "opacity-50")}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        aria-label="Drag to reorder option"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-3.5" />
      </button>
      <OptionInputs
        fieldId={fieldId}
        option={option}
        onRemove={() => removeOption(fieldId, option.id)}
        removeDisabled={removeDisabled}
      />
    </div>
  )
}

/** One bordered group card: name input, its sortable options, add-option. */
function GroupCard({
  field,
  group,
  options,
  canDelete,
}: {
  field: GroupableField
  group: { id: string; label: string }
  options: FieldOption[]
  canDelete: boolean
}) {
  const updateGroup = useFormBuilderStore((s) => s.updateGroup)
  const removeGroup = useFormBuilderStore((s) => s.removeGroup)
  const addOption = useFormBuilderStore((s) => s.addOption)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: group.id })
  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
  }

  const optionCount = options.length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "space-y-1.5 rounded-md border bg-background p-2",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
          aria-label="Drag to reorder group"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-3.5" />
        </button>
        <Input
          value={group.label}
          onChange={(e) => updateGroup(field.id, group.id, { label: e.target.value })}
          placeholder="Group name (optional)"
          className="h-7 text-xs font-medium"
        />
        {optionCount > 0 && canDelete ? (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                  aria-label="Delete group"
                />
              }
            >
              <Trash2Icon className="size-3.5" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete group?</AlertDialogTitle>
                <AlertDialogDescription>
                  This group has {optionCount} option
                  {optionCount === 1 ? "" : "s"}. Deleting it removes
                  {optionCount === 1 ? " it" : " them"}{" "}too. This can&apos;t be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => removeGroup(field.id, group.id)}
                >
                  Delete group
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <button
            type="button"
            onClick={
              canDelete ? () => removeGroup(field.id, group.id) : undefined
            }
            disabled={!canDelete}
            className="shrink-0 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-30"
            aria-label="Delete group"
          >
            <Trash2Icon className="size-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-1.5 pl-5">
        <SortableContext
          items={options.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {options.map((option) => (
            <SortableOption
              key={option.id}
              fieldId={field.id}
              option={option}
              removeDisabled={field.options.length <= 1}
            />
          ))}
        </SortableContext>
        {options.length === 0 && (
          <p className="py-1 text-center text-[11px] text-muted-foreground/70">
            Drag options here or add one
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-full text-xs"
          onClick={() => addOption(field.id, group.id)}
        >
          <PlusIcon className="mr-1 size-3.5" />
          Add option
        </Button>
      </div>
    </div>
  )
}

/**
 * The grouped options editor: bordered group cards with full drag-and-drop —
 * reorder groups, reorder options within a group, and move options across
 * groups. Storage stays flat; this only manipulates the `groups` overlay and
 * each option's `groupId`.
 */
export function GroupedOptionsEditor({ field }: { field: GroupableField }) {
  const addGroup = useFormBuilderStore((s) => s.addGroup)
  const reorderGroups = useFormBuilderStore((s) => s.reorderGroups)
  const moveOption = useFormBuilderStore((s) => s.moveOption)

  const groups = groupsOf(field)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // The item currently being dragged — rendered in a DragOverlay so the preview
  // follows the cursor in an unclipped portal. Without it, a row dragged out of
  // its card is clipped by the scrolling config panel and appears to vanish.
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeOption = field.options.find((o) => o.id === activeId)
  const activeGroup = groups.find((g) => g.id === activeId)

  // Editor view keeps empty groups (unlike codegen's partitionByGroup).
  const groupOptions = (groupId: string) =>
    field.options.filter((o) => o.groupId === groupId)

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    const groupIds = new Set(groups.map((g) => g.id))

    // Dragging a group reorders the group list. The drop target may be another
    // group card or an option inside one — resolve an option to its group.
    if (groupIds.has(activeId)) {
      const targetGroupId = groupIds.has(overId)
        ? overId
        : field.options.find((o) => o.id === overId)?.groupId
      if (targetGroupId && targetGroupId !== activeId) {
        reorderGroups(field.id, activeId, targetGroupId)
      }
      return
    }

    // Dragging an option. Over a group container → append to that group;
    // over another option → drop before it, into that option's group.
    if (groupIds.has(overId)) {
      moveOption(field.id, activeId, overId)
      return
    }
    const overOption = field.options.find((o) => o.id === overId)
    if (overOption?.groupId) {
      moveOption(field.id, activeId, overOption.groupId, overId)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="space-y-2">
        <SortableContext
          items={groups.map((g) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              field={field}
              group={group}
              options={groupOptions(group.id)}
              canDelete={groups.length > 1}
            />
          ))}
        </SortableContext>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-2 h-7 w-full text-xs"
        onClick={() => addGroup(field.id)}
      >
        <PlusIcon className="mr-1 size-3.5" />
        Add group
      </Button>
      <DragOverlay dropAnimation={null}>
        {activeOption ? (
          <div className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs shadow-lg">
            <GripVerticalIcon className="size-3.5 text-muted-foreground/40" />
            <span className="truncate">
              {activeOption.label || activeOption.value}
            </span>
          </div>
        ) : activeGroup ? (
          <div className="rounded-md border bg-background p-2 text-xs font-medium shadow-lg">
            {activeGroup.label || "Group"}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
