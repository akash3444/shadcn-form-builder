import type { MetadataRoute } from "next"

import { siteUrl } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: {
    path: string
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
    priority: number
  }[] = [
    { path: "/", changeFrequency: "monthly", priority: 1 },
    { path: "/builder", changeFrequency: "weekly", priority: 0.9 },
    { path: "/changelog", changeFrequency: "weekly", priority: 0.6 },
    { path: "/roadmap", changeFrequency: "weekly", priority: 0.6 },
  ]

  const lastModified = new Date()

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
}
