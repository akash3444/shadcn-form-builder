"use client"

import { useMemo } from "react"
import { Code2, Eye } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { generateFormCode } from "@/lib/form-builder/code-generator"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import type { FormLibrary } from "@/lib/form-builder/types"
import { CodeBlock } from "./code-block"
import { CopyButton } from "./copy-button"
import { PreviewForm } from "./preview-form"

const FORM_LIBRARY_OPTIONS: {
  label: string
  value: FormLibrary
  icon: string
}[] = [
  {
    label: "React Hook Form",
    value: "react-hook-form",
    icon: "/images/rhf-logo.svg",
  },
  {
    label: "TanStack Form",
    value: "tanstack-form",
    icon: "/images/tanstack-logo.png",
  },
]

function LibraryLogo({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="size-4 shrink-0 object-contain" />
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
  const code = useMemo(
    () => generateFormCode(formName, submitLabel, fields, formLibrary),
    [formName, submitLabel, fields, formLibrary]
  )

  return (
    <Tabs
      defaultValue="preview"
      className="flex h-full flex-col overflow-hidden"
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

        <Select
          value={formLibrary}
          onValueChange={(value) => setFormLibrary(value as FormLibrary)}
          items={FORM_LIBRARY_OPTIONS}
        >
          <SelectTrigger size="sm" className="w-46">
            {currentLibrary && <LibraryLogo src={currentLibrary.icon} alt="" />}
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORM_LIBRARY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <LibraryLogo src={option.icon} alt="" />
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TabsContent value="preview" className="m-0 flex-1 overflow-y-auto p-6">
        <PreviewForm
          formName={formName}
          submitLabel={submitLabel}
          fields={fields}
          formLibrary={formLibrary}
        />
      </TabsContent>

      <TabsContent value="code" className="relative m-0 flex-1 overflow-hidden">
        <div className="absolute top-2 right-2 z-10">
          <CopyButton code={code} />
        </div>
        <div className="h-full overflow-auto">
          <CodeBlock code={code} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
