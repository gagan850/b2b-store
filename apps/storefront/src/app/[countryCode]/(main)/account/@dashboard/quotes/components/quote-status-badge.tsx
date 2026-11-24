"use client"

const StatusTitles: Record<string, string> = {
  accepted: "Accepted",
  customer_rejected: "Customer Rejected",
  merchant_rejected: "Merchant Rejected",
  pending_merchant: "Pending Merchant",
  pending_customer: "Pending Customer",
}

// Colour coding shared across the store: chip-ok / chip-warn / chip-bad / chip-info
const StatusChip: Record<string, string> = {
  accepted: "chip-ok",
  customer_rejected: "chip-bad",
  merchant_rejected: "chip-bad",
  pending_merchant: "chip-warn",
  pending_customer: "chip-info",
}

export default function QuoteStatusBadge({ status }: { status: string }) {
  return (
    <span className={`chip ${StatusChip[status] ?? "chip-neutral"}`}>
      {StatusTitles[status] ?? status}
    </span>
  )
}
