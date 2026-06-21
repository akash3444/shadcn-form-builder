"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/**
 * Returns `false` on the server and during the first client render, then `true`
 * once mounted on the client.
 *
 * Gate any UI that depends on client-only state behind this — most importantly
 * the persisted Zustand store. The store rehydrates from `localStorage`
 * synchronously on the client, but the server has no access to it, so server
 * HTML reflects the default state. Rendering that store state straight away
 * makes the browser paint the defaults and then snap to the persisted values a
 * frame later (a visible flicker). Holding store-dependent content until this
 * flips to `true` keeps the first paint consistent with the server and lets the
 * persisted values appear in their place instead of after them.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
