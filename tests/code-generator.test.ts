import { describe, it, expect } from 'vitest'
import { generateFormCode } from '../lib/form-builder/code-generator'
import type {
  InputField,
  TextareaField,
  CheckboxField,
  SwitchField,
  SelectField,
  RadioGroupField,
  CheckboxGroupField,
} from '../lib/form-builder/types'

const makeInput = (overrides: Partial<InputField> = {}): InputField => ({
  id: 'id-1',
  type: 'input',
  label: 'Name',
  name: 'name',
  placeholder: '',
  description: '',
  descriptionPosition: 'below-control' as const,
  required: false,
  disabled: false,
  inputType: 'text',
  ...overrides,
})

const makeTextarea = (overrides: Partial<TextareaField> = {}): TextareaField => ({
  id: 'id-1',
  type: 'textarea',
  label: 'Bio',
  name: 'bio',
  placeholder: '',
  description: '',
  descriptionPosition: 'below-control' as const,
  required: false,
  disabled: false,
  rows: 3,
  ...overrides,
})

const makeCheckbox = (overrides: Partial<CheckboxField> = {}): CheckboxField => ({
  id: 'id-1',
  type: 'checkbox',
  label: 'Accept Terms',
  name: 'acceptTerms',
  placeholder: '',
  description: '',
  descriptionPosition: 'below-control' as const,
  required: false,
  disabled: false,
  ...overrides,
})

const makeSwitch = (overrides: Partial<SwitchField> = {}): SwitchField => ({
  id: 'id-1',
  type: 'switch',
  label: 'Notifications',
  name: 'notifications',
  placeholder: '',
  description: '',
  descriptionPosition: 'below-control' as const,
  required: false,
  disabled: false,
  ...overrides,
})

const makeSelect = (overrides: Partial<SelectField> = {}): SelectField => ({
  id: 'id-1',
  type: 'select',
  label: 'Country',
  name: 'country',
  placeholder: '',
  description: '',
  descriptionPosition: 'below-control' as const,
  required: false,
  disabled: false,
  options: [
    { id: 'opt-1', label: 'USA', value: 'usa' },
    { id: 'opt-2', label: 'UK', value: 'uk' },
  ],
  ...overrides,
})

const makeRadioGroup = (overrides: Partial<RadioGroupField> = {}): RadioGroupField => ({
  id: 'id-1',
  type: 'radio-group',
  label: 'Gender',
  name: 'gender',
  placeholder: '',
  description: '',
  descriptionPosition: 'below-control' as const,
  orientation: 'vertical' as const,
  required: false,
  disabled: false,
  options: [
    { id: 'opt-1', label: 'Male', value: 'male' },
    { id: 'opt-2', label: 'Female', value: 'female' },
  ],
  ...overrides,
})

const makeCheckboxGroup = (
  overrides: Partial<CheckboxGroupField> = {}
): CheckboxGroupField => ({
  id: 'id-1',
  type: 'checkbox-group',
  label: 'Interests',
  name: 'interests',
  placeholder: '',
  description: '',
  descriptionPosition: 'below-control' as const,
  orientation: 'vertical' as const,
  required: false,
  disabled: false,
  options: [
    { id: 'opt-1', label: 'Sports', value: 'sports' },
    { id: 'opt-2', label: 'Music', value: 'music' },
  ],
  ...overrides,
})

describe('generateFormCode — checkbox-group field', () => {
  // The preview (preview-form.tsx buildSchema) uses z.array(z.string()).default([])
  // for an optional checkbox-group. The generator MUST emit the same schema or the
  // copied code validates differently than what the user saw in the preview.
  it('generates z.array(z.string()).default([]) for an optional checkbox-group', () => {
    const code = generateFormCode('My Form', 'Submit', [makeCheckboxGroup()])
    expect(code).toContain('interests: z.array(z.string()).default([])')
  })

  it('adds .min(1) for a required checkbox-group', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeCheckboxGroup({ required: true }),
    ])
    expect(code).toContain(
      'interests: z.array(z.string()).min(1, "Select at least one option")'
    )
  })
})

describe('generateFormCode — empty fields', () => {
  it('returns placeholder comment', () => {
    expect(generateFormCode('My Form', 'Submit', [])).toBe(
      '// Add fields to your form to generate code.'
    )
  })
})

