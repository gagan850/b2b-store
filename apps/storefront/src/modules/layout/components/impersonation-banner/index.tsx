"use client"

import { getImpersonation, Impersonation } from "@/lib/data/impersonation"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

/**
 * Shown to staff while they shop as a buyer. Sits at the top of the page,
 * shows who, why, access level and the time left, and ends itself when the
 * session expires. Nothing for normal customers.
 */
export default function ImpersonationBanner() {
  const [who, setWho] = useState<Impersonation | null>(null)
  const [left, setLeft] = useState<number | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    getImpersonation().then(setWho).catch(() => setWho(null))
  }, [pathname])

  useEffect(() => {
    if (!who?.expires_at) return
    const end = new Date(who.expires_at).getTime()
    const tick = () => {
      const ms = end - Date.now()
      setLeft(ms)
      if (ms <= 0) window.location.href = "/api/impersonate/exit"
    }
    tick()
    const t = window.setInterval(tick, 1000)
    return () => window.clearInterval(t)
  }, [who?.expires_at])

  if (!who) return null
  const canOrder = who.mode === "order"
  const low = left !== null && left < 5 * 60_000

  return (
    <div
      className="relative z-[60] border-b-2 border-amber-400 bg-neutral-900 text-white"
      role="status"
      data-testid="impersonation-banner"
    >
      <div className="content-container flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2 text-sm">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="rounded bg-amber-400 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-neutral-900">
            Staff session
          </span>
          <span className="truncate">
            Viewing as <strong>{who.customer}</strong>
            <span className="text-white/70"> · {who.company}</span>
          </span>
          <span
            className={`rounded border px-2 py-0.5 text-xs ${
              canOrder
                ? "border-amber-400/60 text-amber-300"
                : "border-white/30 text-white/80"
            }`}
          >
            {canOrder ? "Can place orders" : "View only"}
          </span>
          {who.reason && (
            <span className="hidden truncate text-white/60 small:inline">
              Reason: {who.reason}
            </span>
          )}
        </div>
        <div className="flex items-center gap-x-4">
          <span className="hidden text-white/70 xsmall:inline">
            Signed in as {who.staff}
          </span>
          {left !== null && (
            <span
              className={`font-mono text-xs ${low ? "text-red-300" : "text-white/70"}`}
              aria-label="Time left in this session"
            >
              {fmt(left)} left
            </span>
          )}
          {/* A plain link so the sign-out runs on the server */}
          <a
            href="/api/impersonate/exit"
            className="rounded bg-white px-3 py-1 font-semibold text-neutral-900 hover:bg-neutral-200"
          >
            End session
          </a>
        </div>
      </div>
    </div>
  )
}
