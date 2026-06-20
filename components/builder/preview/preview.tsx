"use client"

import posthog from "posthog-js"
import { useMemo, useState, type SVGProps } from "react"
import { Code2, Eye, RotateCcwIcon } from "lucide-react"
import { ReactHookForm, TanStack } from "@/components/icons"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import type { FormLibrary } from "@/lib/form-builder/types"
import { CodePanel } from "./code-panel"
import { PreviewForm } from "./preview-form"

const FORM_LIBRARY_OPTIONS: {
  label: string
  value: FormLibrary
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement
}[] = [
  {
    label: "React Hook Form",
    value: "react-hook-form",
    icon: ReactHookForm,
  },
  {
    label: "TanStack Form",
    value: "tanstack-form",
    icon: TanStack,
  },
]

function LibraryLogo({
  icon: Icon,
}: {
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement
}) {
  return <Icon aria-hidden className="size-4 shrink-0 object-contain" />
}

export function FormPreview() {
  const formName = useFormBuilderStore((s) => s.formName)
  const submitLabel = useFormBuilderStore((s) => s.submitLabel)
  const fields = useFormBuilderStore((s) => s.fields)
  const formLibrary = useFormBuilderStore((s) => s.formLibrary)
  const setFormLibrary = useFormBuilderStore((s) => s.setFormLibrary)
  const currentLibrary = FORM_LIBRARY_OPTIONS.find(
    (o) => o.value === formLibrary
  )
  // Hidden fields stay in the builder but are excluded from both the rendered
  // preview and the generated code
  const visibleFields = useMemo(() => fields.filter((f) => !f.hidden), [fields])

  const [tab, setTab] = useState("preview")
  // Bumping this remounts the previewed form, re-initializing it with fresh
  // default values — the same mechanism PreviewForm uses for field changes.
  const [resetKey, setResetKey] = useState(0)

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        setTab(value)
        if (value === "code") {
          posthog.capture("code_viewed", { form_library: formLibrary })
        }
      }}
      className="flex h-full flex-col gap-0 overflow-hidden"
    >
      <div className="flex shrink-0 items-center justify-between border-b bg-sidebar px-4 py-2">
        <TabsList>
          <TabsTrigger value="preview">
            <Eye />
            Preview
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code2 />
            Code
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          {tab === "preview" && visibleFields.length > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Reset form"
                    onClick={() => setResetKey((k) => k + 1)}
                    className="hit-area-2"
                  />
                }
              >
                <RotateCcwIcon
                  className="transition-transform duration-500 ease-out"
                  style={{ transform: `rotate(${resetKey * -360}deg)` }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset form values</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Select
            value={formLibrary}
            onValueChange={(value) => {
              posthog.capture("form_library_switched", {
                from_library: formLibrary,
                to_library: value,
              })
              setFormLibrary(value as FormLibrary)
            }}
            items={FORM_LIBRARY_OPTIONS}
          >
            <SelectTrigger size="sm" className="w-46">
              {currentLibrary && <LibraryLogo icon={currentLibrary.icon} />}
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORM_LIBRARY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <LibraryLogo icon={option.icon} />
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <TabsContent value="preview" className="m-0 flex-1 overflow-y-auto p-6">
        <PreviewForm
          formName={formName}
          submitLabel={submitLabel}
          fields={visibleFields}
          formLibrary={formLibrary}
          resetKey={resetKey}
        />
      </TabsContent>

      <TabsContent
        value="code"
        className="m-0 flex flex-1 flex-col overflow-hidden"
      >
        <CodePanel />
      </TabsContent>
    </Tabs>
  )
}
