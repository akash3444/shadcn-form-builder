import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { generateFormCode } from '../lib/form-builder/code-generator'
import { buildSchema, buildDefaultValues } from '../lib/form-builder/schema'
import type { FormField } from '../lib/form-builder/types'
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

// ---------------------------------------------------------------------------
// The generator (code-generator.ts) emits a Zod schema as a *string*; the live
// preview uses buildSchema() to construct the *runtime* schema. These two are
// the "twins" — they re-implement the same validation rules independently and
// will silently drift. This test eval's the generated schema string and asserts
// it accepts/rejects exactly the same inputs as buildSchema, for every field
// type and configuration. If either side changes, this test fails.
// ---------------------------------------------------------------------------

/** Extract `z.object({...})` from generated code and turn it into a live schema. */
function evalGeneratedSchema(field: FormField): z.ZodTypeAny {
  const code = generateFormCode('Parity Form', 'Submit', [field])
  const match = code.match(/const \w+Schema = (z\.object\(\{[\s\S]*?\n\}\))\n\ntype /)
  if (!match) throw new Error(`Could not extract schema from generated code:\n${code}`)
  // The generated schema references only `z` — options consts live in the JSX, not the schema.
  return new Function('z', `return ${match[1]}`)(z) as z.ZodTypeAny
}

interface ParityCase {
  name: string
  field: FormField
  /** Values placed under field.name; both schemas must agree on each. */
  samples: unknown[]
}

const cases: ParityCase[] = [
  { name: 'text input (optional)', field: makeInput(), samples: ['', 'hello'] },
  { name: 'text input (required)', field: makeInput({ required: true }), samples: ['', 'hello'] },
  { name: 'email input (optional)', field: makeInput({ inputType: 'email' }), samples: ['bad', 'a@b.com'] },
  { name: 'email input (required)', field: makeInput({ inputType: 'email', required: true }), samples: ['', 'bad', 'a@b.com'] },
  { name: 'url input', field: makeInput({ inputType: 'url' }), samples: ['nope', 'https://x.com'] },
  { name: 'number input (optional)', field: makeInput({ inputType: 'number' }), samples: [undefined, 0, 42] },
  { name: 'number input (required)', field: makeInput({ inputType: 'number', required: true }), samples: [undefined, 0, 42] },
  { name: 'number input (min/max)', field: makeInput({ inputType: 'number', validation: { min: 1, max: 10 } }), samples: [undefined, 0, 5, 11] },
  { name: 'text input minLength (optional)', field: makeInput({ validation: { minLength: 3 } }), samples: ['', 'ab', 'abc'] },
  { name: 'text input minLength (required)', field: makeInput({ required: true, validation: { minLength: 3 } }), samples: ['', 'ab', 'abc'] },
  { name: 'text input maxLength', field: makeInput({ validation: { maxLength: 5 } }), samples: ['12345', '123456'] },
  { name: 'textarea (optional)', field: makeTextarea(), samples: ['', 'words'] },
  { name: 'textarea (required)', field: makeTextarea({ required: true }), samples: ['', 'words'] },
  { name: 'textarea minLength (optional)', field: makeTextarea({ validation: { minLength: 4 } }), samples: ['', 'abc', 'abcd'] },
  { name: 'textarea maxLength', field: makeTextarea({ validation: { maxLength: 3 } }), samples: ['abc', 'abcd'] },
  { name: 'checkbox (optional)', field: makeCheckbox(), samples: [undefined, false, true] },
  { name: 'checkbox (required)', field: makeCheckbox({ required: true }), samples: [false, true] },
  { name: 'switch (optional)', field: makeSwitch(), samples: [undefined, false, true] },
  { name: 'switch (required)', field: makeSwitch({ required: true }), samples: [false, true] },
  { name: 'select (optional)', field: makeSelect(), samples: ['', 'usa'] },
  { name: 'select (required)', field: makeSelect({ required: true }), samples: ['', 'usa'] },
  { name: 'radio-group (optional)', field: makeRadioGroup(), samples: ['', 'male'] },
  { name: 'radio-group (required)', field: makeRadioGroup({ required: true }), samples: ['', 'male'] },
  { name: 'checkbox-group (optional)', field: makeCheckboxGroup(), samples: [undefined, [], ['sports']] },
  { name: 'checkbox-group (required)', field: makeCheckboxGroup({ required: true }), samples: [[], ['sports']] },
  { name: 'slider', field: makeSlider({ min: 0, max: 100 }), samples: [-1, 0, 50, 100, 101] },
]

describe('generator <-> preview schema parity', () => {
  for (const { name, field, samples } of cases) {
    it(`agrees on validation for ${name}`, () => {
      const generated = evalGeneratedSchema(field)
      const runtime = buildSchema([field])
      for (const value of samples) {
        const input = { [field.name]: value }
        const gen = generated.safeParse(input)
        const run = runtime.safeParse(input)
        expect(
          gen.success,
          `disagreement on value ${JSON.stringify(value)}: generated=${gen.success} runtime=${run.success}`
        ).toBe(run.success)
      }
    })
  }
})

describe('generator <-> preview default-value parity', () => {
  // The generator emits a defaultValues object literal; buildDefaultValues
  // builds the runtime equivalent. They must produce the same values.
  const allFields: FormField[] = [
    makeInput({ name: 'text' }),
    makeInput({ name: 'num', inputType: 'number' }),
    makeTextarea({ name: 'bio' }),
    makeCheckbox({ name: 'agree' }),
    makeSwitch({ name: 'notify' }),
    makeSelect({ name: 'country' }),
    makeRadioGroup({ name: 'gender' }),
    makeCheckboxGroup({ name: 'interests' }),
    makeSlider({ name: 'volume', defaultValue: undefined }),
  ]

  it('produces identical default values', () => {
    const code = generateFormCode('Parity Form', 'Submit', allFields)
    const match = code.match(/defaultValues: (\{[\s\S]*?\n {4}\}),\n {2}\}/)
    if (!match) throw new Error(`Could not extract defaultValues:\n${code}`)
    const generated = new Function(`return ${match[1]}`)()
    const runtime = buildDefaultValues(allFields)
    expect(generated).toEqual(runtime)
  })
})
