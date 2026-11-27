import { HttpTypes } from "@medusajs/types"

// Delivery helpers shared by checkout and the order pages.
// Options carry data.kind: "carrier" | "collect" | "pickup" (see setup-checkout-options.ts).

export type DeliveryOption = HttpTypes.StoreCartShippingOption & {
  data?: Record<string, any> | null
  service_zone?: {
    fulfillment_set?: {
      type?: string
      location?: { name?: string; address?: Record<string, any> | null } | null
    }
  }
}


export const kindOf = (o?: {
  name?: string
  data?: Record<string, any> | null
  service_zone?: any
}) =>
  (o?.data?.kind as string | undefined) ??
  (o?.service_zone?.fulfillment_set?.type === "pickup" || o?.name?.startsWith("Will call:")
    ? "pickup"
    : o?.data?.carrier_account
      ? "collect"
      : "carrier")

export const warehouseName = (o: { name: string }) => o.name.replace(/^Will call:\s*/, "")

export const warehouseAddress = (o: DeliveryOption) => {
  const a = o.service_zone?.fulfillment_set?.location?.address
  if (!a) return ""
  return [a.address_1, a.city, [a.province, a.postal_code].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ")
}

/** One-line description of a cart or order shipping method. */
export const describeDelivery = (
  option: { name: string; data?: Record<string, any> | null; service_zone?: any } | undefined,
  methodData?: Record<string, any> | null
) => {
  if (!option) return ""
  const kind = kindOf(option)
  if (kind === "pickup") {
    const addr = methodData?.pickup?.address
    return `Will call at ${warehouseName(option)} warehouse${addr ? `, ${addr}` : ""}`
  }
  if (kind === "collect") {
    const acct = methodData?.carrier_account
    return acct
      ? `${acct.carrier} ${acct.service || ""} on your account ${acct.account_number}`.replace(/\s+/g, " ")
      : "Your carrier account"
  }
  return `${option.name}${option.data?.transit ? ` · ${option.data.transit}` : ""}`
}
