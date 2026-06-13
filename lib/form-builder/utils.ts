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
  defaultValue: string | number | boolean | string[] | undefined,
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
