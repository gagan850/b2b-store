import { Invoice, invoiceStatus } from "@/lib/util/invoices"

const styles = {
  paid: "bg-green-100 text-green-800",
  open: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
}
const labels = { paid: "Paid", open: "Open", overdue: "Overdue" }

export default function InvoiceStatusBadge({ invoice }: { invoice: Invoice }) {
  const s = invoiceStatus(invoice)
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${styles[s]}`}>
      {labels[s]}
    </span>
  )
}
