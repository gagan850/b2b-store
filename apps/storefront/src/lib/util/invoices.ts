/**
 * Invoices are made by the ERP. The ERP (or staff) saves them on the order as
 * metadata.invoices, a list with one entry per invoice. We only show them.
 */
export type Invoice = {
  number: string
  date?: string
  due_date?: string
  amount?: number
  currency?: string
  status?: "open" | "paid" | "overdue" | string
  url?: string
}

export const invoicesOf = (order: { metadata?: Record<string, any> | null }): Invoice[] => {
  const list = (order.metadata as any)?.invoices
  return Array.isArray(list) ? (list.filter((i) => i && i.number) as Invoice[]) : []
}

export const invoiceStatus = (inv: Invoice): "paid" | "overdue" | "open" => {
  if (String(inv.status).toLowerCase() === "paid") return "paid"
  if (inv.due_date && new Date(inv.due_date).getTime() < Date.now()) return "overdue"
  return "open"
}
