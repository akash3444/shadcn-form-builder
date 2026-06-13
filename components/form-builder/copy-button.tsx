"use client"

import { CheckIcon, CopyIcon } from "lucide-react"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { Button } from "@/components/ui/button"
import { ComponentProps } from "react"

interface CopyButtonProps extends ComponentProps<typeof Button> {
  code: string
}

export function CopyButton({ code, ...props }: CopyButtonProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => copyToClipboard(code)}
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
