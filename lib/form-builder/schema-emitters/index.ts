import type { SchemaLibrary } from "../types"
import type { SchemaEmitter } from "./types"
import { zodEmitter } from "./zod"
import { valibotEmitter } from "./valibot"
import { arktypeEmitter } from "./arktype"

// One emitter per Schema Library.
const EMITTERS: Record<SchemaLibrary, SchemaEmitter> = {
  zod: zodEmitter,
  valibot: valibotEmitter,
  arktype: arktypeEmitter,
}

export function getEmitter(library: SchemaLibrary): SchemaEmitter {
  return EMITTERS[library] ?? zodEmitter
}

export type { SchemaEmitter }
