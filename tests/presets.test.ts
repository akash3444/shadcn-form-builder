import { describe, it, expect, beforeEach } from 'vitest'
import { z } from 'zod'
import { FORM_PRESETS } from '../lib/form-builder/presets'
import { generateFormCode } from '../lib/form-builder/code-generator'
import { buildSchema, buildDefaultValues } from '../lib/form-builder/schema'
import { useFormBuilderStore } from '../lib/form-builder/store'
import type { FormField } from '../lib/form-builder/types'

const OPTION_TYPES = new Set(['select', 'radio-group', 'checkbox-group'])
// JS identifier — field names become object keys AND member access (errors.<name>).
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/

function extractGeneratedSchema(code: string): z.ZodTypeAny {
  const match = code.match(/const \w+Schema = (z\.object\(\{[\s\S]*?\n\}\))\n\ntype /)
  if (!match) throw new Error(`Could not extract schema from generated code`)
  return new Function('z', `return ${match[1]}`)(z) as z.ZodTypeAny
}

describe('FORM_PRESETS — catalogue invariants', () => {
  it('every preset id is unique', () => {
    const ids = FORM_PRESETS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every preset has a name, formName, submitLabel and at least one field', () => {
    for (const p of FORM_PRESETS) {
      expect(p.name, p.id).toBeTruthy()
      expect(p.formName, p.id).toBeTruthy()
      expect(p.submitLabel, p.id).toBeTruthy()
      expect(p.fields.length, p.id).toBeGreaterThan(0)
    }
  })
})

describe.each(FORM_PRESETS.map((p) => [p.id, p] as const))(
  'FORM_PRESETS — %s',
  (id, preset) => {
    it('has unique, identifier-safe field names', () => {
      const names = preset.fields.map((f) => f.name)
      expect(new Set(names).size, `duplicate field name in ${id}`).toBe(names.length)
      for (const name of names) {
        expect(name, `invalid identifier in ${id}`).toMatch(IDENTIFIER)
      }
    })

    it('has unique option values within each option field', () => {
      for (const field of preset.fields as FormField[]) {
        if (!OPTION_TYPES.has(field.type)) continue
        const values = (field as { options: { value: string }[] }).options.map((o) => o.value)
        expect(new Set(values).size, `duplicate option value in ${id}/${field.name}`).toBe(
          values.length
        )
      }
    })

    it('generates non-empty code with an extractable, evaluatable schema', () => {
      const code = generateFormCode(preset.formName, preset.submitLabel, preset.fields)
      expect(code).not.toBe('// Add fields to your form to generate code.')
      // Throws if the generated schema is not valid JS.
      expect(() => extractGeneratedSchema(code)).not.toThrow()
    })

    it('generated and runtime schemas agree on valid AND invalid input', () => {
      const code = generateFormCode(preset.formName, preset.submitLabel, preset.fields)
      const generated = extractGeneratedSchema(code)
      const runtime = buildSchema(preset.fields)
      // Both the (valid) defaults and an empty object — the latter forces every
      // required field to reject, so this isn't a trivial true===true smoke test.
      for (const input of [buildDefaultValues(preset.fields), {}]) {
        expect(
          generated.safeParse(input).success,
          `parity mismatch on ${JSON.stringify(input).slice(0, 60)}`
        ).toBe(runtime.safeParse(input).success)
      }
    })
  }
)

describe('loadPreset', () => {
  beforeEach(() => {
    useFormBuilderStore.setState({
      formName: 'My Form',
      submitLabel: 'Submit',
      fields: [],
      selectedFieldId: 'stale',
    })
  })

  it('loads the preset name, label, and fields and clears selection', () => {
    const preset = FORM_PRESETS[0]
    useFormBuilderStore.getState().loadPreset(preset)
    const state = useFormBuilderStore.getState()
    expect(state.formName).toBe(preset.formName)
    expect(state.submitLabel).toBe(preset.submitLabel)
    expect(state.fields).toEqual(preset.fields)
    expect(state.selectedFieldId).toBeNull()
  })

  it('replaces any previously loaded fields', () => {
    useFormBuilderStore.getState().loadPreset(FORM_PRESETS[0])
    useFormBuilderStore.getState().loadPreset(FORM_PRESETS[1])
    expect(useFormBuilderStore.getState().fields).toEqual(FORM_PRESETS[1].fields)
  })
})
