"use client"

import { getImpersonation, Impersonation } from "@/lib/data/impersonation"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

/** Shown to staff while they shop as a buyer. Nothing for normal customers. */
export default function ImpersonationBanner() {
  const [who, setWho] = useState<Impersonation | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    getImpersonation().then(setWho).catch(() => setWho(null))
  }, [pathname])

  if (!who) return null

  return (
    <div className="bg-red-700 text-white" role="status" data-testid="impersonation-banner">
      <div className="content-container flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-sm">
        <p>
          <strong>Viewing as {who.customer}</strong> ({who.company}). You are
          signed in as staff member {who.staff}. Orders placed here are marked
          as placed on their behalf.
        </p>
        {/* A plain link so the sign-out runs on the server */}
        <a
          href="/api/impersonate/exit"
          className="rounded border border-white/60 px-3 py-1 font-semibold hover:bg-white/10"
        >
          Exit
        </a>
      </div>
    </div>
  )
}
