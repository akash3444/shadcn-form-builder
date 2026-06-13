"use client"

/**
 * TEST-ONLY harness. Renders the form-builder's *generated code string* as a
 * live React component, so end-to-end tests can drive the exact code we ship
 * (not a reimplementation of it).
 *
 * How it works:
 *  1. The app's real `generateFormCode()` produces a TSX module string.
 *  2. `@babel/standalone` transpiles that string with the SAME automatic JSX
 *     runtime Next.js uses, emitting CommonJS.
 *  3. A module map resolves each `import` (react-hook-form, zod, the real
 *     shadcn/ui components, …) to the already-bundled module on this page.
 *  4. The generated `onSubmit` sink (`console.log(values)`) is redirected to a
 *     global so the test can read the precise submitted payload.
 *
 * This route is gated to non-production in page.tsx.
 */

import * as React from "react"
import { useEffect, useState } from "react"

import * as JsxRuntime from "react/jsx-runtime"
import * as ReactHookForm from "react-hook-form"
import * as ZodResolver from "@hookform/resolvers/zod"
import * as Zod from "zod"

import * as ButtonMod from "@/components/ui/button"
import * as FieldMod from "@/components/ui/field"
import * as InputMod from "@/components/ui/input"
import * as TextareaMod from "@/components/ui/textarea"
import * as CheckboxMod from "@/components/ui/checkbox"
import * as SwitchMod from "@/components/ui/switch"
import * as SelectMod from "@/components/ui/select"
import * as RadioGroupMod from "@/components/ui/radio-group"
import * as SliderMod from "@/components/ui/slider"
import * as ComboboxMod from "@/components/ui/combobox"

import { generateFormCode } from "@/lib/form-builder/code-generator"
import type { FormField } from "@/lib/form-builder/types"

// Maps every module specifier the generator can emit to a real, bundled module.
const MODULES: Record<string, unknown> = {
  react: React,
  "react/jsx-runtime": JsxRuntime,
  "react/jsx-dev-runtime": JsxRuntime,
  "react-hook-form": ReactHookForm,
  "@hookform/resolvers/zod": ZodResolver,
  zod: Zod,
  "@/components/ui/button": ButtonMod,
  "@/components/ui/field": FieldMod,
  "@/components/ui/input": InputMod,
  "@/components/ui/textarea": TextareaMod,
  "@/components/ui/checkbox": CheckboxMod,
  "@/components/ui/switch": SwitchMod,
  "@/components/ui/select": SelectMod,
  "@/components/ui/radio-group": RadioGroupMod,
  "@/components/ui/slider": SliderMod,
  "@/components/ui/combobox": ComboboxMod,
}

let babelPromise: Promise<typeof import("@babel/standalone")> | null = null
function loadBabel() {
  if (!babelPromise) babelPromise = import("@babel/standalone")
  return babelPromise
}

async function compileToComponent(code: string): Promise<React.ComponentType> {
  const Babel = await loadBabel()

  // Redirect the generated submit sink so tests can capture the payload.
  const redirected = code.replace(
    /console\.log\(values\)/g,
    "globalThis.__onFormSubmit(values)"
  )

  // Presets run in REVERSE, so this strips types (typescript) and then compiles
  // JSX with the classic runtime (react) -> `React.createElement(...)`, which
  // references a free `React` we inject into scope below. The commonjs plugin
  // converts the ESM imports to `require()` calls our shim resolves. Using the
  // classic runtime sidesteps the injected jsx-runtime import entirely.
  const result = Babel.transform(redirected, {
    filename: "GeneratedForm.tsx",
    presets: ["react", ["typescript", { allExtensions: true, isTSX: true }]],
    plugins: ["transform-modules-commonjs"],
  })

  const transpiled = result.code
  if (!transpiled) throw new Error("Babel produced no output")

  const mod = { exports: {} as Record<string, unknown> }
  const requireShim = (name: string) => {
    if (name in MODULES) return MODULES[name]
    throw new Error(`Harness: unmocked import "${name}"`)
  }

  const factory = new Function("require", "module", "exports", "React", transpiled)
  factory(requireShim, mod, mod.exports, React)

  const Component = Object.values(mod.exports).find(
    (v) => typeof v === "function"
  ) as React.ComponentType | undefined

  if (!Component) throw new Error("Generated module exported no component")
  return Component
}

interface RenderConfig {
  formName: string
  submitLabel: string
  fields: FormField[]
}

class RenderBoundary extends React.Component<
  { children: React.ReactNode; onError: (msg: string) => void },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error) {
    this.props.onError(error.message)
  }
  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

export function FormHarness() {
  const [Component, setComponent] = useState<React.ComponentType | null>(null)
  const [error, setError] = useState("")
  // Bump on every render request so the form (and its internal RHF state) fully
  // remounts between scenarios.
  const [renderKey, setRenderKey] = useState(0)

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>

    function reset() {
      setError("")
      w.__lastSubmit = undefined
    }

    async function mount(code: string) {
      reset()
      try {
        const Comp = await compileToComponent(code)
        setRenderKey((k) => k + 1)
        setComponent(() => Comp)
      } catch (e) {
        setComponent(null)
        setError(e instanceof Error ? e.message : String(e))
      }
    }

    // Capture the generated form's submit payload.
    w.__onFormSubmit = (values: unknown) => {
      w.__lastSubmit = values
    }

    // Generate code from a builder config via the REAL generator, then render.
    w.__renderConfig = (config: RenderConfig) => {
      const code = generateFormCode(
        config.formName,
        config.submitLabel,
        config.fields
      )
      return mount(code)
    }

    w.__harnessReady = true

    return () => {
      delete w.__renderConfig
      delete w.__onFormSubmit
      delete w.__harnessReady
    }
  }, [])

  return (
    <div className="mx-auto max-w-xl p-8">
      {error ? (
        <pre data-testid="harness-error" className="text-destructive">
          {error}
        </pre>
      ) : null}
      <div data-testid="form-container">
        {Component ? (
          <RenderBoundary key={renderKey} onError={setError}>
            <Component />
          </RenderBoundary>
        ) : null}
      </div>
    </div>
  )
}
