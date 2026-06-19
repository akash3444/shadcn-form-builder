import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { arrayMove } from "@dnd-kit/sortable"
import type {
  FormField,
  FieldType,
  FieldOption,
  OptionGroup,
  FormLibrary,
} from "./types"
import { FORM_PRESETS, type FormPreset } from "./presets"
import {
  labelToKey,
  generateId,
  uniqueName,
  isOptionField,
  isGroupableField,
  groupsOf,
  pruneDefault,
} from "./utils"

interface FormBuilderState {
  formName: string
  submitLabel: string
  fields: FormField[]
  selectedFieldId: string | null
  formLibrary: FormLibrary
}

interface FormBuilderActions {
  setFormName: (name: string) => void
  setSubmitLabel: (label: string) => void
  setFormLibrary: (formLibrary: FormLibrary) => void
  addField: (type: FieldType) => void
  removeField: (id: string) => void
  toggleFieldVisibility: (id: string) => void
  updateField: (id: string, updates: Partial<FormField>) => void
  reorderFields: (activeId: string, overId: string) => void
  selectField: (id: string | null) => void
  addOption: (fieldId: string, groupId?: string) => void
  updateOption: (fieldId: string, optionId: string, updates: Partial<FieldOption>) => void
  removeOption: (fieldId: string, optionId: string) => void
  // Grouping (select & combobox only)
  toggleGrouping: (fieldId: string) => void
  addGroup: (fieldId: string) => void
  updateGroup: (fieldId: string, groupId: string, updates: Partial<OptionGroup>) => void
  removeGroup: (fieldId: string, groupId: string) => void
  reorderGroups: (fieldId: string, activeId: string, overId: string) => void
  moveOption: (
    fieldId: string,
    optionId: string,
    toGroupId: string,
    overOptionId?: string
  ) => void
  clearForm: () => void
  loadPreset: (preset: FormPreset) => void
}

type FormBuilderStore = FormBuilderState & FormBuilderActions

const defaultFieldNames: Record<FieldType, string> = {
  input: "Text Field",
  password: "Password",
  textarea: "Text Area",
  checkbox: "Checkbox",
  switch: "Switch",
  select: "Select",
  "radio-group": "Radio Group",
  "checkbox-group": "Checkbox Group",
  slider: "Slider",
  combobox: "Combobox",
  date: "Date",
}

function createDefaultField(type: FieldType): FormField {
  const label = defaultFieldNames[type]
  const base = {
    id: generateId(),
    label,
    name: labelToKey(label),
    placeholder: "",
    description: "",
    descriptionPosition: "below-control" as const,
    required: false,
  }

  const defaultOptions: FieldOption[] = [
    { id: generateId(), label: "Option 1", value: "option-1" },
    { id: generateId(), label: "Option 2", value: "option-2" },
  ]

  switch (type) {
    case "input":
      return { ...base, type: "input", inputType: "text" }
    case "password":
      return {
        ...base,
        type: "password",
        placeholder: "Enter your password",
        showToggle: true,
        validation: { minLength: 8 },
      }
    case "textarea":
      return { ...base, type: "textarea", rows: 3 }
    case "checkbox":
      return { ...base, type: "checkbox" }
    case "switch":
      return { ...base, type: "switch" }
    case "select":
      return { ...base, type: "select", options: defaultOptions }
    case "radio-group":
      return { ...base, type: "radio-group", options: defaultOptions, orientation: "vertical" }
    case "checkbox-group":
      return { ...base, type: "checkbox-group", options: defaultOptions, orientation: "vertical" }
    case "slider":
      return { ...base, type: "slider", min: 0, max: 100, step: 1, defaultValue: 50 }
    case "combobox":
      return {
        ...base,
        type: "combobox",
        placeholder: "Select an option",
        options: defaultOptions,
        multiple: false,
        displayStyle: "input",
        searchPlaceholder: "Search...",
        emptyText: "No results found.",
        clearable: false,
      }
    case "date":
      return {
        ...base,
        type: "date",
        placeholder: "Pick a date",
        mode: "single",
        captionLayout: "label",
        disablePastDates: false,
        disableWeekends: false,
      }
  }
}

// A truly blank slate — used when the user clears the form.
const blankState: FormBuilderState = {
  formName: "My Form",
  submitLabel: "Submit",
  fields: [],
  selectedFieldId: null,
  formLibrary: "react-hook-form",
}

// New visitors (no persisted state) start from a populated example rather than
// an empty canvas. The marketing embed relies on this too, so it never renders
// blank.
const DEFAULT_PRESET = FORM_PRESETS.find((preset) => preset.id === "sign-up")

const initialState: FormBuilderState = DEFAULT_PRESET
  ? {
      ...blankState,
      formName: DEFAULT_PRESET.formName,
      submitLabel: DEFAULT_PRESET.submitLabel,
      fields: DEFAULT_PRESET.fields,
    }
  : blankState

