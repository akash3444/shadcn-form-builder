"use client"

import Link from "next/link"
import posthog from "posthog-js"
import { ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CtaButtonProps {
  location: string
  label?: string
  size?: "lg" | "default" | "sm"
  className?: string
}

export function CtaButton({
  location,
  label = "Open the builder",
  size = "lg",
  className,
}: CtaButtonProps) {
  return (
    <Button
      size={size}
      className={className}
      nativeButton={false}
      render={<Link href="/builder" />}
      onClick={() => posthog.capture("landing_cta_clicked", { location })}
    >
      {label}
      <ArrowRightIcon data-icon="inline-end" />
    </Button>
  )
}
