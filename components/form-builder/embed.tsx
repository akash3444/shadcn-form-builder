"use client"

import { useSyncExternalStore } from "react"
import { BlocksIcon, EyeIcon } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMediaQuery } from "@/hooks/use-media-query"
import { BuilderProvider } from "./builder-context"
import { FieldEditor } from "./editor"
import { FieldPalette } from "./palette"
import { FormPreview } from "./preview"

const subscribeNoop = () => () => {}

/**
 * Compact, responsive build of the form builder meant to be iframed into the
 * marketing page. It reuses the real builder panels (so it stays in sync with
 * the product) but drops the page header and adapts to narrow widths. The store
 * defaults to the "sign-up" preset, so it renders a real example, not a blank.
 *
 * The panels are mounted only on the client (see the `ready` gate) which avoids
 * a persist/SSR hydration mismatch from `useMediaQuery` and the persisted store.
 */
export function BuilderEmbed() {
  // `false` on the server and during hydration, `true` once on the client.
  const ready = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  )
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (!ready) {
    return (
      <div className="grid h-svh place-items-center bg-background text-sm text-muted-foreground">
        Loading builder…
      </div>
    )
  }

  return (
    <BuilderProvider embedded>
      <div className="flex h-svh flex-col overflow-hidden bg-background">
        {isDesktop ? (
          <div className="grid min-h-0 flex-1 grid-cols-[200px_320px_1fr] divide-x lg:grid-cols-[220px_360px_1fr]">
            <FieldPalette />
            <FieldEditor />
            <FormPreview />
          </div>
        ) : (
          <Tabs
            defaultValue="build"
            className="flex min-h-0 flex-1 flex-col gap-0"
          >
            <div className="shrink-0 border-b bg-sidebar px-3 py-2">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="build">
                  <BlocksIcon />
                  Build
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <EyeIcon />
                  Preview
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent
              value="build"
              className="mt-0 grid min-h-0 flex-1 grid-rows-[40%_60%] divide-y overflow-hidden"
            >
              <FieldPalette />
              <FieldEditor />
            </TabsContent>
            <TabsContent
              value="preview"
              className="mt-0 min-h-0 flex-1 overflow-hidden"
            >
              <FormPreview />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </BuilderProvider>
  )
}