describe('generateFormCode — form metadata', () => {
  it('uses formName as camelCase schema name', () => {
    const code = generateFormCode('Contact Us', 'Submit', [makeInput()])
    expect(code).toContain('const contactUsSchema = z.object(')
  })

  it('uses formName as PascalCase type name', () => {
    const code = generateFormCode('Contact Us', 'Submit', [makeInput()])
    expect(code).toContain('type ContactUsValues = z.infer<typeof contactUsSchema>')
  })

  it('uses formName as PascalCase component name', () => {
    const code = generateFormCode('Contact Us', 'Submit', [makeInput()])
    expect(code).toContain('export function ContactUsForm()')
  })

  it('renders submitLabel in button text', () => {
    const code = generateFormCode('My Form', 'Send Message', [makeInput()])
    expect(code).toContain('>Send Message<')
  })
})

describe('generateFormCode — input field', () => {
  it('generates z.string() for optional text input', () => {
    const code = generateFormCode('My Form', 'Submit', [makeInput()])
    expect(code).toContain('name: z.string()')
  })

  it('adds .min(1) for required text input', () => {
    const code = generateFormCode('My Form', 'Submit', [makeInput({ required: true })])
    expect(code).toContain('name: z.string().min(1, "This field is required")')
  })

  it('adds .email() for email input type', () => {
    const code = generateFormCode('My Form', 'Submit', [makeInput({ inputType: 'email' })])
    expect(code).toContain('.email("Invalid email address")')
  })

  // TDD: email + required is a real combination users will create.
  // The schema must validate both format AND presence — tested together, not separately.
  it('adds both .email() and .min(1) for a required email input', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeInput({ inputType: 'email', required: true }),
    ])
    expect(code).toContain('.email("Invalid email address").min(1, "This field is required")')
  })

  it('adds .url() for url input type', () => {
    const code = generateFormCode('My Form', 'Submit', [makeInput({ inputType: 'url' })])
    expect(code).toContain('.url("Invalid URL")')
  })

  it('renders correct type attribute in JSX', () => {
    const code = generateFormCode('My Form', 'Submit', [makeInput({ inputType: 'email' })])
    expect(code).toContain('type="email"')
  })

  it('renders placeholder in JSX', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeInput({ placeholder: 'Enter your name' }),
    ])
    expect(code).toContain('placeholder="Enter your name"')
  })

  it('renders description in FieldDescription when set', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeInput({ description: 'Your full name' }),
    ])
    expect(code).toContain('<FieldDescription>Your full name</FieldDescription>')
  })

  it('omits FieldDescription entirely when description is empty', () => {
    const code = generateFormCode('My Form', 'Submit', [makeInput({ description: '' })])
    expect(code).not.toContain('<FieldDescription>')
  })

  it('renders disabled={true} in JSX when the field is disabled', () => {
    const code = generateFormCode('My Form', 'Submit', [makeInput({ disabled: true })])
    expect(code).toContain('disabled={true}')
  })

  it('includes required asterisk span when required', () => {
    const code = generateFormCode('My Form', 'Submit', [makeInput({ required: true })])
    expect(code).toContain('text-destructive')
  })

  it('omits required asterisk span when not required', () => {
    const code = generateFormCode('My Form', 'Submit', [makeInput({ required: false })])
    expect(code).not.toContain('text-destructive')
  })
})

describe('generateFormCode — textarea field', () => {
  it('generates z.string() for optional textarea', () => {
    const code = generateFormCode('My Form', 'Submit', [makeTextarea()])
    expect(code).toContain('bio: z.string()')
  })

  it('adds .min(1) for required textarea', () => {
    const code = generateFormCode('My Form', 'Submit', [makeTextarea({ required: true })])
    expect(code).toContain('bio: z.string().min(1, "This field is required")')
  })

  it('renders rows attribute in JSX', () => {
    const code = generateFormCode('My Form', 'Submit', [makeTextarea({ rows: 5 })])
    expect(code).toContain('rows={5}')
  })
})

describe('generateFormCode — checkbox field', () => {
  it('generates z.boolean().default(false) for optional checkbox', () => {
    const code = generateFormCode('My Form', 'Submit', [makeCheckbox()])
    expect(code).toContain('acceptTerms: z.boolean().default(false)')
  })

  it('generates .refine() with the correct predicate for required checkbox', () => {
    const code = generateFormCode('My Form', 'Submit', [makeCheckbox({ required: true })])
    // Checks the full predicate, not just the method name — ensures the generated
    // validation actually rejects unchecked boxes (val === false), not just any boolean.
    expect(code).toContain('z.boolean().refine((val) => val === true, "This field is required")')
  })
})

describe('generateFormCode — switch field', () => {
  it('generates z.boolean().default(false) for optional switch', () => {
    const code = generateFormCode('My Form', 'Submit', [makeSwitch()])
    expect(code).toContain('notifications: z.boolean().default(false)')
  })

  it('generates .refine() for required switch', () => {
    const code = generateFormCode('My Form', 'Submit', [makeSwitch({ required: true })])
    expect(code).toContain('notifications: z.boolean().refine')
  })
})