export const useFormBuilderStore = create<FormBuilderStore>()(
  persist(
    (set) => ({
      ...initialState,

      setFormName: (formName) => set({ formName }),
      setSubmitLabel: (submitLabel) => set({ submitLabel }),
      setFormLibrary: (formLibrary) => set({ formLibrary }),

      addField: (type) =>
        set((state) => {
          const field = createDefaultField(type)
          const existingNames = new Set(state.fields.map((f) => f.name))
          field.name = uniqueName(field.name, existingNames)
          return {
            fields: [...state.fields, field],
            selectedFieldId: field.id,
          }
        }),

      removeField: (id) =>
        set((state) => ({
          fields: state.fields.filter((f) => f.id !== id),
          selectedFieldId:
            state.selectedFieldId === id ? null : state.selectedFieldId,
        })),

      toggleFieldVisibility: (id) =>
        set((state) => ({
          fields: state.fields.map((f) =>
            f.id === id ? { ...f, hidden: !f.hidden } : f
          ),
        })),

      updateField: (id, updates) =>
        set((state) => {
          // Field names become object keys in the generated schema and the RHF
          // registry, so they must stay unique. When a name is being set
          // (e.g. auto-derived from a label edit), disambiguate against the
          // OTHER fields' names.
          let nextUpdates = updates
          if (typeof updates.name === "string") {
            const otherNames = new Set(
              state.fields.filter((f) => f.id !== id).map((f) => f.name)
            )
            nextUpdates = { ...updates, name: uniqueName(updates.name, otherNames) }
          }
          return {
            fields: state.fields.map((f) =>
              f.id === id ? ({ ...f, ...nextUpdates } as FormField) : f
            ),
          }
        }),

      reorderFields: (activeId, overId) =>
        set((state) => {
          const oldIndex = state.fields.findIndex((f) => f.id === activeId)
          const newIndex = state.fields.findIndex((f) => f.id === overId)
          return { fields: arrayMove(state.fields, oldIndex, newIndex) }
        }),

      selectField: (id) => set({ selectedFieldId: id }),

      // `groupId` targets a specific group when the field is grouped; omitted,
      // a new option lands in the last group (grouped) or at the end (flat).
      addOption: (fieldId, groupId) =>
        set((state) => ({
          fields: state.fields.map((f) => {
            if (f.id !== fieldId || !isOptionField(f)) return f
            const existingValues = new Set(f.options.map((o) => o.value))
            let n = f.options.length + 1
            while (existingValues.has(`option-${n}`)) n++

            let targetGroupId = groupId
            if (targetGroupId === undefined && isGroupableField(f)) {
              const groups = groupsOf(f)
              if (groups.length > 0) targetGroupId = groups[groups.length - 1].id
            }

            const newOption: FieldOption = {
              id: generateId(),
              label: `Option ${n}`,
              value: `option-${n}`,
              ...(targetGroupId ? { groupId: targetGroupId } : {}),
            }

            // Insert right after the group's last option so it appears inside
            // the right card; flat fields just append.
            if (targetGroupId) {
              const lastInGroup = f.options.reduce(
                (acc, o, i) => (o.groupId === targetGroupId ? i : acc),
                -1
              )
              const at = lastInGroup >= 0 ? lastInGroup + 1 : f.options.length
              return {
                ...f,
                options: [
                  ...f.options.slice(0, at),
                  newOption,
                  ...f.options.slice(at),
                ],
              }
            }
            return { ...f, options: [...f.options, newOption] }
          }),
        })),

      updateOption: (fieldId, optionId, updates) =>
        set((state) => ({
          fields: state.fields.map((f) => {
            if (f.id !== fieldId || !isOptionField(f)) return f
            const updatedOptions = f.options.map((o) =>
              o.id === optionId ? { ...o, ...updates } : o
            )
            // If the option value changed, drop any defaultValue that referenced
            // the old value so it never points at a value that no longer exists.
            if (updates.value !== undefined) {
              const oldValue = f.options.find((o) => o.id === optionId)?.value
              if (oldValue !== undefined && oldValue !== updates.value) {
                const validValues = new Set(updatedOptions.map((o) => o.value))
                return {
                  ...f,
                  options: updatedOptions,
                  defaultValue: pruneDefault(f.defaultValue, validValues),
                }
              }
            }
            return { ...f, options: updatedOptions }
          }),
        })),

      removeOption: (fieldId, optionId) =>
        set((state) => ({
          fields: state.fields.map((f) => {
            if (f.id !== fieldId || !isOptionField(f)) return f
            const remainingOptions = f.options.filter((o) => o.id !== optionId)
            const validValues = new Set(remainingOptions.map((o) => o.value))
            return {
              ...f,
              options: remainingOptions,
              defaultValue: pruneDefault(f.defaultValue, validValues),
            }
          }),
        })),

      // Turn grouping on: wrap every current option into one initial group.
      // Turn it off: drop the groups and strip the groupId overlay, leaving the
      // flat options untouched (lossless round-trip).
      toggleGrouping: (fieldId) =>
        set((state) => ({
          fields: state.fields.map((f) => {
            if (f.id !== fieldId || !isGroupableField(f)) return f
            if (groupsOf(f).length > 0) {
              return {
                ...f,
                groups: [],
                options: f.options.map((o) => {
                  const next = { ...o }
                  delete next.groupId
                  return next
                }),
              }
            }
            const group: OptionGroup = { id: generateId(), label: "Group 1" }
            return {
              ...f,
              groups: [group],
              options: f.options.map((o) => ({ ...o, groupId: group.id })),
            }
          }),
        })),

      addGroup: (fieldId) =>
        set((state) => ({
          fields: state.fields.map((f) => {
            if (f.id !== fieldId || !isGroupableField(f)) return f
            const groups = groupsOf(f)
            return {
              ...f,
              groups: [
                ...groups,
                { id: generateId(), label: `Group ${groups.length + 1}` },
              ],
            }
          }),
        })),

      updateGroup: (fieldId, groupId, updates) =>
        set((state) => ({
          fields: state.fields.map((f) => {
            if (f.id !== fieldId || !isGroupableField(f)) return f
            return {
              ...f,
              groups: groupsOf(f).map((g) =>
                g.id === groupId ? { ...g, ...updates } : g
              ),
            }
          }),
        })),

      // Removing a group removes its options too (confirmed in the UI). The last
      // group can't be removed — flipping grouping off is the way back to flat.
      removeGroup: (fieldId, groupId) =>
        set((state) => ({
          fields: state.fields.map((f) => {
            if (f.id !== fieldId || !isGroupableField(f)) return f
            const groups = groupsOf(f)
            if (groups.length <= 1) return f
            const remainingOptions = f.options.filter(
              (o) => o.groupId !== groupId
            )
            const validValues = new Set(remainingOptions.map((o) => o.value))
            return {
              ...f,
              groups: groups.filter((g) => g.id !== groupId),
              options: remainingOptions,
              defaultValue: pruneDefault(f.defaultValue, validValues),
            }
          }),
        })),

      reorderGroups: (fieldId, activeId, overId) =>
        set((state) => ({
          fields: state.fields.map((f) => {
            if (f.id !== fieldId || !isGroupableField(f)) return f
            const groups = groupsOf(f)
            const oldIndex = groups.findIndex((g) => g.id === activeId)
            const newIndex = groups.findIndex((g) => g.id === overId)
            if (oldIndex < 0 || newIndex < 0) return f
            return { ...f, groups: arrayMove(groups, oldIndex, newIndex) }
          }),
        })),

      // Reassigns an option to `toGroupId` and repositions it in the flat array
      // so its order within the target group matches the drop. Within-group
      // reordering is the same call with an unchanged group. `overOptionId` is
      // the option dropped onto; omitted, the option goes to the group's end.
      //
      // Uses `arrayMove` with the active/over indices in the FULL options array
      // — the same computation dnd-kit's sorting strategy uses for the live drop
      // preview — so where the row lands matches the gap shown while dragging.
      moveOption: (fieldId, optionId, toGroupId, overOptionId) =>
        set((state) => ({
          fields: state.fields.map((f) => {
            if (f.id !== fieldId || !isGroupableField(f)) return f
            const activeIndex = f.options.findIndex((o) => o.id === optionId)
            if (activeIndex < 0) return f

            let targetIndex: number
            if (overOptionId) {
              targetIndex = f.options.findIndex((o) => o.id === overOptionId)
              if (targetIndex < 0) targetIndex = f.options.length - 1
            } else {
              // Dropped on a group container → land at the end of that group.
              targetIndex = f.options.reduce(
                (acc, o, i) =>
                  o.groupId === toGroupId && o.id !== optionId ? i : acc,
                -1
              )
              if (targetIndex < 0) targetIndex = f.options.length - 1
            }

            const reordered = arrayMove(f.options, activeIndex, targetIndex)
            return {
              ...f,
              options: reordered.map((o) =>
                o.id === optionId ? { ...o, groupId: toGroupId } : o
              ),
            }
          }),
        })),

      // Keep the chosen form library across a clear — it's an output
      // preference, not form content.
      clearForm: () =>
        set((state) => ({
          ...blankState,
          formLibrary: state.formLibrary,
        })),

      loadPreset: (preset) =>
        set({
          formName: preset.formName,
          submitLabel: preset.submitLabel,
          fields: preset.fields,
          selectedFieldId: null,
        }),
    }),
    {
      name: "form-builder",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
