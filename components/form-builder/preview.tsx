"use client"

import { useFormBuilderStore } from "@/lib/form-builder/store"
import { generateFormCode } from "@/lib/form-builder/code-generator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CopyButton } from "./copy-button"
import { PreviewForm } from "./preview-form"

export function FormPreview() {
  const { formName, submitLabel, fields } = useFormBuilderStore()
  const code = generateFormCode(formName, submitLabel, fields)

  return (
    <Tabs defaultValue="preview" className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
        <TabsList>
          <TabsTrigger value="preview" className="text-xs">
            Preview
          </TabsTrigger>
          <TabsTrigger value="code" className="text-xs">
            Code
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="code"
          className="m-0 mt-0 flex items-center justify-end"
        >
          <CopyButton code={code} />
        </TabsContent>
      </div>

      <TabsContent value="preview" className="m-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            <PreviewForm
              formName={formName}
              submitLabel={submitLabel}
              fields={fields}
            />
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="code" className="m-0 flex-1 overflow-hidden">
        <pre className="p-4 font-mono text-xs leading-relaxed">
          <code>{code}</code>
        </pre>
      </TabsContent>
    </Tabs>
  )
}
