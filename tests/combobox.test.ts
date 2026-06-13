import { describe, it, expect, beforeEach } from 'vitest'
import { generateFormCode } from '../lib/form-builder/code-generator'
import { buildSchema, buildDefaultValues } from '../lib/form-builder/schema'
import { coerceComboboxDefault } from '../lib/form-builder/utils'
import { useFormBuilderStore } from '../lib/form-builder/store'
import type { ComboboxField } from '../lib/form-builder/types'
import { makeCombobox } from './fixtures'

// ---------------------------------------------------------------------------
// Spec: docs/combobox-field.spec.md — unit-level scenarios.
// (Interactive rendering / the 4 visual branches are covered by the e2e suite;
// here we pin the data, schema, codegen, and toggle-integrity behavior.)
// ---------------------------------------------------------------------------

const reset = () =>
  useFormBuilderStore.setState({
    formName: 'My Form',
    submitLabel: 'Submit',
    fields: [],
    selectedFieldId: null,
  })

describe('§1 adding a combobox (store defaults)', () => {
  beforeEach(reset)

  it('creates a combobox with the documented defaults', () => {
    useFormBuilderStore.getState().addField('combobox')
    const f = useFormBuilderStore.getState().fields[0] as ComboboxField
    expect(f.type).toBe('combobox')
    expect(f.label).toBe('Combobox')
    expect(f.name).toBe('combobox')
    expect(f.multiple).toBe(false)
    expect(f.displayStyle).toBe('input')
    expect(f.clearable).toBe(false)
    expect(f.searchPlaceholder).toBe('Search...')
    expect(f.emptyText).toBe('No results found.')
    expect(f.placeholder).toBe('Select an option')
    expect(f.required).toBe(false)
    expect(f.descriptionPosition).toBe('below-control')
    expect(f.defaultValue).toBeUndefined()
    expect(f.options).toHaveLength(2)
    expect(f.options.map((o) => o.value)).toEqual(['option-1', 'option-2'])
  })

  it('selects the new field and keeps names unique', () => {
    const s = useFormBuilderStore.getState()
    s.addField('combobox')
    s.addField('combobox')
    const { fields, selectedFieldId } = useFormBuilderStore.getState()
    expect(fields[0].name).toBe('combobox')
    expect(fields[1].name).toBe('combobox2')
    expect(selectedFieldId).toBe(fields[1].id)
  })
})

describe('§2 options editing reconciles the default', () => {
  beforeEach(reset)

  it('clears a single default when its option value is renamed', () => {
    const s = useFormBuilderStore.getState()
    s.addField('combobox')
    const f = useFormBuilderStore.getState().fields[0] as ComboboxField
    s.updateField(f.id, { defaultValue: 'option-1' })
    s.updateOption(f.id, f.options[0].id, { value: 'renamed' })
    expect(
      (useFormBuilderStore.getState().fields[0] as ComboboxField).defaultValue
    ).toBeUndefined()
  })

  it('prunes a multiple default when an option is removed', () => {
    const s = useFormBuilderStore.getState()
    s.addField('combobox')
    let f = useFormBuilderStore.getState().fields[0] as ComboboxField
    s.updateField(f.id, { multiple: true, defaultValue: ['option-1', 'option-2'] })
    f = useFormBuilderStore.getState().fields[0] as ComboboxField
    s.removeOption(f.id, f.options[0].id)
    expect(
      (useFormBuilderStore.getState().fields[0] as ComboboxField).defaultValue
    ).toEqual(['option-2'])
  })
})

describe('§3 mode toggle coerces the default (pure helper)', () => {
  it('single → multiple wraps a non-empty string', () => {
    expect(coerceComboboxDefault('option-1', true)).toEqual(['option-1'])
  })
  it('multiple → single takes the first element', () => {
    expect(coerceComboboxDefault(['a', 'b'], false)).toBe('a')
  })
  it('multiple → single on empty array yields undefined', () => {
    expect(coerceComboboxDefault([], false)).toBeUndefined()
  })
  it('single → multiple on empty/unset yields undefined', () => {
    expect(coerceComboboxDefault('', true)).toBeUndefined()
    expect(coerceComboboxDefault(undefined, true)).toBeUndefined()
  })
  it('never produces the wrong shape for the target mode', () => {
    expect(Array.isArray(coerceComboboxDefault('x', true))).toBe(true)
    expect(typeof coerceComboboxDefault(['x'], false)).toBe('string')
  })
})

