"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders } from "@/lib/data/cookies"
import { retrieveCustomer } from "./customer"
import { getRegion } from "./regions"
import { createQuoteMessage } from "./quotes"

/**
 * "Request a quote" for one item at a larger quantity. Uses a separate cart, so
 * whatever is in the buyer's own cart stays untouched.
 */
export const requestItemQuote = async ({
  variantId,
  quantity,
  note,
  countryCode,
}: {
  variantId: string
  quantity: number
  note?: string
  countryCode: string
}): Promise<{ quoteId: string; number: string }> => {
  const customer = await retrieveCustomer()
  if (!customer) throw new Error("Please sign in to request a quote")
  const region = await getRegion(countryCode)
  if (!region) throw new Error("Region not found")
  if (!(quantity >= 1)) throw new Error("Enter a quantity")

  const headers = { ...(await getAuthHeaders()) }
  const { cart } = await sdk.store.cart.create(
    {
      region_id: region.id,
      metadata: { company_id: customer.employee?.company_id },
    },
    {},
    headers
  )
  await sdk.store.cart.createLineItem(
    cart.id,
    { variant_id: variantId, quantity },
    {},
    headers
  )
  const { quote } = await sdk.client.fetch<{ quote: { id: string; draft_order?: { display_id?: number; items?: { id: string }[] } } }>(
    `/store/quotes`,
    { method: "POST", body: { cart_id: cart.id }, headers }
  )
  const text = (note ?? "").trim()
  if (text) {
    await createQuoteMessage(quote.id, {
      text,
      // the quote works on a copy of the cart items, so use the copy's id
      item_id: quote.draft_order?.items?.[0]?.id ?? null,
    }).catch(() => null)
  }
  const display = quote.draft_order?.display_id
  return {
    quoteId: quote.id,
    number: display ? `Q-${String(display).padStart(6, "0")}` : "your quote",
  }
}
