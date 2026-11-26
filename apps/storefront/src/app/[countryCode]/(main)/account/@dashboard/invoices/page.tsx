import { listOrders } from "@/lib/data/orders"
import { convertToLocale } from "@/lib/util/money"
import { invoicesOf } from "@/lib/util/invoices"
import InvoiceStatusBadge from "@/modules/order/components/invoice-status-badge"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { Heading } from "@medusajs/ui"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Invoices",
  description: "Your invoices.",
}

const d = (v?: string) =>
  v ? new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "-"

export default async function Invoices() {
  const orders = await listOrders(100, 0, { fields: "+metadata,*items" })
  const rows = orders.flatMap((o) =>
    invoicesOf(o as any).map((inv) => ({ order: o, inv }))
  )
  const waiting = orders.filter((o) => invoicesOf(o as any).length === 0).length

  return (
    <div className="w-full flex flex-col gap-y-4" data-testid="invoices-page">
      <Heading>Invoices</Heading>

      {rows.length === 0 ? (
        <p className="text-sm text-neutral-600">
          No invoices yet. Invoices appear here once they are issued for your orders.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-brand-line bg-white">
          <table className="w-full text-sm">
            <thead className="bg-brand-canvas text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2">Invoice</th>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Due</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ order, inv }) => (
                <tr key={`${order.id}-${inv.number}`} className="border-t border-brand-line" data-testid="invoice-row">
                  <td className="px-4 py-3 font-semibold text-brand-navy">{inv.number}</td>
                  <td className="px-4 py-3">
                    <LocalizedClientLink
                      href={`/account/orders/details/${order.id}`}
                      className="text-brand-blue hover:underline"
                    >
                      #{order.display_id}
                    </LocalizedClientLink>
                  </td>
                  <td className="px-4 py-3">{d(inv.date)}</td>
                  <td className="px-4 py-3">{d(inv.due_date)}</td>
                  <td className="px-4 py-3 text-right">
                    {inv.amount != null
                      ? convertToLocale({
                          amount: inv.amount,
                          currency_code: inv.currency ?? order.currency_code,
                        })
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <InvoiceStatusBadge invoice={inv} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {inv.url ? (
                      <a
                        href={inv.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-brand-blue hover:underline"
                      >
                        View invoice
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {waiting > 0 && rows.length > 0 && (
        <p className="text-xs text-neutral-500">
          {waiting} order{waiting === 1 ? "" : "s"} not invoiced yet.
        </p>
      )}
    </div>
  )
}
