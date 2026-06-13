# Schema / Codegen Parity

## Overview

The live preview's validation and the generated code's validation must behave
identically. If they diverge, a user sees the form work one way in the builder
and get different validation errors after pasting the generated code.

Parity used to be maintained **by hand** across two files that re-implemented the
same logic. It is now **structural**: both derive from a single per-field spec.

| File | Role |
|---|---|
| `lib/form-builder/validation-spec.ts` | **Single source of truth.** Reduces a field to a serializable spec and interprets it two ways. |
| `lib/form-builder/schema.ts` | Builds the **live** Zod objects for the preview — delegates to the spec. |
| `lib/form-builder/code-generator.ts` | Emits the Zod schema **string** for the generated code — delegates to the spec. |

## How it works

`validation-spec.ts` exposes:

- `fieldSchemaSpec(field)` → a `SchemaSpec` (`{ base, ops, tail }`): the ordered
  list of validation rules for that field. **This is the only place validation
  rules, error messages, and ordering are defined.**
- `applySpec(spec)` → a live `z.ZodTypeAny` (used by `schema.ts`).
- `serializeSpec(spec)` → the equivalent Zod source string (used by codegen).
- `defaultValueFor(field)` → the field's effective default value (used by
  `schema.ts`).
- `serializeDefault(value)` → that value as a JS literal string (used by codegen).

Because `applySpec` and `serializeSpec` consume the **same** spec, the live
schema and the emitted string cannot drift.

## Making a change

- **Changing validation for a field type** (a rule, message, or ordering): edit
  `fieldSchemaSpec` (or its `stringSpec`/`arraySpec` helpers) in
  `validation-spec.ts`. Both consumers update automatically — do **not** add
  logic to `schema.ts` or `code-generator.ts`.
- **Adding a new rule kind**: add a variant to the `Op` union and handle it in
  **both** `applySpec` and `serializeSpec` (these are the two interpreters that
  must agree). Keep the live behavior and the serialized string equivalent.
- **Adding a new field type**: add its case to `fieldSchemaSpec` and
  `fieldTypeDefault`. The preview rendering and emitted JSX still live separately
  (`preview-form.tsx` and `generateFieldJSX` in `code-generator.ts`) — see
  `docs/guides/adding-a-field-type.md`.

## Verifying parity

There are no committed tests (the project is intentionally test-free). When
changing validation, verify the live preview and the generated code still agree
by exercising the affected field types in the builder and checking the emitted
schema string matches the preview's behavior.

## Gotchas

- `.default(false)` / `.default([])` in the live schema initialize RHF even
  without an explicit `defaultValues` entry. The generated code reproduces this
  by emitting an explicit `defaultValue` in `useForm` (via `serializeDefault`),
  not by relying on Zod's `.default()`.
- The optional-string min-length rule (`refineOptionalMin`) uses
  `v.length === 0 || v.length >= N`, allowing empty input but rejecting partial
  input. It is defined once as an `Op`.
- `slider` min/max carry no error message, so the spec emits `.min(n)` /
  `.max(n)` with no message argument. An empty/absent `message` on a `min`/`max`
  op is what selects that form.
- `combobox` validation branches on `field.multiple` (array vs string), handled
  inside `fieldSchemaSpec`'s combobox case.