describe('§4 / §7.4 validation (runtime + generated agree on messages)', () => {
  const errOf = (field: ComboboxField, value: unknown) => {
    const res = buildSchema([field]).safeParse({ [field.name]: value })
    return res.success ? null : res.error.issues[0]?.message
  }

  it('required single: blocks empty with "Please select an option"', () => {
    const f = makeCombobox({ required: true })
    expect(errOf(f, '')).toBe('Please select an option')
    expect(errOf(f, 'react')).toBeNull()
  })

  it('optional single: empty is valid', () => {
    expect(errOf(makeCombobox(), '')).toBeNull()
  })

  it('required multiple: blocks empty with "Select at least one option"', () => {
    const f = makeCombobox({ multiple: true, required: true })
    expect(errOf(f, [])).toBe('Select at least one option')
    expect(errOf(f, ['react'])).toBeNull()
  })

  it('optional multiple: empty array is valid and is the default', () => {
    const f = makeCombobox({ multiple: true })
    expect(errOf(f, [])).toBeNull()
    expect(buildDefaultValues([f])).toEqual({ [f.name]: [] })
  })

  it('single default is "" , multiple default is []', () => {
    expect(buildDefaultValues([makeCombobox({ name: 'a' })])).toEqual({ a: '' })
    expect(
      buildDefaultValues([makeCombobox({ name: 'b', multiple: true })])
    ).toEqual({ b: [] })
  })
})

describe('§7.1 generated code imports only the parts it uses', () => {
  const importLine = (field: ComboboxField) => {
    const code = generateFormCode('F', 'Go', [field])
    return (
      code.match(/import \{ ([^}]*) \} from "@\/components\/ui\/combobox"/)?.[1] ??
      ''
    )
  }

  it('single + input pulls ComboboxInput, not chips/trigger', () => {
    const parts = importLine(makeCombobox({ displayStyle: 'input' }))
    expect(parts).toContain('ComboboxInput')
    expect(parts).not.toContain('ComboboxChips')
    expect(parts).not.toContain('ComboboxTrigger')
    expect(parts).not.toContain('ComboboxClear')
  })

  it('multiple + input pulls chips parts, not ComboboxInput', () => {
    const parts = importLine(makeCombobox({ multiple: true, displayStyle: 'input' }))
    expect(parts).toContain('ComboboxChips')
    expect(parts).toContain('ComboboxChip')
    expect(parts).toContain('ComboboxChipsInput')
    expect(parts).toContain('ComboboxValue')
    expect(parts).not.toContain('ComboboxInput')
    expect(parts).not.toContain('ComboboxTrigger')
  })

  it('trigger style pulls ComboboxTrigger + ComboboxInput (popup search)', () => {
    const parts = importLine(makeCombobox({ displayStyle: 'trigger' }))
    expect(parts).toContain('ComboboxTrigger')
    expect(parts).toContain('ComboboxInput')
  })

  it('ComboboxClear only imported for clearable multiple+input', () => {
    expect(
      importLine(makeCombobox({ multiple: true, displayStyle: 'input', clearable: true }))
    ).toContain('ComboboxClear')
    // showClear prop covers the other clearable styles — no extra import needed.
    expect(
      importLine(makeCombobox({ displayStyle: 'input', clearable: true }))
    ).not.toContain('ComboboxClear')
  })
})

describe('§7.2 generated code emits + references the options const', () => {
  it('declares COMBOBOX_OPTIONS and uses it', () => {
    const code = generateFormCode('F', 'Go', [makeCombobox({ name: 'combobox' })])
    expect(code).toMatch(/const COMBOBOX_OPTIONS = \[/)
    expect(code).toContain('COMBOBOX_OPTIONS.map')
  })
})
