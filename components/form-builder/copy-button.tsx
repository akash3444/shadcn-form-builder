"use client"

import posthog from "posthog-js"
import { CheckIcon, CopyIcon } from "lucide-react"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { Button } from "@/components/ui/button"
import { useFormBuilderStore } from "@/lib/form-builder/store"
import { ComponentProps } from "react"

interface CopyButtonProps extends ComponentProps<typeof Button> {
  code: string
}

export function CopyButton({ code, ...props }: CopyButtonProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard()
  const formLibrary = useFormBuilderStore((s) => s.formLibrary)

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        copyToClipboard(code)
        posthog.capture("code_copied", {
          form_library: formLibrary,
          code_length: code.length,
        })
      }}
      {...props}
    >
      {isCopied ? (
        <>
          <CheckIcon className="text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <CopyIcon />
          Copy code
        </>
      )}
    </Button>
  )
}
