/**
 * Medusa keeps the discount that was worked out when the quote was requested, even
 * after staff change a unit price. For a percentage promotion that leaves the old
 * discount next to the new prices. This re-applies the same percentage to the
 * revised subtotal so the quote matches what checkout will charge.
 */
type Line = { unit_price: number | string; quantity: number | string }

const sum = (items: Line[] = []) =>
  items.reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity), 0)

export const revisedTotals = (
  order: { items?: Line[]; discount_total?: number | string },
  preview: {
    items?: Line[]
    shipping_total?: number | string
    tax_total?: number | string
  }
) => {
  const subtotal = sum(preview.items)
  const originalSubtotal = sum(order.items)
  const originalDiscount = Number(order.discount_total) || 0
  const discount =
    originalSubtotal > 0 && originalDiscount > 0
      ? Math.round(((subtotal * originalDiscount) / originalSubtotal) * 100) / 100
      : 0
  const shipping = Number(preview.shipping_total) || 0
  const tax = Number(preview.tax_total) || 0
  return {
    subtotal,
    discount,
    shipping,
    total: Math.round((subtotal - discount + shipping + tax) * 100) / 100,
  }
}
