import type { Metadata } from "next"

import { BuilderEmbed } from "@/components/form-builder/embed"

export const metadata: Metadata = {
  title: "Builder preview · FormCanvas",
  description:
    "Embedded, interactive preview of the FormCanvas form builder.",
  robots: { index: false, follow: false },
}

export default function BuilderEmbedPage() {
  return <BuilderEmbed />
}
