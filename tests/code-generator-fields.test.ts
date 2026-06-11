import { describe, it, expect } from 'vitest'
import { generateFormCode } from '../lib/form-builder/code-generator'
import {
  makeInput,
  makeTextarea,
  makeCheckbox,
  makeSwitch,
  makeSelect,
  makeRadioGroup,
  makeCheckboxGroup,
  makeSlider,
} from './fixtures'

describe('generateFormCode — default values block', () => {
  it('emits type-appropriate empty defaults', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeInput({ name: 'text' }),
      makeInput({ name: 'num', inputType: 'number' }),
      makeCheckbox({ name: 'agree' }),
      makeCheckboxGroup({ name: 'interests' }),
    ])
    expect(code).toContain('text: "",')
    expect(code).toContain('num: undefined,')
    expect(code).toContain('agree: false,')
    expect(code).toContain('interests: [],')
  })

  it('emits an explicit string defaultValue', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeInput({ name: 'text', defaultValue: 'hello' }),
    ])
    expect(code).toContain('text: "hello",')
  })

  it('emits an explicit number defaultValue for a number input', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeInput({ name: 'age', inputType: 'number', defaultValue: 18 }),
    ])
    expect(code).toContain('age: 18,')
  })

  it('emits an explicit boolean defaultValue', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeCheckbox({ name: 'agree', defaultValue: true }),
    ])
    expect(code).toContain('agree: true,')
  })

  it('emits an explicit array defaultValue for a checkbox-group', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeCheckboxGroup({ name: 'interests', defaultValue: ['sports'] }),
    ])
    expect(code).toContain('interests: ["sports"],')
  })

  it('defaults a slider to its midpoint when no defaultValue is set', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeSlider({ name: 'volume', min: 10, max: 20, defaultValue: undefined }),
    ])
    expect(code).toContain('volume: 15,')
  })
})

describe('generateFormCode — number input', () => {
  it('renders type="number" and valueAsNumber onChange wiring', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeInput({ name: 'age', inputType: 'number' }),
    ])
    expect(code).toContain('type="number"')
    expect(code).toContain('e.target.valueAsNumber')
    expect(code).toContain('e.target.value === "" ? undefined')
  })

  it('emits z.number with min/max and .optional() when not required', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeInput({ name: 'age', inputType: 'number', validation: { min: 1, max: 10 } }),
    ])
    expect(code).toContain(
      'age: z.number().min(1, "Must be at least 1").max(10, "Must be at most 10").optional()'
    )
  })

  it('drops .optional() and adds required_error when required', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeInput({ name: 'age', inputType: 'number', required: true }),
    ])
    expect(code).toContain('age: z.number({ required_error: "This field is required" })')
    expect(code).not.toContain('age: z.number({ required_error: "This field is required" }).optional()')
  })
})

describe('generateFormCode — string length validation', () => {
  it('emits .min for a required minLength input', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeInput({ name: 'user', required: true, validation: { minLength: 3 } }),
    ])
    expect(code).toContain('user: z.string().min(3, "Must be at least 3 characters")')
  })

  it('emits a .refine for an optional minLength input (allows empty)', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeInput({ name: 'user', validation: { minLength: 3 } }),
    ])
    expect(code).toContain('.refine((v) => v.length === 0 || v.length >= 3, "Must be at least 3 characters")')
  })

  it('emits .max for maxLength on a textarea', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeTextarea({ name: 'bio', validation: { maxLength: 200 } }),
    ])
    expect(code).toContain('bio: z.string().max(200, "Must be at most 200 characters")')
  })
})

