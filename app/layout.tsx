import type { Metadata } from "next"
import { Geist_Mono, Space_Grotesk } from "next/font/google"

import { Toaster } from "sonner"

import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { siteUrl } from "@/lib/site"
import { cn } from "@/lib/utils"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const ogImage = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "FormCanvas — build forms visually, ship production code",
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "FormCanvas",
    url: "/",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    images: [ogImage],
  },
  verification: {
    google: "-oWXmoSj7TQWR7fAnjmE4NkPkCnCw15fdkMWyAmD3CQ",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "scroll-smooth antialiased",
        fontMono.variable,
        "font-sans",
        spaceGrotesk.variable
      )}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider delay={300}>{children}</TooltipProvider>
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
