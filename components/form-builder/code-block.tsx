"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import type { Highlighter } from "shiki"

const THEMES = ["github-dark-default", "github-light"] as const

// Load Shiki lazily (keeps it out of the initial bundle) and create a single
// highlighter with only the language and themes we use, reused across renders.
let highlighterPromise: Promise<Highlighter> | null = null
function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then((shiki) =>
      shiki.createHighlighter({ langs: ["tsx"], themes: [...THEMES] })
    )
  }
  return highlighterPromise
}

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

    getHighlighter().then((highlighter) => {
      if (cancelled) return
      setHtml(highlighter.codeToHtml(code, { lang: "tsx", theme }))
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