describe('generateFormCode — slider', () => {
  it('renders the Slider with min/max/step and a value readout', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeSlider({ name: 'volume', min: 0, max: 100, step: 5 }),
    ])
    expect(code).toContain('<Slider')
    expect(code).toContain('min={0}')
    expect(code).toContain('max={100}')
    expect(code).toContain('step={5}')
    expect(code).toContain('{field.value}')
  })

  it('emits z.number().min().max() for the slider schema', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeSlider({ name: 'volume', min: 0, max: 100 }),
    ])
    expect(code).toContain('volume: z.number().min(0).max(100)')
  })

  it('imports the Slider component only when a slider is present', () => {
    expect(
      generateFormCode('My Form', 'Submit', [makeSlider()])
    ).toContain('import { Slider }')
    expect(
      generateFormCode('My Form', 'Submit', [makeInput()])
    ).not.toContain('import { Slider }')
  })
})

describe('generateFormCode — checkbox-group', () => {
  it('renders an options const and a toggling checkbox list', () => {
    const code = generateFormCode('My Form', 'Submit', [makeCheckboxGroup()])
    expect(code).toContain('const INTERESTS_OPTIONS = [')
    expect(code).toContain('(field.value ?? []).includes(option.value)')
    expect(code).toContain('<FieldSet>')
  })

  it('imports Checkbox for a checkbox-group (no standalone checkbox needed)', () => {
    const code = generateFormCode('My Form', 'Submit', [makeCheckboxGroup()])
    expect(code).toContain('import { Checkbox }')
  })

  it('renders horizontal layout classes when orientation is horizontal', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeCheckboxGroup({ orientation: 'horizontal' }),
    ])
    expect(code).toContain('flex flex-row flex-wrap gap-3')
  })
})

describe('generateFormCode — conditional field-component imports', () => {
  // A regression that imports an unused component, or drops a needed one, still
  // passes substring tests but produces code that fails to compile. Pin the
  // conditional import list.
  it('imports FieldContent only when a horizontal (checkbox/switch) field exists', () => {
    expect(generateFormCode('F', 'S', [makeCheckbox()])).toContain('FieldContent')
    expect(generateFormCode('F', 'S', [makeSwitch()])).toContain('FieldContent')
    expect(generateFormCode('F', 'S', [makeInput()])).not.toContain('FieldContent')
  })

  it('imports FieldDescription only when some field has a description', () => {
    expect(
      generateFormCode('F', 'S', [makeInput({ description: 'help' })])
    ).toContain('FieldDescription')
    expect(generateFormCode('F', 'S', [makeInput({ description: '' })])).not.toContain(
      'FieldDescription'
    )
  })

  it('imports FieldLegend/FieldSet only when a grouped (radio/checkbox-group) field exists', () => {
    const radio = generateFormCode('F', 'S', [makeRadioGroup()])
    expect(radio).toContain('FieldLegend')
    expect(radio).toContain('FieldSet')
    const group = generateFormCode('F', 'S', [makeCheckboxGroup()])
    expect(group).toContain('FieldLegend')
    const plain = generateFormCode('F', 'S', [makeInput()])
    expect(plain).not.toContain('FieldLegend')
    expect(plain).not.toContain('FieldSet')
  })
})

describe('generateFormCode — description position', () => {
  it('renders the description before the control when above-control', () => {
    const code = generateFormCode('F', 'S', [
      makeInput({ description: 'hint', descriptionPosition: 'above-control' }),
    ])
    expect(code).toContain('<FieldDescription>hint</FieldDescription>')
    expect(code.indexOf('<FieldDescription>')).toBeLessThan(code.indexOf('<Controller'))
  })

  it('renders the description after the control when below-control', () => {
    const code = generateFormCode('F', 'S', [
      makeInput({ description: 'hint', descriptionPosition: 'below-control' }),
    ])
    expect(code).toContain('<FieldDescription>hint</FieldDescription>')
    expect(code.indexOf('<FieldDescription>')).toBeGreaterThan(code.indexOf('<Controller'))
  })
})

describe('generateFormCode — select with custom default', () => {
  it('emits the selected option value as the default', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeSelect({ name: 'country', defaultValue: 'uk' }),
    ])
    expect(code).toContain('country: "uk",')
  })
})
