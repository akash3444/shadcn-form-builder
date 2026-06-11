import { describe, it, expect } from 'vitest'
import { generateFormCode } from '../lib/form-builder/code-generator'
import { makeInput, makeSelect, makeTextarea } from './fixtures'

// User-entered strings (labels, placeholders, descriptions, option values, the
// submit label) flow straight into the generated source. Without escaping, a
// quote / angle bracket / brace produces broken or invalid code. These tests
// pin the escaping so "copy code" always yields something that compiles.

describe('generateFormCode — JSX text escaping (labels & descriptions)', () => {
  it('escapes braces and angle brackets in a label', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeInput({ label: 'Price <in {USD}>' }),
    ])
    expect(code).toContain('Price &lt;in &#123;USD&#125;&gt;')
    // The raw, unescaped form must not leak through.
    expect(code).not.toContain('Price <in {USD}>')
  })

  it('escapes ampersands in a description', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeInput({ description: 'Terms & Conditions' }),
    ])
    expect(code).toContain('<FieldDescription>Terms &amp; Conditions</FieldDescription>')
  })
})

describe('generateFormCode — JSX attribute escaping (placeholders)', () => {
  it('escapes double quotes in a placeholder', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeInput({ placeholder: 'e.g. "Ada"' }),
    ])
    expect(code).toContain('placeholder="e.g. &quot;Ada&quot;"')
    // A raw quote would prematurely close the attribute.
    expect(code).not.toContain('placeholder="e.g. "Ada""')
  })

  it('escapes quotes in a textarea placeholder too', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeTextarea({ placeholder: 'say "hi"' }),
    ])
    expect(code).toContain('placeholder="say &quot;hi&quot;"')
  })
})

describe('generateFormCode — JS string literal escaping (options)', () => {
  it('produces a valid JS string for option labels/values containing quotes and backslashes', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeSelect({
        options: [
          { id: 'o1', label: 'A "quoted" label', value: 'a\\b' },
          { id: 'o2', label: 'plain', value: 'plain' },
        ],
      }),
    ])
    // JSON.stringify yields a properly escaped, valid JS string literal.
    expect(code).toContain('{ label: "A \\"quoted\\" label", value: "a\\\\b" },')
  })

  it('emits an options const that is itself valid, evaluatable JS', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeSelect({
        name: 'country',
        options: [
          { id: 'o1', label: 'Côte d\'Ivoire "x"', value: 'ci' },
          { id: 'o2', label: 'Other', value: 'other\\n' },
        ],
      }),
    ])
    const match = code.match(/const COUNTRY_OPTIONS = (\[[\s\S]*?\n\])/)
    expect(match).toBeTruthy()
    // If escaping were wrong this would throw a SyntaxError.
    const options = new Function(`return ${match![1]}`)()
    expect(options).toEqual([
      { label: 'Côte d\'Ivoire "x"', value: 'ci' },
      { label: 'Other', value: 'other\\n' },
    ])
  })
})

describe('generateFormCode — submit label escaping', () => {
  it('escapes special characters in the submit label', () => {
    const code = generateFormCode('My Form', 'Save & <Continue>', [makeInput()])
    expect(code).toContain('>Save &amp; &lt;Continue&gt;</Button>')
  })
})
