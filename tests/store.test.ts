import { describe, it, expect, beforeEach } from 'vitest'
import { useFormBuilderStore } from '../lib/form-builder/store'
import type { FormField } from '../lib/form-builder/types'

const INITIAL_STATE = {
  formName: 'My Form',
  submitLabel: 'Submit',
  fields: [] as FormField[],
  selectedFieldId: null as string | null,
}

beforeEach(() => {
  useFormBuilderStore.setState(INITIAL_STATE)
})

describe('setFormName', () => {
  it('updates formName', () => {
    useFormBuilderStore.getState().setFormName('New Name')
    expect(useFormBuilderStore.getState().formName).toBe('New Name')
  })
})

describe('setSubmitLabel', () => {
  it('updates submitLabel', () => {
    useFormBuilderStore.getState().setSubmitLabel('Send')
    expect(useFormBuilderStore.getState().submitLabel).toBe('Send')
  })
})

describe('addField', () => {
  it('adds a field of the specified type', () => {
    useFormBuilderStore.getState().addField('input')
    expect(useFormBuilderStore.getState().fields).toHaveLength(1)
    expect(useFormBuilderStore.getState().fields[0].type).toBe('input')
  })

  it('sets selectedFieldId to the new field id', () => {
    useFormBuilderStore.getState().addField('input')
    const { fields, selectedFieldId } = useFormBuilderStore.getState()
    expect(selectedFieldId).toBe(fields[0].id)
  })

  it('creates input field with correct default label and name', () => {
    useFormBuilderStore.getState().addField('input')
    const field = useFormBuilderStore.getState().fields[0]
    expect(field.label).toBe('Text Field')
    expect(field.name).toBe('textField')
  })

  it('creates textarea with default rows value', () => {
    useFormBuilderStore.getState().addField('textarea')
    const field = useFormBuilderStore.getState().fields[0]
    if (field.type === 'textarea') {
      expect(field.rows).toBe(3)
    }
  })

  it('creates select with two default options', () => {
    useFormBuilderStore.getState().addField('select')
    const field = useFormBuilderStore.getState().fields[0]
    if (field.type === 'select') {
      expect(field.options).toHaveLength(2)
    }
  })

  it('creates radio-group with two default options', () => {
    useFormBuilderStore.getState().addField('radio-group')
    const field = useFormBuilderStore.getState().fields[0]
    if (field.type === 'radio-group') {
      expect(field.options).toHaveLength(2)
    }
  })

  it('deduplicates name when the same type is added twice', () => {
    useFormBuilderStore.getState().addField('input')
    useFormBuilderStore.getState().addField('input')
    const { fields } = useFormBuilderStore.getState()
    expect(fields[0].name).toBe('textField')
    expect(fields[1].name).toBe('textField2')
  })

  it('increments deduplication counter beyond 2', () => {
    useFormBuilderStore.getState().addField('input')
    useFormBuilderStore.getState().addField('input')
    useFormBuilderStore.getState().addField('input')
    const { fields } = useFormBuilderStore.getState()
    expect(fields[2].name).toBe('textField3')
  })

  it('appends fields in insertion order', () => {
    useFormBuilderStore.getState().addField('input')
    useFormBuilderStore.getState().addField('textarea')
    const { fields } = useFormBuilderStore.getState()
    expect(fields[0].type).toBe('input')
    expect(fields[1].type).toBe('textarea')
  })

  it('creates fields with required=false by default', () => {
    useFormBuilderStore.getState().addField('input')
    expect(useFormBuilderStore.getState().fields[0].required).toBe(false)
  })

  it('creates input field with default inputType of "text"', () => {
    useFormBuilderStore.getState().addField('input')
    const field = useFormBuilderStore.getState().fields[0]
    expect(field.type).toBe('input')
    if (field.type === 'input') expect(field.inputType).toBe('text')
  })

  it('creates select with correct default option labels and values', () => {
    useFormBuilderStore.getState().addField('select')
    const field = useFormBuilderStore.getState().fields[0]
    expect(field.type).toBe('select')
    if (field.type === 'select') {
      expect(field.options[0]).toMatchObject({ label: 'Option 1', value: 'option-1' })
      expect(field.options[1]).toMatchObject({ label: 'Option 2', value: 'option-2' })
    }
  })
})

