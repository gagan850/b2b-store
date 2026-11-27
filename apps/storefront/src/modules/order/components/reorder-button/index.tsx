"use client"

import { reorderOrder } from "@/lib/data/reorder"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

/** "Order again": refills the cart from a past order, then opens the cart. */
export default function ReorderButton({
  orderId,
  className = "",
}: {
  orderId: string
  className?: string
}) {
  const { countryCode } = useParams<{ countryCode: string }>()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const go = async () => {
    setBusy(true)
    setNote(null)
    try {
      const r = await reorderOrder(orderId, countryCode)
      if (r.skipped.length) {
        setNote(`Not available any more: ${r.skipped.join(", ")}`)
      }
      if (r.added > 0) router.push(`/${countryCode}/cart`)
    } catch {
      setNote("Could not add these items. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        data-testid="reorder-button"
        className={`rounded-md bg-brand-blue px-4 py-2 text-xs font-semibold text-white hover:bg-brand-navy disabled:opacity-60 ${className}`}
      >
        {busy ? "Adding…" : "Order again"}
      </button>
      {note && <span className="max-w-xs text-xs text-red-600">{note}</span>}
    </span>
  )
}
