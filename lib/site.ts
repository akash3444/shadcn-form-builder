function resolveSiteUrl(): string {
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelProduction) return `https://${vercelProduction.replace(/\/$/, "")}`

  return "http://localhost:3000"
}

export const siteUrl = resolveSiteUrl()
