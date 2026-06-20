"use client"

import type { ComboboxField, FieldOption } from "@/lib/form-builder/types"
import { isGrouped, partitionByGroup } from "@/lib/form-builder/utils"
import {
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select"
import {
  ComboboxCollection,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
} from "@/components/ui/combobox"

/**
 * Shared select/combobox option rendering for the live preview. The React Hook
 * Form and TanStack previews differ only in form binding; the grouped-vs-flat
 * option markup is identical, so it lives here.
 */

/** A group paired with its options, as produced by {@link partitionByGroup}. */
export type PartitionedGroup = { id: string; label: string; items: FieldOption[] }

/**
 * The `items` a combobox feeds base-ui: grouped value-strings
 * (`{ label, items: string[] }`) when grouping is on, otherwise plain value
 * strings. Labels are resolved separately against the flat option list.
 */
export function comboboxItems(
  field: ComboboxField
): string[] | { label: string; items: string[] }[] {
  const flat = field.options.map((o) => o.value)
  if (isGrouped(field)) {
    return partitionByGroup(field).map((g) => ({
      label: g.label,
      items: g.items.map((o) => o.value),
    }))
  }
  return flat
}

/** A combobox's option list — grouped sections or a flat list. */
export function ComboboxOptions({
  field,
  labelFor,
}: {
  field: ComboboxField
  labelFor: (value: string) => string
}) {
  if (isGrouped(field)) {
    return (
      <ComboboxList>
        {(group: { label: string; items: string[] }, index: number) => (
          <ComboboxGroup key={index} items={group.items}>
            {index > 0 ? <ComboboxSeparator /> : null}
            {group.label ? <ComboboxLabel>{group.label}</ComboboxLabel> : null}
            <ComboboxCollection>
              {(value: string) => (
                <ComboboxItem key={value} value={value}>
                  {labelFor(value)}
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxGroup>
        )}
      </ComboboxList>
    )
  }
  return (
    <ComboboxList>
      {(value: string) => (
        <ComboboxItem key={value} value={value}>
          {labelFor(value)}
        </ComboboxItem>
      )}
    </ComboboxList>
  )
}

/**
 * A select's items — grouped `SelectGroup` sections when `groups` is given (the
 * partitioned groups), otherwise a flat list built from `options`.
 */
export function SelectOptions({
  groups,
  options,
}: {
  groups: PartitionedGroup[] | null
  options: FieldOption[]
}) {
  if (groups) {
    return groups.map((group, i) => (
      <SelectGroup key={group.id}>
        {i > 0 ? <SelectSeparator /> : null}
        {group.label ? <SelectLabel>{group.label}</SelectLabel> : null}
        {group.items.map((opt) => (
          <SelectItem key={opt.id} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectGroup>
    ))
  }
  return options.map((opt) => (
    <SelectItem key={opt.id} value={opt.value}>
      {opt.label}
    </SelectItem>
  ))
}
