import type {
  FormField,
  OptionField,
  GroupableField,
  OptionGroup,
  FieldOption,
  DateRangeValue,
} from "./types"

/** True for field types that carry a user-editable list of options. */
export function isOptionField(field: FormField): field is OptionField {
  return (
    field.type === "select" ||
    field.type === "radio-group" ||
    field.type === "checkbox-group" ||
    field.type === "combobox"
  )
}

/** True for option fields that support organizing their options into groups. */
export function isGroupableField(field: FormField): field is GroupableField {
  return field.type === "select" || field.type === "combobox"
}

/** A field's groups, treating an absent (pre-feature persisted) value as empty. */
export function groupsOf(field: GroupableField): OptionGroup[] {
  return field.groups ?? []
}

/** True when a field currently has grouping turned on (at least one group). */
export function isGrouped(field: FormField): field is GroupableField {
  return isGroupableField(field) && groupsOf(field).length > 0
}

/**
 * Partitions a grouped field's flat options into ordered groups for rendering
 * and code generation. Groups are emitted in `field.groups` order, each holding
 * the options whose `groupId` matches (in flat-array order). Empty groups are
 * dropped — they produce no heading in the output. The single source of the
 * nested `[{ label, items }]` shape used by both the live preview and codegen.
 */
export function partitionByGroup(
  field: GroupableField
): { id: string; label: string; items: FieldOption[] }[] {
  return groupsOf(field)
    .map((group) => ({
      id: group.id,
      label: group.label,
      items: field.options.filter((o) => o.groupId === group.id),
    }))
    .filter((group) => group.items.length > 0)
}

/**
 * Prunes a configured default value down to the values that still exist in an
 * option set. A multi-value default keeps only the still-valid entries (and is
 * dropped entirely if none remain); a single-value default is dropped if its
 * value is gone. Used after options are renamed or removed so the default never
 * references a value that no longer exists.
 */
export function pruneDefault(
  defaultValue: OptionField["defaultValue"],
  validValues: Set<string>
): OptionField["defaultValue"] {
  if (Array.isArray(defaultValue)) {
    const filtered = defaultValue.filter((v) => validValues.has(v))
    return filtered.length ? filtered : undefined
  }
  if (typeof defaultValue === "string" && !validValues.has(defaultValue)) {
    return undefined
  }
  return defaultValue
}

/** "First Name" → "firstName" */
export function labelToKey(label: string): string {
  const words = label
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) return "field"

  const result = words
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("")

  // Strip leading digits so the result is always a valid JS identifier.
  // e.g. "1st Name" → "1stName" → "stName", "123" → "123" → "field"
  return result.replace(/^\d+/, "") || "field"
}

/** "ContactUs" → "contact-us" */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
}

/** "contact us" → "ContactUs" */
export function toPascalCase(label: string): string {
  return label
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")
}

export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Returns `desired` if it is not already in `existing`, otherwise appends the
 * smallest integer suffix (starting at 2) that makes it unique — e.g.
 * "email" -> "email2" -> "email3". Field names must be unique because they
 * become object keys in the generated Zod schema and the react-hook-form field
 * registry; a collision silently merges two fields into one.
 */
export function uniqueName(desired: string, existing: Set<string>): string {
  if (!existing.has(desired)) return desired
  let n = 2
  while (existing.has(`${desired}${n}`)) n++
  return `${desired}${n}`
}

/**
 * Coerces a combobox's configured default value when its `multiple` flag is
 * toggled, so the default never holds the wrong shape for the new mode.
 *   - single → multiple: a non-empty string becomes a one-element array.
 *   - multiple → single: the first element of a non-empty array; otherwise unset.
 * Anything that can't be sensibly carried over becomes `undefined` (no default).
 */
export function coerceComboboxDefault(
  defaultValue: string | number | boolean | string[] | DateRangeValue | undefined,
  toMultiple: boolean
): string[] | string | undefined {
  if (toMultiple) {
    return typeof defaultValue === "string" && defaultValue !== ""
      ? [defaultValue]
      : undefined
  }
  return Array.isArray(defaultValue) && defaultValue.length > 0
    ? defaultValue[0]
    : undefined
}
