import { describe, it, expect } from 'vitest'
import * as ts from 'typescript'
import { generateFormCode } from '../lib/form-builder/code-generator'
import { FORM_PRESETS } from '../lib/form-builder/presets'
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

// Parse the generated TSX with the real TypeScript parser and return syntax
// diagnostics. This proves the generator never emits code that fails to compile
// — the ultimate guard for escaping / template-structure bugs that substring
// assertions can't catch.
function syntaxErrors(code: string): string[] {
  const sf = ts.createSourceFile(
    'Generated.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  // parseDiagnostics is internal but stable; it holds syntax (not type) errors.
  const diags = (sf as unknown as { parseDiagnostics?: ts.Diagnostic[] }).parseDiagnostics ?? []
  return diags.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
}

describe('parse-validation harness sanity', () => {
  // Guard against a vacuous suite: if parseDiagnostics were always empty, every
  // test below would pass for free. Prove the harness actually flags bad syntax.
  it('reports diagnostics for syntactically broken TSX', () => {
    expect(syntaxErrors('export function X() { return <div</> }').length).toBeGreaterThan(0)
    expect(syntaxErrors('const a: = ').length).toBeGreaterThan(0)
  })

  it('reports no diagnostics for clean TSX', () => {
    expect(syntaxErrors('export const x = <div>hi</div>')).toEqual([])
  })
})

describe('generated code is syntactically valid TSX', () => {
  const NASTY = 'A "quoted" <tag> & {brace} \\ backslash'

  it('handles a kitchen-sink form with every field type', () => {
    const fields: FormField[] = [
      makeInput({ name: 'text', required: true, validation: { minLength: 2, maxLength: 8 } }),
      makeInput({ name: 'mail', inputType: 'email', required: true }),
      makeInput({ name: 'site', inputType: 'url' }),
      makeInput({ name: 'age', inputType: 'number', validation: { min: 1, max: 120 } }),
      makeTextarea({ name: 'bio', validation: { minLength: 10 } }),
      makeCheckbox({ name: 'agree', required: true }),
      makeSwitch({ name: 'notify' }),
      makeSelect({ name: 'country', required: true }),
      makeRadioGroup({ name: 'plan', orientation: 'horizontal' }),
      makeCheckboxGroup({ name: 'tags', orientation: 'horizontal' }),
      makeSlider({ name: 'level' }),
    ]
    expect(syntaxErrors(generateFormCode('Kitchen Sink', 'Go', fields))).toEqual([])
  })

  it('handles special characters in every user-facing string', () => {
    const fields: FormField[] = [
      makeInput({
        name: 'text',
        label: NASTY,
        placeholder: NASTY,
        description: NASTY,
        descriptionPosition: 'above-control',
      }),
      makeSelect({
        name: 'pick',
        label: NASTY,
        placeholder: NASTY,
        description: NASTY,
        options: [
          { id: 'o1', label: NASTY, value: 'a"b\\c' },
          { id: 'o2', label: '</option>', value: 'x' },
        ],
      }),
      makeCheckboxGroup({
        name: 'multi',
        label: NASTY,
        options: [
          { id: 'p1', label: NASTY, value: 'v"1' },
          { id: 'p2', label: 'ok', value: 'v2' },
        ],
      }),
    ]
    const code = generateFormCode(NASTY, NASTY, fields)
    expect(syntaxErrors(code)).toEqual([])
  })

  it('handles both description positions and an empty form', () => {
    expect(
      syntaxErrors(
        generateFormCode('F', 'Submit', [
          makeInput({ name: 'a', description: 'above', descriptionPosition: 'above-control' }),
          makeInput({ name: 'b', description: 'below', descriptionPosition: 'below-control' }),
        ])
      )
    ).toEqual([])
    // Empty form emits a comment, which is valid TS.
    expect(syntaxErrors(generateFormCode('F', 'Submit', []))).toEqual([])
  })

  it.each(FORM_PRESETS.map((p) => [p.id, p] as const))(
    'emits valid TSX for the %s preset',
    (_id, preset) => {
      const code = generateFormCode(preset.formName, preset.submitLabel, preset.fields)
      expect(syntaxErrors(code)).toEqual([])
    }
  )
})
