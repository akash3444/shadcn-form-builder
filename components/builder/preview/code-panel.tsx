import { useMemo, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateFormCode } from "@/lib/form-builder/code-generator"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import { CodeBlock } from "./code-block"
import { CopyButton } from "./copy-button"

export function CodePanel() {
  const formName = useFormBuilderStore((s) => s.formName)
  const submitLabel = useFormBuilderStore((s) => s.submitLabel)
  const fields = useFormBuilderStore((s) => s.fields)
  const formLibrary = useFormBuilderStore((s) => s.formLibrary)
  const visibleFields = useMemo(() => fields.filter((f) => !f.hidden), [fields])
  const files = useMemo(
    () => generateFormCode(formName, submitLabel, visibleFields, formLibrary),
    [formName, submitLabel, visibleFields, formLibrary]
  )
  const [activeFilename, setActiveFilename] = useState<string | null>(null)
  const activeFile =
    files.find((f) => f.filename === activeFilename) ?? files[0]

  return (
    <>
      {files.length > 1 && (
        <div className="shrink-0 border-b bg-sidebar px-2 py-1.5">
          <Tabs value={activeFile.filename} onValueChange={setActiveFilename}>
            <TabsList variant="pill" size="sm" className="w-full justify-start">
              {files.map((file) => (
                <TabsTrigger
                  key={file.filename}
                  value={file.filename}
                  className="font-mono"
                >
                  {file.filename}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute top-2 right-4 z-10">
          <CopyButton code={activeFile.code} />
        </div>
        <div className="h-full overflow-auto">
          <CodeBlock code={activeFile.code} />
        </div>
      </div>
    </>
  )
}
