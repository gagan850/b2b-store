"use client"

const StatusTitles: Record<string, string> = {
  accepted: "Accepted",
  customer_rejected: "Declined by you",
  merchant_rejected: "Declined by LK",
  pending_merchant: "Awaiting LK reply",
  pending_customer: "Ready for your review",
}

// Colour coding shared across the store: chip-ok / chip-warn / chip-bad / chip-info
const StatusChip: Record<string, string> = {
  accepted: "chip-ok",
  customer_rejected: "chip-bad",
  merchant_rejected: "chip-bad",
  pending_merchant: "chip-warn",
  pending_customer: "chip-info",
}

export default function QuoteStatusBadge({
  status,
  revision = false,
}: {
  status: string
  revision?: boolean
}) {
  const changes = revision && status === "customer_rejected"
  return (
    <span className={`chip ${changes ? "chip-warn" : StatusChip[status] ?? "chip-neutral"}`}>
      {changes ? "Changes requested" : StatusTitles[status] ?? status}
    </span>
  )
}
