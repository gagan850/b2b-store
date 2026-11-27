"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders } from "@/lib/data/cookies"
import { HttpTypes } from "@medusajs/types"

export type ContractPrices = Record<string, { amount: number; contract: boolean }>

/**
 * The signed-in buyer's own price per variant (contract / price list prices).
 * Product pages are static and shared, so these are loaded per buyer here.
 */
export async function retrieveContractPrices(
  productId: string,
  regionId: string
): Promise<ContractPrices> {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) return {}

  const { products } = await sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[] }>(`/store/products`, {
      method: "GET",
      query: {
        id: [productId],
        region_id: regionId,
        fields: "id,*variants.calculated_price",
      },
      headers,
      cache: "no-store",
    })
    .catch(() => ({ products: [] as HttpTypes.StoreProduct[] }))

  const out: ContractPrices = {}
  for (const v of products[0]?.variants ?? []) {
    const cp = (v as any).calculated_price
    if (cp && typeof cp.calculated_amount === "number") {
      out[v.id] = {
        amount: cp.calculated_amount,
        contract: Boolean(cp.is_calculated_price_price_list),
      }
    }
  }
  return out
}
