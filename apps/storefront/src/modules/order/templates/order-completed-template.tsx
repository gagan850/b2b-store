import { BRAND } from "@/lib/brand"
import { getPaymentInfo } from "@/lib/constants"
import { cardLabel } from "@/lib/util/card"
import { describeDelivery, kindOf } from "@/lib/util/delivery"
import { convertToLocale } from "@/lib/util/money"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import PrintButton from "@/modules/order/components/print-button"
import { B2BOrder } from "@/types/global"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: B2BOrder
}

const Address = ({
  title,
  address,
}: {
  title: string
  address?: HttpTypes.StoreOrderAddress | null
}) => (
  <div>
    <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">{title}</h3>
    {address ? (
      <address className="text-sm not-italic leading-5 text-brand-ink">
        {address.company && <span className="block font-semibold">{address.company}</span>}
        <span className="block">
          {address.first_name} {address.last_name}
        </span>
        <span className="block">{address.address_1}</span>
        {address.address_2 && <span className="block">{address.address_2}</span>}
        <span className="block">
          {[address.city, address.province].filter(Boolean).join(", ")} {address.postal_code}
        </span>
        {address.country_code && address.country_code !== "us" && (<span className="block">{address.country_code.toUpperCase()}</span>)}
        {address.phone && <span className="block">{address.phone}</span>}
      </address>
    ) : (
      <p className="text-sm text-neutral-500">—</p>
    )}
  </div>
)

