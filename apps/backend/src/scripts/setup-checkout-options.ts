import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  deleteShippingOptionsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateRegionsWorkflow,
  updateStockLocationsWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Checkout options for the pilot. Safe to run more than once.
 *
 *  - Credit card payment (pp_card_card) next to Bill to account.
 *  - Warehouses (stock locations), each offering Will call (pickup, $0).
 *  - Carrier services (UPS, FedEx, LTL) with flat demo rates, plus
 *    "Ship on my carrier account" ($0, the customer's own account number).
 *
 * The warehouses and rates are DEMO DATA. They come from the ERP later.
 *
 * Every option carries `data.kind` ("carrier" | "collect" | "pickup"),
 * which is what the storefront uses to group them.
 */

const WAREHOUSES = [
  {
    name: "Los Angeles, CA",
    address: { address_1: "2400 E 8th St", city: "Los Angeles", province: "CA", postal_code: "90021", country_code: "US", phone: "800-809-8393" },
    hours: "Mon–Fri 7:00 AM – 4:00 PM PT",
  },
  {
    name: "Dallas, TX",
    address: { address_1: "4100 Platinum Way", city: "Dallas", province: "TX", postal_code: "75237", country_code: "US", phone: "800-809-8393" },
    hours: "Mon–Fri 7:00 AM – 4:00 PM CT",
  },
  {
    name: "Edison, NJ",
    address: { address_1: "300 Raritan Center Pkwy", city: "Edison", province: "NJ", postal_code: "08837", country_code: "US", phone: "800-809-8393" },
    hours: "Mon–Fri 7:00 AM – 4:00 PM ET",
  },
]

const CARRIER_OPTIONS = [
  { name: "UPS Ground", amount: 14.95, code: "ups-ground", data: { kind: "carrier", carrier: "UPS", service: "Ground", transit: "1–5 business days" } },
  { name: "UPS 2nd Day Air", amount: 34.95, code: "ups-2day", data: { kind: "carrier", carrier: "UPS", service: "2nd Day Air", transit: "2 business days" } },
  { name: "FedEx Ground", amount: 13.95, code: "fedex-ground", data: { kind: "carrier", carrier: "FedEx", service: "Ground", transit: "1–5 business days" } },
  { name: "FedEx Express Saver", amount: 29.95, code: "fedex-express-saver", data: { kind: "carrier", carrier: "FedEx", service: "Express Saver", transit: "3 business days" } },
  { name: "LTL Freight (palletized)", amount: 185, code: "ltl", data: { kind: "carrier", carrier: "LTL", service: "Freight", transit: "3–7 business days" } },
  { name: "Ship on my carrier account", amount: 0, code: "collect", data: { kind: "collect", transit: "Billed to your carrier account" } },
]

const RULES = [
  { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
  { attribute: "is_return", value: "false", operator: "eq" as const },
]

export default async function setupCheckoutOptions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillment = container.resolve(Modules.FULFILLMENT)
  const inventory = container.resolve(Modules.INVENTORY)
  const regionService = container.resolve(Modules.REGION)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)

  const [salesChannel] = await salesChannelService.listSalesChannels({}, { take: 1 })
  const [region] = await regionService.listRegions({ currency_code: "usd" })
  const [profile] = await fulfillment.listShippingProfiles({ type: "default" })

  // 1. Credit card on the US region
  if (region) {
    const { data: [r] } = await query.graph({
      entity: "region",
      fields: ["payment_providers.id"],
      filters: { id: region.id },
    })
    const ids = (r?.payment_providers ?? []).map((p: any) => p.id)
    const want = Array.from(new Set([...ids, "pp_account_account", "pp_card_card"]))
    if (want.length !== ids.length) {
      await updateRegionsWorkflow(container).run({
        input: { selector: { id: region.id }, update: { payment_providers: want } },
      })
      logger.info("Added credit card payment to the US region")
    }
  }

  // 2. Warehouses. The starter's first location becomes the LA warehouse.
  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name", "metadata", "fulfillment_sets.id", "fulfillment_sets.type", "fulfillment_sets.service_zones.id"],
  })
  const byName = new Map(locations.map((l: any) => [l.name, l]))
  const original = locations.find((l: any) => !WAREHOUSES.some((w) => w.name === l.name))
  if (original && !byName.has(WAREHOUSES[0].name)) {
    await updateStockLocationsWorkflow(container).run({
      input: {
        selector: { id: original.id },
        update: { name: WAREHOUSES[0].name, address: WAREHOUSES[0].address },
      },
    })
    byName.set(WAREHOUSES[0].name, { ...original, name: WAREHOUSES[0].name })
    logger.info(`Renamed ${original.name} to ${WAREHOUSES[0].name}`)
  }

  const inventoryItems = await inventory.listInventoryItems({}, { take: 1000 })
  const mainLocationId = byName.get(WAREHOUSES[0].name)?.id

  for (const w of WAREHOUSES) {
    let loc: any = byName.get(w.name)
    if (!loc) {
      const { result } = await createStockLocationsWorkflow(container).run({
        input: { locations: [{ name: w.name, address: w.address, metadata: { hours: w.hours } }] },
      })
      loc = { ...result[0], fulfillment_sets: [] }
      await link.create({
        [Modules.STOCK_LOCATION]: { stock_location_id: loc.id },
        [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
      })
      await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: { id: loc.id, add: [salesChannel.id] },
      })
      logger.info(`Created warehouse ${w.name}`)
    } else {
      await updateStockLocationsWorkflow(container).run({
        input: { selector: { id: loc.id }, update: { metadata: { ...(loc.metadata ?? {}), hours: w.hours } } },
      })
    }

    // Same stock at every warehouse for the demo, so will call never fails
    if (mainLocationId && loc.id !== mainLocationId) {
      const levels = await inventory.listInventoryLevels({ location_id: [loc.id] }, { take: 1000 })
      const have = new Set(levels.map((l) => l.inventory_item_id))
      const mainLevels = await inventory.listInventoryLevels({ location_id: [mainLocationId] }, { take: 1000 })
      const qty = new Map(mainLevels.map((l) => [l.inventory_item_id, Number(l.stocked_quantity)]))
      const missing = inventoryItems.filter((i) => !have.has(i.id))
      if (missing.length) {
        await inventory.createInventoryLevels(
          missing.map((i) => ({
            inventory_item_id: i.id,
            location_id: loc.id,
            stocked_quantity: qty.get(i.id) ?? 1000,
          }))
        )
      }
    }

    // Pickup fulfillment set with one $0 Will call option
    let pickup = (loc.fulfillment_sets ?? []).find((f: any) => f.type === "pickup")
    if (!pickup) {
      pickup = await fulfillment.createFulfillmentSets({
        name: `${w.name} will call`,
        type: "pickup",
        service_zones: [{ name: `${w.name} will call`, geo_zones: [{ type: "country", country_code: "us" }] }],
      })
      await link.create({
        [Modules.STOCK_LOCATION]: { stock_location_id: loc.id },
        [Modules.FULFILLMENT]: { fulfillment_set_id: pickup.id },
      })
    }
    const zoneId = pickup.service_zones[0].id
    const existing = await fulfillment.listShippingOptions({ service_zone: { id: zoneId } } as any)
    if (!existing.length) {
      await createShippingOptionsWorkflow(container).run({
        input: [
          {
            name: `Will call: ${w.name}`,
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: zoneId,
            shipping_profile_id: profile.id,
            type: { label: "Will call", description: "Pick up at the warehouse", code: "will-call" },
            data: { kind: "pickup", hours: w.hours, ready: "Usually ready in 2 business hours" },
            prices: [{ currency_code: "usd", amount: 0 }, ...(region ? [{ region_id: region.id, amount: 0 }] : [])],
            rules: RULES,
          },
        ],
      })
      logger.info(`Added will call at ${w.name}`)
    }
  }

  // 3. Carrier services on the main warehouse's shipping zone
  const { data: [main] } = await query.graph({
    entity: "stock_location",
    fields: ["fulfillment_sets.type", "fulfillment_sets.service_zones.id", "fulfillment_sets.service_zones.shipping_options.id", "fulfillment_sets.service_zones.shipping_options.name"],
    filters: { id: mainLocationId },
  })
  const shipSet = main?.fulfillment_sets?.find((f: any) => f.type === "shipping")
  const shipZone = shipSet?.service_zones?.[0]
  if (!shipZone) {
    logger.warn("No shipping zone on the main warehouse; skipping carrier options")
    return
  }
  const current = shipZone.shipping_options ?? []
  const names = new Set(current.map((o: any) => o.name))
  const toCreate = CARRIER_OPTIONS.filter((o) => !names.has(o.name))
  if (toCreate.length) {
    await createShippingOptionsWorkflow(container).run({
      input: toCreate.map((o) => ({
        name: o.name,
        price_type: "flat" as const,
        provider_id: "manual_manual",
        service_zone_id: shipZone.id,
        shipping_profile_id: profile.id,
        type: { label: o.name, description: o.data.transit, code: o.code },
        data: o.data,
        prices: [{ currency_code: "usd", amount: o.amount }, ...(region ? [{ region_id: region.id, amount: o.amount }] : [])],
        rules: RULES,
      })),
    })
    logger.info(`Added ${toCreate.length} carrier options`)
  }

  // The starter's generic options are replaced by the carrier services
  const generic = current.filter((o: any) => ["Standard Shipping", "Express Shipping"].includes(o.name))
  if (generic.length) {
    await deleteShippingOptionsWorkflow(container).run({ input: { ids: generic.map((o: any) => o.id) } })
    logger.info("Removed the starter's Standard and Express options")
  }

  logger.info("Checkout options ready")
}
