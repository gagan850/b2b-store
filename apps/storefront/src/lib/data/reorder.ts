"use server"

import { addToCart } from "./cart"
import { retrieveOrder } from "./orders"

export type ReorderResult = { added: number; skipped: string[] }

/**
 * Puts every line of a past order back in the cart at today's prices.
 * Items that are no longer sold are skipped and reported by name.
 */
export const reorderOrder = async (
  orderId: string,
  countryCode: string
): Promise<ReorderResult> => {
  const order = await retrieveOrder(orderId)
  let added = 0
  const skipped: string[] = []
  for (const item of order.items ?? []) {
    if (!item.variant_id) {
      skipped.push(item.title)
      continue
    }
    try {
      await addToCart({
        variantId: item.variant_id,
        quantity: item.quantity,
        countryCode,
      })
      added++
    } catch {
      skipped.push(item.title)
    }
  }
  return { added, skipped }
}
