import { Invoice, invoiceStatus } from "@/lib/util/invoices"
import { invoiceStatusLabel, toneClass } from "@/lib/util/status-labels"

export default function InvoiceStatusBadge({ invoice }: { invoice: Invoice }) {
  const s = invoiceStatusLabel(invoiceStatus(invoice))
  return <span className={`chip ${toneClass[s.tone]}`}>{s.label}</span>
}
