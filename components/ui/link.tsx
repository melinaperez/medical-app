"use client"

import type React from "react"

import NextLink from "next/link"
import { forwardRef } from "react"
import type { LinkProps } from "next/link"

interface CustomLinkProps extends LinkProps {
  children: React.ReactNode
  className?: string
  external?: boolean
}

export const Link = forwardRef<HTMLAnchorElement, CustomLinkProps>(
  ({ href, children, className, external, ...props }, ref) => {
    // Verificar si el enlace es externo
    const isExternal = external || (typeof href === "string" && (href.startsWith("http") || href.startsWith("mailto:")))

    if (isExternal) {
      return (
        <a ref={ref} href={href as string} className={className} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      )
    }

    return (
      <NextLink ref={ref} href={href} className={className} {...props}>
        {children}
      </NextLink>
    )
  },
)

Link.displayName = "Link"

