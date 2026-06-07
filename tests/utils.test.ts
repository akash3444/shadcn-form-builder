import { describe, it, expect } from 'vitest'
import { labelToKey, toPascalCase } from '../lib/form-builder/utils'

describe('labelToKey', () => {
  it('lowercases a single word', () => {
    expect(labelToKey('Hello')).toBe('hello')
  })

  it('converts multi-word label to camelCase', () => {
    expect(labelToKey('First Name')).toBe('firstName')
  })

  it('handles three or more words', () => {
    expect(labelToKey('Date Of Birth')).toBe('dateOfBirth')
  })

  it('strips non-alphanumeric characters', () => {
    expect(labelToKey('E-mail!')).toBe('email')
  })

  it('returns "field" for empty string', () => {
    expect(labelToKey('')).toBe('field')
  })

  it('returns "field" for whitespace-only string', () => {
    expect(labelToKey('   ')).toBe('field')
  })

  it('lowercases all-caps words', () => {
    expect(labelToKey('ONE TWO')).toBe('oneTwo')
  })

  it('collapses multiple spaces between words', () => {
    expect(labelToKey('a  b')).toBe('aB')
  })

  it('handles leading and trailing whitespace', () => {
    expect(labelToKey('  full name  ')).toBe('fullName')
  })

  it('returns "field" for a label with only special characters', () => {
    expect(labelToKey('!@#')).toBe('field')
  })

  // TDD: the result must be a valid JS identifier — it cannot start with a digit,
  // otherwise the generated Zod schema (e.g. `1stName: z.string()`) is a syntax error.
  it('produces a valid identifier when the label starts with a digit', () => {
    const result = labelToKey('1st Name')
    expect(/^\d/.test(result)).toBe(false)
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns "field" when the label consists only of digits', () => {
    expect(labelToKey('123')).toBe('field')
  })
})

describe('toPascalCase', () => {
  it('capitalizes a single word', () => {
    expect(toPascalCase('hello')).toBe('Hello')
  })

  it('converts multi-word label to PascalCase', () => {
    expect(toPascalCase('contact us')).toBe('ContactUs')
  })

  it('returns empty string for empty input', () => {
    expect(toPascalCase('')).toBe('')
  })

  it('normalizes all-caps words', () => {
    expect(toPascalCase('MY FORM')).toBe('MyForm')
  })

  it('strips non-alphanumeric characters', () => {
    expect(toPascalCase('hello! world')).toBe('HelloWorld')
  })

  it('handles leading and trailing whitespace', () => {
    expect(toPascalCase('  my form  ')).toBe('MyForm')
  })
})