describe('generateFormCode — select field', () => {
  it('generates z.string() for optional select', () => {
    const code = generateFormCode('My Form', 'Submit', [makeSelect()])
    expect(code).toContain('country: z.string()')
  })

  it('adds .min(1) for required select', () => {
    const code = generateFormCode('My Form', 'Submit', [makeSelect({ required: true })])
    expect(code).toContain('country: z.string().min(1, "Please select an option")')
  })

  it('renders a SelectItem for each option', () => {
    const code = generateFormCode('My Form', 'Submit', [makeSelect()])
    expect(code).toContain('{ label: "USA", value: "usa" }')
    expect(code).toContain('{ label: "UK", value: "uk" }')
    expect(code).toContain('<SelectItem key={o.value} value={o.value}>')
  })

  // TDD: select fields have a disabled prop like all other field types.
  // Without this test the missing disabled prop in the select template goes unnoticed.
  it('renders disabled={true} in JSX when the select field is disabled', () => {
    const code = generateFormCode('My Form', 'Submit', [makeSelect({ disabled: true })])
    expect(code).toContain('disabled={true}')
  })
})

describe('generateFormCode — radio-group field', () => {
  it('generates z.string() for optional radio group', () => {
    const code = generateFormCode('My Form', 'Submit', [makeRadioGroup()])
    expect(code).toContain('gender: z.string()')
  })

  it('adds .min(1) for required radio group', () => {
    const code = generateFormCode('My Form', 'Submit', [makeRadioGroup({ required: true })])
    expect(code).toContain('gender: z.string().min(1, "Please select an option")')
  })

  it('renders a RadioGroupItem for each option', () => {
    const code = generateFormCode('My Form', 'Submit', [makeRadioGroup()])
    expect(code).toContain('{ label: "Male", value: "male" }')
    expect(code).toContain('{ label: "Female", value: "female" }')
    expect(code).toContain('<RadioGroupItem value={o.value}')
  })
})

describe('generateFormCode — imports', () => {
  it('always includes base react-hook-form and zod imports', () => {
    const code = generateFormCode('My Form', 'Submit', [makeInput()])
    expect(code).toContain('import { useForm, Controller } from "react-hook-form"')
    expect(code).toContain('import { z } from "zod"')
    expect(code).toContain('import { Button }')
  })

  it('includes Input import only when an input field is present', () => {
    const code = generateFormCode('My Form', 'Submit', [makeInput()])
    expect(code).toContain('import { Input }')
  })

  it('excludes Input import when no input field is present', () => {
    const code = generateFormCode('My Form', 'Submit', [makeTextarea()])
    expect(code).not.toContain('import { Input }')
  })

  it('includes Textarea import only when a textarea field is present', () => {
    const code = generateFormCode('My Form', 'Submit', [makeTextarea()])
    expect(code).toContain('import { Textarea }')
  })

  it('includes Checkbox import only when a checkbox field is present', () => {
    const code = generateFormCode('My Form', 'Submit', [makeCheckbox()])
    expect(code).toContain('import { Checkbox }')
  })

  it('includes Switch import only when a switch field is present', () => {
    const code = generateFormCode('My Form', 'Submit', [makeSwitch()])
    expect(code).toContain('import { Switch }')
  })

  it('includes Select imports only when a select field is present', () => {
    const code = generateFormCode('My Form', 'Submit', [makeSelect()])
    expect(code).toContain('import { Select,')
  })

  it('includes RadioGroup imports only when a radio-group field is present', () => {
    const code = generateFormCode('My Form', 'Submit', [makeRadioGroup()])
    expect(code).toContain('import { RadioGroup,')
  })

  it('includes only imports for the field types used', () => {
    const code = generateFormCode('My Form', 'Submit', [makeInput(), makeTextarea()])
    expect(code).toContain('import { Input }')
    expect(code).toContain('import { Textarea }')
    expect(code).not.toContain('import { Checkbox }')
    expect(code).not.toContain('import { Switch }')
    expect(code).not.toContain('import { Select,')
    expect(code).not.toContain('import { RadioGroup,')
  })
})

describe('generateFormCode — multiple fields', () => {
  it('includes all field schemas', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeInput({ name: 'email', inputType: 'email', required: true }),
      makeTextarea({ name: 'message', required: true }),
    ])
    expect(code).toContain('email: z.string().email')
    expect(code).toContain('message: z.string().min(1')
  })

  it('includes all field default values', () => {
    const code = generateFormCode('My Form', 'Submit', [
      makeInput({ name: 'email' }),
      makeCheckbox({ name: 'agree' }),
    ])
    expect(code).toContain('email: ""')
    expect(code).toContain('agree: false')
  })
})
