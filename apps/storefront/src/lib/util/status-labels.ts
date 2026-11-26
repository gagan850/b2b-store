/**
 * One wording for every status in the store. Neutral, professional, no "we",
 * "us" or "you". Keep admin/lib/status-labels.ts in step with this file.
 */
export type Tone = "ok" | "warn" | "bad" | "info" | "neutral"

export const quoteStatus = (status: string, revision = false): { label: string; tone: Tone } => {
  if (revision && status === "customer_rejected") return { label: "Revision Requested", tone: "warn" }
  switch (status) {
    case "pending_merchant":
      return { label: "Under Review", tone: "warn" }
    case "pending_customer":
      return { label: "Quote Issued", tone: "info" }
    case "accepted":
      return { label: "Accepted", tone: "ok" }
    case "customer_rejected":
      return { label: "Declined", tone: "neutral" }
    case "merchant_rejected":
      return { label: "Unable to Quote", tone: "bad" }
    default:
      return { label: status, tone: "neutral" }
  }
}

type OrderLike = {
  status?: string | null
  fulfillment_status?: string | null
  payment_status?: string | null
}

/** Where an order is, from the buyer's point of view */
export const orderStatus = (o: OrderLike): { label: string; tone: Tone } => {
  if (o.status === "canceled") return { label: "Cancelled", tone: "bad" }
  switch (o.fulfillment_status) {
    case "delivered":
      return { label: "Delivered", tone: "ok" }
    case "shipped":
      return { label: "Shipped", tone: "info" }
    case "partially_shipped":
    case "partially_delivered":
      return { label: "Partially Shipped", tone: "info" }
    case "fulfilled":
    case "partially_fulfilled":
      return { label: "Ready to Ship", tone: "info" }
    case "canceled":
      return { label: "Cancelled", tone: "bad" }
  }
  if (o.status === "completed") return { label: "Completed", tone: "ok" }
  return { label: "Processing", tone: "warn" }
}

export const paymentStatus = (o: OrderLike): { label: string; tone: Tone } => {
  switch (o.payment_status) {
    case "captured":
      return { label: "Paid", tone: "ok" }
    case "partially_captured":
      return { label: "Partially Paid", tone: "warn" }
    case "authorized":
      return { label: "Authorized", tone: "info" }
    case "refunded":
      return { label: "Refunded", tone: "neutral" }
    case "partially_refunded":
      return { label: "Partially Refunded", tone: "neutral" }
    case "canceled":
      return { label: "Cancelled", tone: "bad" }
    case "requires_action":
      return { label: "Action Required", tone: "warn" }
    default:
      return { label: "Payment Pending", tone: "warn" }
  }
}

export const invoiceStatusLabel = (s: "paid" | "overdue" | "open"): { label: string; tone: Tone } =>
  s === "paid"
    ? { label: "Paid", tone: "ok" }
    : s === "overdue"
    ? { label: "Past Due", tone: "bad" }
    : { label: "Open", tone: "warn" }

export const approvalStatus = (s: string): { label: string; tone: Tone } =>
  s === "approved"
    ? { label: "Approved", tone: "ok" }
    : s === "rejected"
    ? { label: "Rejected", tone: "bad" }
    : { label: "Pending Approval", tone: "warn" }

export const toneClass: Record<Tone, string> = {
  ok: "chip-ok",
  warn: "chip-warn",
  bad: "chip-bad",
  info: "chip-info",
  neutral: "chip-neutral",
}