describe('removeField', () => {
  it('removes the specified field', () => {
    useFormBuilderStore.getState().addField('input')
    useFormBuilderStore.getState().addField('textarea')
    const id = useFormBuilderStore.getState().fields[0].id
    useFormBuilderStore.getState().removeField(id)
    expect(useFormBuilderStore.getState().fields).toHaveLength(1)
    expect(useFormBuilderStore.getState().fields[0].type).toBe('textarea')
  })

  it('clears selectedFieldId when the selected field is removed', () => {
    useFormBuilderStore.getState().addField('input')
    const id = useFormBuilderStore.getState().fields[0].id
    useFormBuilderStore.getState().removeField(id)
    expect(useFormBuilderStore.getState().selectedFieldId).toBeNull()
  })

  it('preserves selectedFieldId when a different field is removed', () => {
    useFormBuilderStore.getState().addField('input')
    useFormBuilderStore.getState().addField('textarea')
    const { fields } = useFormBuilderStore.getState()
    useFormBuilderStore.getState().selectField(fields[0].id)
    useFormBuilderStore.getState().removeField(fields[1].id)
    expect(useFormBuilderStore.getState().selectedFieldId).toBe(fields[0].id)
  })
})

describe('updateField', () => {
  it('updates the specified field', () => {
    useFormBuilderStore.getState().addField('input')
    const id = useFormBuilderStore.getState().fields[0].id
    useFormBuilderStore.getState().updateField(id, { label: 'Updated Label' })
    expect(useFormBuilderStore.getState().fields[0].label).toBe('Updated Label')
  })

  it('does not affect other fields', () => {
    useFormBuilderStore.getState().addField('input')
    useFormBuilderStore.getState().addField('textarea')
    const id = useFormBuilderStore.getState().fields[0].id
    useFormBuilderStore.getState().updateField(id, { label: 'Changed' })
    expect(useFormBuilderStore.getState().fields[1].label).toBe('Text Area')
  })

  it('can mark a field as required', () => {
    useFormBuilderStore.getState().addField('input')
    const id = useFormBuilderStore.getState().fields[0].id
    useFormBuilderStore.getState().updateField(id, { required: true })
    expect(useFormBuilderStore.getState().fields[0].required).toBe(true)
  })

  it('can update the field name', () => {
    useFormBuilderStore.getState().addField('input')
    const id = useFormBuilderStore.getState().fields[0].id
    useFormBuilderStore.getState().updateField(id, { name: 'customName' })
    expect(useFormBuilderStore.getState().fields[0].name).toBe('customName')
  })

  // Names become object keys in the generated schema and the RHF registry.
  // Renaming one field onto another's name must not create a silent collision —
  // the store auto-disambiguates instead.
  it('disambiguates a name that collides with another field', () => {
    useFormBuilderStore.getState().addField('input') // textField
    useFormBuilderStore.getState().addField('input') // textField2
    const [a, b] = useFormBuilderStore.getState().fields
    useFormBuilderStore.getState().updateField(b.id, { name: 'textField' })
    expect(useFormBuilderStore.getState().fields[1].name).toBe('textField2')
    // The first field keeps its name.
    expect(useFormBuilderStore.getState().fields[0].name).toBe(a.name)
  })

  it('lets a field keep its own name when other updates are applied', () => {
    useFormBuilderStore.getState().addField('input')
    const id = useFormBuilderStore.getState().fields[0].id
    const original = useFormBuilderStore.getState().fields[0].name
    // Re-setting the same name (e.g. label edit that yields the same key) must
    // not bump the suffix by colliding with itself.
    useFormBuilderStore.getState().updateField(id, { name: original })
    expect(useFormBuilderStore.getState().fields[0].name).toBe(original)
  })
})

describe('reorderFields', () => {
  it('swaps the positions of two fields', () => {
    useFormBuilderStore.getState().addField('input')
    useFormBuilderStore.getState().addField('textarea')
    const { fields } = useFormBuilderStore.getState()
    const [aId, bId] = [fields[0].id, fields[1].id]
    useFormBuilderStore.getState().reorderFields(aId, bId)
    const reordered = useFormBuilderStore.getState().fields
    expect(reordered[0].id).toBe(bId)
    expect(reordered[1].id).toBe(aId)
  })

  it('preserves all fields after reorder', () => {
    useFormBuilderStore.getState().addField('input')
    useFormBuilderStore.getState().addField('textarea')
    useFormBuilderStore.getState().addField('checkbox')
    const { fields } = useFormBuilderStore.getState()
    useFormBuilderStore.getState().reorderFields(fields[0].id, fields[2].id)
    expect(useFormBuilderStore.getState().fields).toHaveLength(3)
  })
})

