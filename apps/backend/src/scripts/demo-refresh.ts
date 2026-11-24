/**
 * One-step refresh for an existing demo database:
 *  - removes the starter's demo electronics
 *  - makes sure the shipping zone covers the US
 *  - gives the packaging catalog its product images (static/products)
 *  - rebuilds the product search index
 * Run: pnpm medusa exec ./src/scripts/demo-refresh.ts
 */
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import removeDemo from "./hide-demo-electronics"

const IMAGES: [RegExp, string][] = [
  [/^long corrugated/i, "long-box"],
  [/^double wall/i, "double-wall-box"],
  [/corrugated box/i, "corrugated-box"],
  [/bubble mailer/i, "bubble-mailer"],
  [/poly mailer/i, "poly-mailer"],
  [/hot melt/i, "hot-melt-tape"],
  [/acrylic/i, "acrylic-tape"],
  [/duct tape/i, "duct-tape"],
  [/nitrile/i, "nitrile-gloves"],
  [/cut-resistant/i, "cut-resistant-gloves"],
  [/safety glasses/i, "safety-glasses"],
  [/trash bags/i, "trash-bags"],
  [/towels/i, "roll-towels"],
]

export default async function demoRefresh(args: ExecArgs) {
  const { container } = args
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  await removeDemo(args)

  const fulfillment = container.resolve(Modules.FULFILLMENT)
  const zones = await fulfillment.listServiceZones({}, { relations: ["geo_zones"] })
  if (zones.length && !zones.some((z) => z.geo_zones?.some((g) => g.country_code === "us"))) {
    await fulfillment.createGeoZones({
      service_zone_id: zones[0].id,
      type: "country",
      country_code: "us",
    })
    logger.info("Added US to the shipping zone")
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const base = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
  const { data: products } = await query.graph({ entity: "product", fields: ["id", "title"] })
  for (const p of products) {
    const hit = IMAGES.find(([re]) => re.test(p.title))
    if (!hit) continue
    const url = `${base}/static/products/${hit[1]}.svg`
    await updateProductsWorkflow(container).run({
      input: { selector: { id: p.id }, update: { thumbnail: url, images: [{ url }] } },
    })
  }
  // Scripts run outside the server, so rebuild the product search index here.
  await container.resolve(Modules.SEARCH).reindex({ index: "product" })
}
