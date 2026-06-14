"use client"

import { createContext, useContext, type ReactNode } from "react"

interface BuilderContextValue {
  /**
   * Whether the builder is rendered as a passive showcase (e.g. the landing
   * page iframe) rather than as the primary editor at `/builder`. When true,
   * inputs don't grab focus on mount — otherwise focusing inside the iframe
   * yanks the marketing page down to the embed on load.
   */
  embedded: boolean
}

const BuilderContext = createContext<BuilderContextValue>({ embedded: false })

export function BuilderProvider({
  embedded,
  children,
}: {
  embedded: boolean
  children: ReactNode
}) {
  return (
    <BuilderContext.Provider value={{ embedded }}>
      {children}
    </BuilderContext.Provider>
  )
}

export function useBuilderContext() {
  return useContext(BuilderContext)
}
