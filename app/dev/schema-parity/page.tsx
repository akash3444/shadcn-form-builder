import type { Metadata } from "next"

import { ParityInspector } from "./parity-inspector"

export const metadata: Metadata = {
  title: "Schema parity · FormCanvas",
  description:
    "Internal inspection page: compare the Zod, Valibot and ArkType schema emitters against the live preview oracle across every field variation.",
}

export default function ParityPage() {
  return <ParityInspector />
}
