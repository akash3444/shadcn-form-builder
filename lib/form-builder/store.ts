import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { arrayMove } from "@dnd-kit/sortable"
import type { FormField, FieldType, FieldOption, FormLibrary } from "./types"
import type { FormPreset } from "./presets"
import {
  labelToKey,
  generateId,
  uniqueName,
  isOptionField,
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
  updateField: (id: string, updates: Partial<FormField>) => void
  reorderFields: (activeId: string, overId: string) => void
  selectField: (id: string | null) => void
  addOption: (fieldId: string) => void
  updateOption: (fieldId: string, optionId: string, updates: Partial<FieldOption>) => void
  removeOption: (fieldId: string, optionId: string) => void
  clearForm: () => void
  loadPreset: (preset: FormPreset) => void
}

type FormBuilderStore = FormBuilderState & FormBuilderActions

const defaultFieldNames: Record<FieldType, string> = {
  input: "Text Field",
  textarea: "Text Area",
  checkbox: "Checkbox",
  switch: "Switch",
  select: "Select",
  "radio-group": "Radio Group",
  "checkbox-group": "Checkbox Group",
  slider: "Slider",
  combobox: "Combobox",
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
  }
}

const initialState: FormBuilderState = {
  formName: "My Form",
  submitLabel: "Submit",
  fields: [],
  selectedFieldId: null,
  formLibrary: "react-hook-form",
}

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

      addOption: (fieldId) =>
        set((state) => ({
          fields: state.fields.map((f) => {
            if (f.id !== fieldId || !isOptionField(f)) return f
            const existingValues = new Set(f.options.map((o) => o.value))
            let n = f.options.length + 1
            while (existingValues.has(`option-${n}`)) n++
            return {
              ...f,
              options: [
                ...f.options,
                {
                  id: generateId(),
                  label: `Option ${n}`,
                  value: `option-${n}`,
                },
              ],
            }
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

      // Keep the chosen form library across a clear — it's an output
      // preference, not form content.
      clearForm: () =>
        set((state) => ({
          ...initialState,
          fields: [],
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
