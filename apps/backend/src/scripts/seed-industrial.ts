/**
 * Demo catalog for the pilot: a 3-level category tree of industrial
 * supplies with item numbers and quantity price breaks, plus a US region.
 * Run: pnpm medusa exec ./src/scripts/seed-industrial.ts
 */
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createTaxRegionsWorkflow,
} from "@medusajs/medusa/core-flows"

type Leaf = { name: string; products: P[] }
type Mid = { name: string; children: Leaf[] }
type Top = { name: string; icon: string; blurb: string; children: Mid[] }
type P = {
  title: string
  description: string
  option: string
  // [option value, sku, unit price at qty 1, price at 10+, price at 50+]
  rows: [string, string, number, number, number][]
  weight?: number
}

const tree: Top[] = [
  {
    name: "Boxes",
    icon: "📦",
    blurb: "Corrugated, heavy-duty and mailer boxes",
    children: [
      {
        name: "Corrugated Boxes",
        children: [
          {
            name: "Standard Corrugated Boxes",
            products: [
              {
                title: "Corrugated Box, 200 lb Test, Kraft",
                description: "Single wall 200 lb test / 32 ECT corrugated box. Ships flat, bundle of 25.",
                option: "Size (L x W x H)",
                weight: 250,
                rows: [
                  ['6 x 6 x 6"', "S-4120", 21.5, 19.75, 17.9],
                  ['8 x 8 x 8"', "S-4121", 27.0, 24.5, 22.25],
                  ['10 x 10 x 10"', "S-4122", 34.75, 31.5, 28.75],
                  ['12 x 12 x 12"', "S-4123", 42.0, 38.25, 34.9],
                  ['16 x 12 x 8"', "S-4124", 39.5, 36.0, 32.75],
                ],
              },
              {
                title: "Long Corrugated Box, Kraft",
                description: "Long boxes for tubes, rods and posters. Bundle of 25.",
                option: "Size (L x W x H)",
                rows: [
                  ['24 x 6 x 6"', "S-4180", 38.0, 34.5, 31.25],
                  ['36 x 6 x 6"', "S-4181", 52.5, 47.75, 43.5],
                  ['48 x 8 x 8"', "S-4182", 79.0, 72.0, 65.5],
                ],
              },
            ],
          },
          {
            name: "Heavy-Duty Boxes",
            products: [
              {
                title: "Double Wall Box, 275 lb Test",
                description: "Double wall 275 lb test for heavy or fragile items. Bundle of 15.",
                option: "Size (L x W x H)",
                rows: [
                  ['12 x 12 x 12"', "S-4350", 48.0, 44.0, 40.5],
                  ['18 x 18 x 18"', "S-4351", 86.0, 79.0, 72.5],
                  ['24 x 18 x 18"', "S-4352", 104.0, 95.5, 88.0],
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Mailers",
        children: [
          {
            name: "Bubble Mailers",
            products: [
              {
                title: "Self-Seal Bubble Mailer, Kraft",
                description: "Padded kraft mailer with peel-and-seal closure. Carton of 100.",
                option: "Size",
                rows: [
                  ['#0 - 6 x 10"', "S-1120", 31.0, 28.0, 25.5],
                  ['#2 - 8.5 x 12"', "S-1122", 39.0, 35.5, 32.25],
                  ['#5 - 10.5 x 16"', "S-1125", 58.0, 52.75, 48.0],
                ],
              },
            ],
          },
          {
            name: "Poly Mailers",
            products: [
              {
                title: "Poly Mailer, 2.5 Mil, White",
                description: "Opaque, tear-resistant poly mailer. Carton of 500.",
                option: "Size",
                rows: [
                  ['10 x 13"', "S-3540", 42.0, 38.5, 35.0],
                  ['12 x 15.5"', "S-3541", 54.0, 49.5, 45.0],
                  ['14.5 x 19"', "S-3542", 71.0, 65.0, 59.0],
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Tape",
    icon: "🧻",
    blurb: "Packing, masking and duct tape",
    children: [
      {
        name: "Packing Tape",
        children: [
          {
            name: "Hot Melt Tape",
            products: [
              {
                title: "Hot Melt Carton Sealing Tape, 2 Mil, Clear",
                description: "Strong instant adhesion for corrugated boxes. Case of 36 rolls.",
                option: "Width x Length",
                rows: [
                  ['2" x 55 yds', "S-423", 58.0, 52.0, 47.5],
                  ['2" x 110 yds', "S-424", 89.0, 81.0, 74.0],
                  ['3" x 110 yds', "S-426", 128.0, 117.0, 107.0],
                ],
              },
            ],
          },
          {
            name: "Acrylic Tape",
            products: [
              {
                title: "Acrylic Carton Sealing Tape, 1.6 Mil, Clear",
                description: "Performs in cold and hot temperatures, UV resistant. Case of 36 rolls.",
                option: "Width x Length",
                rows: [
                  ['2" x 55 yds', "S-6210", 49.0, 44.5, 40.5],
                  ['2" x 110 yds', "S-6211", 76.0, 69.0, 63.0],
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Masking & Duct Tape",
        children: [
          {
            name: "Duct Tape",
            products: [
              {
                title: "Industrial Duct Tape, 10 Mil",
                description: "Heavy-duty cloth duct tape. Case of 24 rolls.",
                option: "Color",
                rows: [
                  ["Silver", "S-5470", 112.0, 102.0, 94.0],
                  ["Black", "S-5471", 116.0, 106.0, 97.5],
                  ["Red", "S-5472", 121.0, 110.0, 101.0],
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Safety",
    icon: "🦺",
    blurb: "Gloves, eye protection and PPE",
    children: [
      {
        name: "Gloves",
        children: [
          {
            name: "Nitrile Gloves",
            products: [
              {
                title: "Disposable Nitrile Gloves, 5 Mil, Powder-Free",
                description: "General purpose nitrile gloves. Box of 100.",
                option: "Size",
                rows: [
                  ["Small", "S-7400S", 14.5, 12.75, 11.25],
                  ["Medium", "S-7400M", 14.5, 12.75, 11.25],
                  ["Large", "S-7400L", 14.5, 12.75, 11.25],
                  ["X-Large", "S-7400X", 15.25, 13.5, 12.0],
                ],
              },
            ],
          },
          {
            name: "Cut-Resistant Gloves",
            products: [
              {
                title: "Cut-Resistant Gloves, ANSI A4, PU Coated",
                description: "High-performance yarn shell with polyurethane palm. Pack of 12 pairs.",
                option: "Size",
                rows: [
                  ["Medium", "S-9800M", 96.0, 88.0, 81.0],
                  ["Large", "S-9800L", 96.0, 88.0, 81.0],
                  ["X-Large", "S-9800X", 99.0, 91.0, 84.0],
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Eye Protection",
        children: [
          {
            name: "Safety Glasses",
            products: [
              {
                title: "Wraparound Safety Glasses, Anti-Fog",
                description: "ANSI Z87.1+ rated, anti-fog coated lens. Pack of 12.",
                option: "Lens",
                rows: [
                  ["Clear", "S-15200", 36.0, 32.5, 29.5],
                  ["Gray", "S-15201", 38.0, 34.25, 31.0],
                  ["Amber", "S-15202", 38.0, 34.25, 31.0],
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Janitorial",
    icon: "🧹",
    blurb: "Trash bags, towels and cleaning supplies",
    children: [
      {
        name: "Trash Bags",
        children: [
          {
            name: "Contractor Bags",
            products: [
              {
                title: "Contractor Trash Bags, 3 Mil, Black",
                description: "Puncture-resistant bags for construction debris. Carton of 50.",
                option: "Capacity",
                rows: [
                  ["42 gallon", "S-6120", 39.0, 35.5, 32.5],
                  ["55 gallon", "S-6121", 47.0, 43.0, 39.25],
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Paper Towels",
        children: [
          {
            name: "Roll Towels",
            products: [
              {
                title: "Hardwound Roll Towels, Kraft",
                description: "8\" x 800' rolls for standard hardwound dispensers. Case of 6.",
                option: "Pack",
                rows: [
                  ["Case of 6", "S-7128", 42.0, 38.5, 35.25],
                  ["Case of 12", "S-7129", 79.0, 72.5, 66.5],
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]

const handle = (s: string) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

export default async function seedIndustrial({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const regionService = container.resolve(Modules.REGION)

  const [salesChannel] = await salesChannelService.listSalesChannels({}, { take: 1 })

  // US region in USD, so the pilot shows dollar prices
  const existingUs = await regionService.listRegions({ currency_code: "usd" })
  if (!existingUs.length) {
    await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "United States",
            currency_code: "usd",
            countries: ["us"],
            payment_providers: ["pp_system_default"],
            automatic_taxes: true,
          },
        ],
      },
    })
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "us", provider_id: "tp_system" }],
    })
    logger.info("Created US region")
  }

  const { data: existingCats } = await query.graph({
    entity: "product_category",
    fields: ["handle"],
    filters: { handle: "boxes" },
  })
  if (existingCats.length) {
    logger.info("Industrial catalog already seeded, skipping")
    return
  }

  let rank = 0
  for (const top of tree) {
    const {
      result: [topCat],
    } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: top.name,
            handle: handle(top.name),
            is_active: true,
            rank: rank++,
            description: top.blurb,
            metadata: { icon: top.icon },
          },
        ],
      },
    })

    for (const mid of top.children) {
      const {
        result: [midCat],
      } = await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: [
            {
              name: mid.name,
              handle: handle(mid.name),
              is_active: true,
              parent_category_id: topCat.id,
              metadata: { icon: top.icon },
            },
          ],
        },
      })

      for (const leaf of mid.children) {
        const {
          result: [leafCat],
        } = await createProductCategoriesWorkflow(container).run({
          input: {
            product_categories: [
              {
                name: leaf.name,
                handle: handle(leaf.name),
                is_active: true,
                parent_category_id: midCat.id,
                metadata: { icon: top.icon },
              },
            ],
          },
        })

        await createProductsWorkflow(container).run({
          input: {
            products: leaf.products.map((p) => ({
              title: p.title,
              handle: handle(p.title),
              description: p.description,
              status: ProductStatus.PUBLISHED,
              weight: p.weight,
              category_ids: [leafCat.id],
              options: [{ title: p.option, values: p.rows.map((r) => r[0]) }],
              variants: p.rows.map(([value, sku, p1, p10, p50]) => ({
                title: value,
                sku,
                options: { [p.option]: value },
                manage_inventory: false,
                prices: ["usd", "eur"].flatMap((currency_code) => [
                  { amount: p1, currency_code },
                  { amount: p10, currency_code, min_quantity: 10 },
                  { amount: p50, currency_code, min_quantity: 50 },
                ]),
              })),
              sales_channels: [{ id: salesChannel.id }],
            })),
          },
        })
      }
    }
    logger.info(`Seeded ${top.name}`)
  }
  // Ship to the US from the existing warehouse
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)
  const zones = await fulfillmentService.listServiceZones({}, { relations: ["geo_zones"] })
  if (zones.length && !zones.some((z) => z.geo_zones?.some((g) => g.country_code === "us"))) {
    await fulfillmentService.createGeoZones({
      service_zone_id: zones[0].id,
      type: "country",
      country_code: "us",
    })
  }
  // Scripts run outside the server, so rebuild the product search index here.
  await container.resolve(Modules.SEARCH).reindex({ index: "product" })
}
