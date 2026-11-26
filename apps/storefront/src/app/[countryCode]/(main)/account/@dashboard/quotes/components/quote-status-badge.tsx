"use client"

import { quoteStatus, toneClass } from "@/lib/util/status-labels"

export default function QuoteStatusBadge({
  status,
  revision = false,
}: {
  status: string
  revision?: boolean
}) {
  const s = quoteStatus(status, revision)
  return <span className={`chip ${toneClass[s.tone]}`}>{s.label}</span>
}