export default async function OrderCompletedTemplate({ order }: OrderCompletedTemplateProps) {
  const money = (amount?: number | null) =>
    convertToLocale({ amount: amount ?? 0, currency_code: order.currency_code })
  const placed = new Date(order.created_at ?? Date.now()).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const payment = order.payment_collections?.[0]?.payments?.[0]
  const po = (payment?.data as any)?.po_number as string | undefined
  const paymentTitle = !payment
    ? "—"
    : payment.provider_id?.startsWith("pp_system_default")
      ? po
        ? "Bill to account"
        : "Pay by invoice"
      : getPaymentInfo(payment.provider_id)?.title ?? payment.provider_id
  const card = (payment?.data as any)?.card as { brand: string; last4: string } | undefined
  const shipping = order.shipping_methods?.[0] as any
  const deliveryKind = shipping ? kindOf(shipping) : undefined
  const delivery = shipping ? describeDelivery(shipping, shipping.data) : ""
  const items = [...(order.items ?? [])].sort((a, b) =>
    (a.created_at ?? "") > (b.created_at ?? "") ? 1 : -1
  )
  const units = items.reduce((n, i) => n + i.quantity, 0)

  return (
    <div className="content-container flex flex-col gap-6 py-6" data-testid="order-complete-container">
      {/* Confirmation banner */}
      <section className="flex flex-col gap-4 border-l-4 border-status-ok bg-white p-6 small:flex-row small:items-center small:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-ok text-xl font-bold text-white">
            ✓
          </span>
          <div>
            <h1 className="font-condensed text-3xl font-bold text-brand-navy">
              Thank you. Your order has been placed.
            </h1>
            <p className="mt-1 text-sm text-brand-ink">
              Order <strong data-testid="order-number">#{order.display_id}</strong> · placed {placed}
              {po && (
                <>
                  {" "}
                  · PO <strong>{po}</strong>
                </>
              )}
            </p>
            <p className="text-sm text-neutral-600">
              A confirmation has been sent to <strong className="break-all">{order.email}</strong>.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <PrintButton />
          <LocalizedClientLink
            href={`/account/orders/details/${order.id}`}
            className="rounded-md border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-canvas"
          >
            View in My Account
          </LocalizedClientLink>
          <LocalizedClientLink href="/store" className="btn-accent">
            Continue shopping
          </LocalizedClientLink>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 small:grid-cols-[minmax(0,1fr)_340px]">
        {/* Items */}
        <section className="bg-white">
          <h2 className="border-b border-brand-line px-6 py-4 text-lg font-bold text-brand-navy">
            Items ordered{" "}
            <span className="text-sm font-normal text-neutral-500">
              ({items.length} {items.length === 1 ? "line" : "lines"}, {units} units)
            </span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-brand-navy bg-brand-canvas text-left text-xs font-bold uppercase tracking-wide text-brand-navy">
                  <th className="px-6 py-2">Item</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="hidden px-3 py-2 text-right xsmall:table-cell">Unit price</th>
                  <th className="px-6 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-brand-line last:border-0">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {item.thumbnail && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.thumbnail}
                            alt=""
                            className="hidden h-12 w-12 shrink-0 border border-brand-line object-contain xsmall:block"
                          />
                        )}
                        <div>
                          {item.variant_sku && (
                            <p className="text-xs font-semibold text-brand-blue">
                              Item # {item.variant_sku}
                            </p>
                          )}
                          <p className="font-semibold text-brand-navy">{item.product_title}</p>
                          <p className="text-neutral-600">{item.variant_title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right" data-testid="product-quantity">
                      {item.quantity}
                    </td>
                    <td className="hidden px-3 py-3 text-right xsmall:table-cell">
                      {money(item.unit_price)}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-brand-navy">
                      {money(item.subtotal ?? item.unit_price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Summary */}
        <aside className="flex flex-col gap-6">
          <section className="bg-white p-6">
            <h2 className="mb-3 text-lg font-bold text-brand-navy">Order total</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{money(order.item_subtotal ?? order.subtotal)}</dd>
              </div>
              {!!order.discount_total && (
                <div className="flex justify-between text-status-ok">
                  <dt>Discount</dt>
                  <dd>- {money(order.discount_total)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>
                  {deliveryKind === "pickup"
                    ? "Will call"
                    : `Shipping${deliveryKind === "carrier" && shipping?.name ? ` (${shipping.name})` : ""}`}
                </dt>
                <dd>{money(order.shipping_total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tax</dt>
                <dd>{money(order.tax_total)}</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-brand-line pt-3 text-base font-bold text-brand-navy">
                <dt>Total</dt>
                <dd data-testid="order-total">{money(order.total)}</dd>
              </div>
            </dl>
          </section>
          <section className="flex flex-col gap-4 bg-white p-6">
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
                Payment
              </h3>
              <p className="text-sm text-brand-ink" data-testid="payment-method">
                {paymentTitle}
                {po ? ` · PO ${po}` : ""}
                {card ? ` · ${cardLabel(card)}` : ""}
              </p>
            </div>
            {delivery && (
              <div>
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
                  Delivery
                </h3>
                <p className="text-sm text-brand-ink" data-testid="delivery-method">
                  {delivery}
                </p>
              </div>
            )}
            {deliveryKind !== "pickup" && (
              <Address title="Ship to" address={order.shipping_address} />
            )}
            <Address title="Bill to" address={order.billing_address} />
          </section>
        </aside>
      </div>

      <section className="grid grid-cols-1 gap-4 bg-white p-6 text-sm small:grid-cols-3">
        <div>
          <h3 className="font-bold text-brand-navy">What happens next</h3>
          <p className="text-neutral-600">
            {deliveryKind === "pickup"
              ? "We'll pick your order and email you when it's ready at the warehouse. Bring your order number."
              : "We'll confirm stock and ship from the warehouse nearest you. Tracking is emailed as soon as it ships."}
          </p>
        </div>
        <div>
          <h3 className="font-bold text-brand-navy">Need to change something?</h3>
          <p className="text-neutral-600">
            Call {BRAND.phone} with order #{order.display_id} and we&apos;ll help right away.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-brand-navy">Returns</h3>
          <p className="text-neutral-600">
            See our{" "}
            <LocalizedClientLink href="/returns" className="text-brand-blue hover:underline">
              return policy
            </LocalizedClientLink>{" "}
            or start a return from My Account.
          </p>
        </div>
      </section>
    </div>
  )
}
