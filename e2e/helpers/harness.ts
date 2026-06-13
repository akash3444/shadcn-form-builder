import { expect, type Page } from "@playwright/test"
import type { FormField } from "../../lib/form-builder/types"

export interface FormConfig {
  formName: string
  submitLabel: string
  fields: FormField[]
}

/**
 * Page object for the test-only `/__form-harness__` route. It generates form
 * code with the app's real generator, renders it live, and exposes helpers to
 * drive the rendered controls and read the submitted payload.
 */
export class Harness {
  constructor(private readonly page: Page) {}

  /** Generate code for `config` via the real generator and render it. */
  async render(config: FormConfig) {
    const page = this.page
    await page.goto("/form-harness")
    await page.waitForFunction(() => (window as Win).__harnessReady === true)
    await page.evaluate((cfg) => (window as Win).__renderConfig!(cfg), config)
    await this.assertCompiled()
  }

  private async assertCompiled() {
    // Surface compile/render errors with their actual message.
    const err = this.page.getByTestId("harness-error")
    if (await err.count()) {
      const text = await err.textContent()
      throw new Error(`Harness failed to render generated code: ${text}`)
    }
    await expect(this.page.locator('[data-testid="form-container"] form')).toBeVisible()
  }

  // --- control drivers (keyed by field `name`, which is the control's id) ---

  text(name: string, value: string) {
    return this.page.locator(`#${name}`).fill(value)
  }

  // base-ui checkbox/switch render the id on a hidden native input (which
  // mirrors checked state) and the visible control as a sibling element. The
  // associated <label for="name"> is the faithful click target.
  async setBoolean(name: string, checked: boolean) {
    const input = this.page.locator(`#${name}`)
    const isChecked = await input.isChecked()
    if (isChecked !== checked) await this.page.locator(`label[for="${name}"]`).click()
  }

  async selectOption(name: string, optionLabel: string) {
    await this.page.locator(`#${name}`).click()
    await this.page.getByRole("option", { name: optionLabel, exact: true }).click()
  }

  radio(name: string, value: string) {
    return this.page.locator(`label[for="${name}-${value}"]`).click()
  }

  toggleGroupOption(name: string, value: string) {
    return this.page.locator(`label[for="${name}-${value}"]`).click()
  }

  /** The form's submit button. */
  submit() {
    return this.page.locator('[data-testid="form-container"] button[type="submit"]').click()
  }

  // --- assertions / reads ---

  /** Wait for a successful submit and return the captured (typed) payload. */
  async submittedValues<T = Record<string, unknown>>(): Promise<T> {
    await this.page.waitForFunction(
      () => (window as Win).__lastSubmit !== undefined
    )
    return this.page.evaluate(() => (window as Win).__lastSubmit as T)
  }

  /** Assert the form did NOT submit (validation blocked it). */
  async expectNoSubmit() {
    const value = await this.page.evaluate(() => (window as Win).__lastSubmit)
    expect(value, "form should not have submitted").toBeUndefined()
  }

  expectError(message: string | RegExp) {
    // Scope to the rendered form: the hidden generated-code <pre> also contains
    // these zod message strings as source text.
    return expect(
      this.page
        .locator('[data-testid="form-container"]')
        .getByText(message)
        .first(),
      `expected validation error: ${message}`
    ).toBeVisible()
  }

  // --- per-setting assertion helpers (used by the per-field setting specs) ---

  /** The rendered form root (scopes locators away from any sibling panels). */
  form() {
    return this.page.locator('[data-testid="form-container"]')
  }

  /** Assert a `<FieldLabel>`/`<FieldLegend>` with this text is visible. */
  expectLabel(text: string) {
    return expect(
      this.form()
        .locator('[data-slot="field-label"], [data-slot="field-legend"]')
        .filter({ hasText: text })
        .first()
    ).toBeVisible()
  }

  /** Assert the required asterisk is (or is not) present. */
  async expectRequiredMark(present: boolean) {
    const star = this.form().locator("span.text-destructive", { hasText: "*" })
    if (present) await expect(star.first()).toBeVisible()
    else await expect(star).toHaveCount(0)
  }

  /** Assert a control's `placeholder` attribute. */
  expectPlaceholder(name: string, text: string) {
    return expect(this.page.locator(`#${name}`)).toHaveAttribute("placeholder", text)
  }

  /** Assert a `<FieldDescription>` with this text is visible. */
  expectDescription(text: string) {
    return expect(
      this.form().locator('[data-slot="field-description"]', { hasText: text })
    ).toBeVisible()
  }

