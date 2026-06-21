import type { SchemaLibrary } from "../types"
import type { SchemaEmitter } from "./types"
import { zodEmitter } from "./zod"
import { valibotEmitter } from "./valibot"

// One emitter per Schema Library. Libraries without an emitter yet fall back to
// Zod via getEmitter, so the registry can grow one phase at a time.
const EMITTERS: Partial<Record<SchemaLibrary, SchemaEmitter>> = {
  zod: zodEmitter,
  valibot: valibotEmitter,
}

export function getEmitter(library: SchemaLibrary): SchemaEmitter {
  return EMITTERS[library] ?? zodEmitter
}

export type { SchemaEmitter }
