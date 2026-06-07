"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { codeToHtml } from "shiki"

interface CodeBlockProps {
  code: string
}

export function CodeBlock({ code }: CodeBlockProps) {
  const { resolvedTheme } = useTheme()
  const [html, setHtml] = useState("")

  useEffect(() => {
    let cancelled = false

    const theme =
      resolvedTheme === "dark" ? "github-dark-default" : "github-light"

    codeToHtml(code, { lang: "tsx", theme }).then((result) => {
      if (!cancelled) setHtml(result)
    })

    return () => {
      cancelled = true
    }
  }, [code, resolvedTheme])

  if (!html) {
    return (
      <pre className="p-4 font-mono text-xs leading-relaxed [font-variant-ligatures:none]">
        <code>{code}</code>
      </pre>
    )
  }

  return (
    <div
      className="[&_pre]:bg-transparent! [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-[1.7] [&_pre]:[font-variant-ligatures:none]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