  /**
   * Resolve whether the field description renders visually ABOVE the given
   * control (true) or below it (false). Uses on-screen geometry, which is what
   * "description position" actually means to a user.
   */
  async descriptionIsAbove(controlSelector: string): Promise<boolean> {
    const desc = await this.form()
      .locator('[data-slot="field-description"]')
      .first()
      .boundingBox()
    const ctrl = await this.page.locator(controlSelector).first().boundingBox()
    if (!desc || !ctrl) throw new Error("description-position: missing bounding box")
    return desc.y < ctrl.y
  }

  /** Read a text/number control's current value. */
  inputValue(name: string) {
    return this.page.locator(`#${name}`).inputValue()
  }

  /** Read a checkbox/switch checked state. */
  isChecked(name: string) {
    return this.page.locator(`#${name}`).isChecked()
  }

  /** The visible text of a select trigger. */
  selectTriggerText(name: string) {
    return this.page.locator(`#${name}`).textContent()
  }

  // --- combobox drivers ---
  //
  // The control with id=`name` is the input (input/chips styles) or the trigger
  // button (trigger style). Clicking it opens the popup and focuses the relevant
  // filter input in every variant, so these helpers are style-agnostic.

  /** Open a combobox popup. */
  async comboboxOpen(name: string) {
    await this.page.locator(`#${name}`).click()
    await expect(
      this.page.locator('[data-slot="combobox-content"]')
    ).toBeVisible()
  }

  /** Type into the focused combobox filter input (popup must be open). */
  comboboxFilter(text: string) {
    return this.page.keyboard.type(text)
  }

  /** Labels of the currently-visible options. */
  async comboboxOptionLabels(): Promise<string[]> {
    const items = this.page.locator('[data-slot="combobox-item"]')
    return (await items.allTextContents()).map((t) => t.trim()).filter(Boolean)
  }

  /** Whether the empty-state message is visible. */
  comboboxEmptyVisible(text: string | RegExp) {
    return this.page
      .locator('[data-slot="combobox-empty"]')
      .filter({ hasText: text })
      .isVisible()
  }

  /** Click a visible option by its exact label (popup already open). */
  async comboboxChoose(optionLabel: string) {
    await this.page
      .locator('[data-slot="combobox-item"]')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(optionLabel)}\\s*$`) })
      .first()
      .click()
  }

  /** Close an open combobox popup (multiple mode keeps it open after a pick). */
  async comboboxClose() {
    await this.page.keyboard.press("Escape")
    await expect(
      this.page.locator('[data-slot="combobox-content"]')
    ).toBeHidden()
  }

  /** Open and choose an option by its exact label (single-pick convenience). */
  async comboboxPick(name: string, optionLabel: string) {
    await this.comboboxOpen(name)
    await this.comboboxChoose(optionLabel)
  }

  /** Selected chip labels (multiple + input style). */
  async comboboxChips(name: string): Promise<string[]> {
    void name
    const chips = this.form().locator('[data-slot="combobox-chip"]')
    return (await chips.allTextContents()).map((t) => t.trim()).filter(Boolean)
  }

  /** Remove a single chip by its label (multiple + input style). */
  comboboxRemoveChip(label: string) {
    return this.form()
      .locator('[data-slot="combobox-chip"]')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`) })
      .locator('[data-slot="combobox-chip-remove"]')
      .click()
  }

  /** Whether a clear (×) affordance is present. */
  comboboxClearCount() {
    return this.page.locator('[data-slot="combobox-clear"]').count()
  }

  /** Click the clear (×) affordance. */
  comboboxClear() {
    return this.page.locator('[data-slot="combobox-clear"]').first().click()
  }

  /** The text shown in a trigger-style combobox. */
  comboboxTriggerText(name: string) {
    return this.page.locator(`#${name}`).textContent()
  }

  /** The input value of an input-style combobox (its selected label). */
  comboboxInputValue(name: string) {
    return this.page.locator(`#${name}`).inputValue()
  }

  /**
   * Resolve whether two options of a radio/checkbox group are laid out
   * horizontally (side by side) or vertically (stacked), from on-screen
   * geometry. This is what the `orientation` setting controls.
   */
  async optionsLayout(
    name: string,
    v1: string,
    v2: string
  ): Promise<"horizontal" | "vertical"> {
    const a = await this.page.locator(`label[for="${name}-${v1}"]`).boundingBox()
    const b = await this.page.locator(`label[for="${name}-${v2}"]`).boundingBox()
    if (!a || !b) throw new Error("options-layout: missing bounding box")
    return b.y > a.y + a.height / 2 ? "vertical" : "horizontal"
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

type Win = Window & {
  __harnessReady?: boolean
  __renderConfig?: (config: FormConfig) => Promise<void>
  __lastSubmit?: unknown
}