describe('selectField', () => {
  it('sets selectedFieldId to the given id', () => {
    useFormBuilderStore.getState().addField('input')
    const id = useFormBuilderStore.getState().fields[0].id
    useFormBuilderStore.getState().selectField(id)
    expect(useFormBuilderStore.getState().selectedFieldId).toBe(id)
  })

  it('sets selectedFieldId to null', () => {
    useFormBuilderStore.getState().addField('input')
    const id = useFormBuilderStore.getState().fields[0].id
    useFormBuilderStore.getState().selectField(id)
    useFormBuilderStore.getState().selectField(null)
    expect(useFormBuilderStore.getState().selectedFieldId).toBeNull()
  })
})

describe('addOption', () => {
  it('adds an option to a select field', () => {
    useFormBuilderStore.getState().addField('select')
    const id = useFormBuilderStore.getState().fields[0].id
    useFormBuilderStore.getState().addOption(id)
    const field = useFormBuilderStore.getState().fields[0]
    if (field.type === 'select') {
      expect(field.options).toHaveLength(3)
      expect(field.options[2].label).toBe('Option 3')
      expect(field.options[2].value).toBe('option-3')
    }
  })

  it('adds an option to a radio-group field', () => {
    useFormBuilderStore.getState().addField('radio-group')
    const id = useFormBuilderStore.getState().fields[0].id
    useFormBuilderStore.getState().addOption(id)
    const field = useFormBuilderStore.getState().fields[0]
    if (field.type === 'radio-group') {
      expect(field.options).toHaveLength(3)
    }
  })

  it('does not modify non-option fields', () => {
    useFormBuilderStore.getState().addField('input')
    const { fields } = useFormBuilderStore.getState()
    const before = fields[0]
    useFormBuilderStore.getState().addOption(before.id)
    expect(useFormBuilderStore.getState().fields[0]).toEqual(before)
  })

  // TDD: addOption derives n from options.length, so removing an option and adding
  // a new one produces a duplicate value (two "option-2"). This breaks the select
  // because HTML option values must be unique for the form to track selection correctly.
  it('generates a unique option value even after a previous option was removed', () => {
    useFormBuilderStore.getState().addField('select')
    const id = useFormBuilderStore.getState().fields[0].id
    const field = useFormBuilderStore.getState().fields[0]
    if (field.type !== 'select') return
    // Remove first option — now only "option-2" remains
    useFormBuilderStore.getState().removeOption(id, field.options[0].id)
    // Adding a new option must not collide with "option-2"
    useFormBuilderStore.getState().addOption(id)
    const updated = useFormBuilderStore.getState().fields[0]
    if (updated.type === 'select') {
      const values = updated.options.map((o) => o.value)
      expect(new Set(values).size).toBe(values.length)
    }
  })
})

describe('updateOption', () => {
  it('updates option label and value', () => {
    useFormBuilderStore.getState().addField('select')
    const { fields } = useFormBuilderStore.getState()
    const field = fields[0]
    if (field.type === 'select') {
      const optionId = field.options[0].id
      useFormBuilderStore.getState().updateOption(field.id, optionId, {
        label: 'Canada',
        value: 'ca',
      })
      const updated = useFormBuilderStore.getState().fields[0]
      if (updated.type === 'select') {
        expect(updated.options[0].label).toBe('Canada')
        expect(updated.options[0].value).toBe('ca')
      }
    }
  })

  it('does not affect other options', () => {
    useFormBuilderStore.getState().addField('select')
    const { fields } = useFormBuilderStore.getState()
    const field = fields[0]
    if (field.type === 'select') {
      useFormBuilderStore.getState().updateOption(field.id, field.options[0].id, {
        label: 'Changed',
      })
      const updated = useFormBuilderStore.getState().fields[0]
      if (updated.type === 'select') {
        expect(updated.options[1].label).toBe('Option 2')
      }
    }
  })
})

describe('removeOption', () => {
  it('removes the specified option from a select field', () => {
    useFormBuilderStore.getState().addField('select')
    const { fields } = useFormBuilderStore.getState()
    const field = fields[0]
    if (field.type === 'select') {
      useFormBuilderStore.getState().removeOption(field.id, field.options[0].id)
      const updated = useFormBuilderStore.getState().fields[0]
      if (updated.type === 'select') {
        expect(updated.options).toHaveLength(1)
        expect(updated.options[0].label).toBe('Option 2')
      }
    }
  })
})

