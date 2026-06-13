import { test, expect } from "@playwright/test"
import { Harness } from "../helpers/harness"
import { oneField, combobox } from "../helpers/fields"

const FRAMEWORKS: [string, string][] = [
  ["React", "react"],
  ["Vue", "vue"],
  ["Svelte", "svelte"],
  ["Angular", "angular"],
]

/**
 * Combobox field — a searchable option picker. Two orthogonal axes:
 *   multiple (single | multiple)  ×  displayStyle (input | trigger)
 * = the 4 render branches exercised below, plus the shared settings (label,
 * placeholder, description, default, required) and affordances (search text,
 * empty text, clearable).
 */
test.describe("combobox field", () => {
  test.describe("label", () => {
    test("renders the configured label", async ({ page }) => {
      const h = new Harness(page)
      await h.render(oneField(combobox("fw", "Framework", FRAMEWORKS)))
      await h.expectLabel("Framework")
    })
  })

  test.describe("placeholder", () => {
    test("input style: custom placeholder on the input", async ({ page }) => {
      const h = new Harness(page)
      await h.render(
        oneField(combobox("fw", "Framework", FRAMEWORKS, { placeholder: "Pick one" }))
      )
      await h.expectPlaceholder("fw", "Pick one")
    })

    test("input style: falls back to 'Select an option'", async ({ page }) => {
      const h = new Harness(page)
      await h.render(oneField(combobox("fw", "Framework", FRAMEWORKS)))
      await h.expectPlaceholder("fw", "Select an option")
    })

    test("trigger style: shows placeholder when nothing chosen", async ({ page }) => {
      const h = new Harness(page)
      await h.render(
        oneField(
          combobox("fw", "Framework", FRAMEWORKS, {
            displayStyle: "trigger",
            placeholder: "Choose framework",
          })
        )
      )
      expect(await h.comboboxTriggerText("fw")).toContain("Choose framework")
    })
  })

  test.describe("description position", () => {
    test("renders ABOVE the control when configured", async ({ page }) => {
      const h = new Harness(page)
      await h.render(
        oneField(
          combobox("fw", "Framework", FRAMEWORKS, {
            description: "Above",
            descriptionPosition: "above-control",
          })
        )
      )
      expect(await h.descriptionIsAbove("#fw")).toBe(true)
    })

    test("renders BELOW the control when configured", async ({ page }) => {
      const h = new Harness(page)
      await h.render(
        oneField(
          combobox("fw", "Framework", FRAMEWORKS, {
            description: "Below",
            descriptionPosition: "below-control",
          })
        )
      )
      expect(await h.descriptionIsAbove("#fw")).toBe(false)
    })
  })

  // §6.1 single + input
  test.describe("single + input", () => {
    test("typing filters the option list by label", async ({ page }) => {
      const h = new Harness(page)
      await h.render(oneField(combobox("fw", "Framework", FRAMEWORKS)))
      await h.comboboxOpen("fw")
      await h.comboboxFilter("vu")
      expect(await h.comboboxOptionLabels()).toEqual(["Vue"])
    })

    test("choosing an option fills the input and submits its value", async ({ page }) => {
      const h = new Harness(page)
      await h.render(oneField(combobox("fw", "Framework", FRAMEWORKS)))
      await h.comboboxPick("fw", "Svelte")
      expect(await h.comboboxInputValue("fw")).toBe("Svelte")
      await h.submit()
      expect(await h.submittedValues()).toEqual({ fw: "svelte" })
    })
  })

  // §6.2 single + trigger
  test.describe("single + trigger", () => {
    test("popup search filters and the trigger reflects the choice", async ({ page }) => {
      const h = new Harness(page)
      await h.render(
        oneField(combobox("fw", "Framework", FRAMEWORKS, { displayStyle: "trigger" }))
      )
      await h.comboboxOpen("fw")
      await h.comboboxFilter("ang")
      expect(await h.comboboxOptionLabels()).toEqual(["Angular"])
      await h.comboboxChoose("Angular")
      expect(await h.comboboxTriggerText("fw")).toContain("Angular")
      await h.submit()
      expect(await h.submittedValues()).toEqual({ fw: "angular" })
    })

    test("search input uses the configured searchPlaceholder", async ({ page }) => {
      const h = new Harness(page)
      await h.render(
        oneField(
          combobox("fw", "Framework", FRAMEWORKS, {
            displayStyle: "trigger",
            searchPlaceholder: "Type to find…",
          })
        )
      )
      await h.comboboxOpen("fw")
      await expect(
        page.locator('[data-slot="combobox-content"] input')
      ).toHaveAttribute("placeholder", "Type to find…")
    })
  })

  // §6.3 multiple + input (chips)
  test.describe("multiple + input (chips)", () => {
    test("selected options appear as chips and submit as an array", async ({ page }) => {
      const h = new Harness(page)
      await h.render(
        oneField(combobox("fw", "Frameworks", FRAMEWORKS, { multiple: true }))
      )
      await h.comboboxOpen("fw")
      await h.comboboxChoose("React")
      await h.comboboxChoose("Vue")
      await h.comboboxClose()
      expect(await h.comboboxChips("fw")).toEqual(["React", "Vue"])
      await h.submit()
      expect(await h.submittedValues()).toEqual({ fw: ["react", "vue"] })
    })

    test("removing a chip drops that value", async ({ page }) => {
      const h = new Harness(page)
      await h.render(
        oneField(
          combobox("fw", "Frameworks", FRAMEWORKS, {
            multiple: true,
            defaultValue: ["react", "vue"],
          })
        )
      )
      await h.comboboxRemoveChip("React")
      expect(await h.comboboxChips("fw")).toEqual(["Vue"])
      await h.submit()
      expect(await h.submittedValues()).toEqual({ fw: ["vue"] })
    })
  })

  // §6.4 multiple + trigger
  test.describe("multiple + trigger", () => {
    test("trigger summarizes the count and submits the array", async ({ page }) => {
      const h = new Harness(page)
      await h.render(
        oneField(
          combobox("fw", "Frameworks", FRAMEWORKS, {
            multiple: true,
            displayStyle: "trigger",
          })
        )
      )
      await h.comboboxOpen("fw")
      await h.comboboxChoose("React")
      await h.comboboxChoose("Svelte")
      await h.comboboxClose()
      expect(await h.comboboxTriggerText("fw")).toContain("2 selected")
      await h.submit()
      expect(await h.submittedValues()).toEqual({ fw: ["react", "svelte"] })
    })
  })

  test.describe("empty state", () => {
    test("shows the configured emptyText when nothing matches", async ({ page }) => {
      const h = new Harness(page)
      await h.render(
        oneField(
          combobox("fw", "Framework", FRAMEWORKS, { emptyText: "Nothing here." })
        )
      )
      await h.comboboxOpen("fw")
      await h.comboboxFilter("zzzz")
      expect(await h.comboboxEmptyVisible("Nothing here.")).toBe(true)
    })
  })

  test.describe("clearable", () => {
    test("absent by default; present and resets when enabled", async ({ page }) => {
      const h = new Harness(page)
      await h.render(oneField(combobox("fw", "Framework", FRAMEWORKS)))
      expect(await h.comboboxClearCount()).toBe(0)

      const h2 = new Harness(page)
      await h2.render(
        oneField(
          combobox("fw", "Framework", FRAMEWORKS, {
            clearable: true,
            defaultValue: "react",
          })
        )
      )
      expect(await h2.comboboxClearCount()).toBeGreaterThan(0)
      expect(await h2.comboboxInputValue("fw")).toBe("React")
      await h2.comboboxClear()
      expect(await h2.comboboxInputValue("fw")).toBe("")
      await h2.submit()
      expect(await h2.submittedValues()).toEqual({ fw: "" })
    })
  })

  test.describe("default value", () => {
    test("single: preselects and submits the default", async ({ page }) => {
      const h = new Harness(page)
      await h.render(
        oneField(combobox("fw", "Framework", FRAMEWORKS, { defaultValue: "vue" }))
      )
      expect(await h.comboboxInputValue("fw")).toBe("Vue")
      await h.submit()
      expect(await h.submittedValues()).toEqual({ fw: "vue" })
    })

    test("multiple: preselects the defaults as chips", async ({ page }) => {
      const h = new Harness(page)
      await h.render(
        oneField(
          combobox("fw", "Frameworks", FRAMEWORKS, {
            multiple: true,
            defaultValue: ["svelte", "angular"],
          })
        )
      )
      expect(await h.comboboxChips("fw")).toEqual(["Svelte", "Angular"])
    })
  })

  test.describe("required", () => {
    test("single: blocks empty submit, then passes once chosen", async ({ page }) => {
      const h = new Harness(page)
      await h.render(
        oneField(combobox("fw", "Framework", FRAMEWORKS, { required: true }))
      )
      await h.expectRequiredMark(true)
      await h.submit()
      await h.expectError("Please select an option")
      await h.expectNoSubmit()

      await h.comboboxPick("fw", "React")
      await h.submit()
      expect(await h.submittedValues()).toEqual({ fw: "react" })
    })

    test("multiple: blocks empty submit with the array message", async ({ page }) => {
      const h = new Harness(page)
      await h.render(
        oneField(
          combobox("fw", "Frameworks", FRAMEWORKS, {
            multiple: true,
            required: true,
          })
        )
      )
      await h.submit()
      await h.expectError("Select at least one option")
      await h.expectNoSubmit()

      await h.comboboxOpen("fw")
      await h.comboboxChoose("Vue")
      await h.comboboxClose()
      await h.submit()
      expect(await h.submittedValues()).toEqual({ fw: ["vue"] })
    })

    test("optional: no asterisk and empty submit is allowed", async ({ page }) => {
      const h = new Harness(page)
      await h.render(oneField(combobox("fw", "Framework", FRAMEWORKS)))
      await h.expectRequiredMark(false)
      await h.submit()
      expect(await h.submittedValues()).toEqual({ fw: "" })
    })
  })
})
