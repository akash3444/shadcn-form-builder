"use client"

import { useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateFormCode } from "@/lib/form-builder/code-generator"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import { CodeBlock } from "./code-block"
import { CopyButton } from "./copy-button"
import { PreviewForm } from "./preview-form"

export function FormPreview() {
  const formName = useFormBuilderStore((s) => s.formName)
  const submitLabel = useFormBuilderStore((s) => s.submitLabel)
  const fields = useFormBuilderStore((s) => s.fields)
  const code = useMemo(
    () => generateFormCode(formName, submitLabel, fields),
    [formName, submitLabel, fields]
  )

  return (
    <Tabs
      defaultValue="preview"
      className="flex h-full flex-col overflow-hidden"
    >
      <div className="flex shrink-0 items-center justify-between border-b bg-sidebar px-4 py-2">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>

        <TabsContent
          value="code"
          className="m-0 mt-0 flex items-center justify-end"
        >
          <CopyButton code={code} />
        </TabsContent>
      </div>

      <TabsContent value="preview" className="m-0 flex-1 overflow-y-auto p-6">
        <PreviewForm
          formName={formName}
          submitLabel={submitLabel}
          fields={fields}
        />
      </TabsContent>

      <TabsContent value="code" className="m-0 flex-1 overflow-auto">
        <CodeBlock code={code} />
      </TabsContent>
    </Tabs>
  )
}