describe('addField — slider and checkbox-group defaults', () => {
  it('creates a slider with min/max/step and a midpoint default value', () => {
    useFormBuilderStore.getState().addField('slider')
    const field = useFormBuilderStore.getState().fields[0]
    expect(field.type).toBe('slider')
    if (field.type === 'slider') {
      expect(field.min).toBe(0)
      expect(field.max).toBe(100)
      expect(field.step).toBe(1)
      expect(field.defaultValue).toBe(50)
    }
  })

  it('creates a checkbox-group with two default options', () => {
    useFormBuilderStore.getState().addField('checkbox-group')
    const field = useFormBuilderStore.getState().fields[0]
    if (field.type === 'checkbox-group') {
      expect(field.options).toHaveLength(2)
    }
  })
})

// A defaultValue that references an option value must not survive that option
// being renamed or deleted — otherwise the form initialises to a value with no
// matching control.
describe('option changes cascade to defaultValue', () => {
  const s = () => useFormBuilderStore.getState()

  it('clears a select default when its referenced option value changes', () => {
    s().addField('select')
    const f = s().fields[0]
    if (f.type !== 'select') return
    s().updateField(f.id, { defaultValue: 'option-1' })
    s().updateOption(f.id, f.options[0].id, { value: 'changed' })
    expect(s().fields[0].defaultValue).toBeUndefined()
  })

  it('preserves a select default when an unrelated option value changes', () => {
    s().addField('select')
    const f = s().fields[0]
    if (f.type !== 'select') return
    s().updateField(f.id, { defaultValue: 'option-1' })
    s().updateOption(f.id, f.options[1].id, { value: 'changed' })
    expect(s().fields[0].defaultValue).toBe('option-1')
  })

  it('filters a checkbox-group default array when an option value changes', () => {
    s().addField('checkbox-group')
    const f = s().fields[0]
    if (f.type !== 'checkbox-group') return
    s().updateField(f.id, { defaultValue: ['option-1', 'option-2'] })
    s().updateOption(f.id, f.options[0].id, { value: 'changed' })
    expect(s().fields[0].defaultValue).toEqual(['option-2'])
  })

  it('clears a checkbox-group default to undefined when filtering empties it', () => {
    s().addField('checkbox-group')
    const f = s().fields[0]
    if (f.type !== 'checkbox-group') return
    s().updateField(f.id, { defaultValue: ['option-1'] })
    s().updateOption(f.id, f.options[0].id, { value: 'changed' })
    expect(s().fields[0].defaultValue).toBeUndefined()
  })

  it('clears a radio default when its referenced option is removed', () => {
    s().addField('radio-group')
    const f = s().fields[0]
    if (f.type !== 'radio-group') return
    s().updateField(f.id, { defaultValue: 'option-1' })
    s().removeOption(f.id, f.options[0].id)
    expect(s().fields[0].defaultValue).toBeUndefined()
  })

  it('preserves a radio default when an unrelated option is removed', () => {
    s().addField('radio-group')
    const f = s().fields[0]
    if (f.type !== 'radio-group') return
    s().updateField(f.id, { defaultValue: 'option-2' })
    s().removeOption(f.id, f.options[0].id)
    expect(s().fields[0].defaultValue).toBe('option-2')
  })

  it('filters a checkbox-group default array when an option is removed', () => {
    s().addField('checkbox-group')
    const f = s().fields[0]
    if (f.type !== 'checkbox-group') return
    s().updateField(f.id, { defaultValue: ['option-1', 'option-2'] })
    s().removeOption(f.id, f.options[0].id)
    expect(s().fields[0].defaultValue).toEqual(['option-2'])
  })
})

describe('clearForm', () => {
  it('resets fields to an empty array', () => {
    useFormBuilderStore.getState().addField('input')
    useFormBuilderStore.getState().addField('textarea')
    useFormBuilderStore.getState().clearForm()
    expect(useFormBuilderStore.getState().fields).toHaveLength(0)
  })

  it('resets formName to default', () => {
    useFormBuilderStore.getState().setFormName('Custom Name')
    useFormBuilderStore.getState().clearForm()
    expect(useFormBuilderStore.getState().formName).toBe('My Form')
  })

  it('resets submitLabel to default', () => {
    useFormBuilderStore.getState().setSubmitLabel('Send')
    useFormBuilderStore.getState().clearForm()
    expect(useFormBuilderStore.getState().submitLabel).toBe('Submit')
  })

  it('resets selectedFieldId to null', () => {
    useFormBuilderStore.getState().addField('input')
    const id = useFormBuilderStore.getState().fields[0].id
    useFormBuilderStore.getState().selectField(id)
    useFormBuilderStore.getState().clearForm()
    expect(useFormBuilderStore.getState().selectedFieldId).toBeNull()
  })
})
