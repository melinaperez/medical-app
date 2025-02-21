"use client"

import type React from "react"

import { forwardRef } from "react"

interface ProtocolLinkProps {
  action?: string
  data?: Record<string, any>
  children: React.ReactNode
  className?: string
}

export const ProtocolLink = forwardRef<HTMLAnchorElement, ProtocolLinkProps>(
  ({ action, data, children, className, ...props }, ref) => {
    const buildProtocolUrl = () => {
      if (action) {
        return `prescriptionseeding://${encodeURIComponent(action)}`
      }
      if (data) {
        return `medapp://${encodeURIComponent(JSON.stringify(data))}`
      }
      return "#"
    }

    return (
      <a ref={ref} href={buildProtocolUrl()} className={className} {...props}>
        {children}
      </a>
    )
  },
)

ProtocolLink.displayName = "ProtocolLink"

