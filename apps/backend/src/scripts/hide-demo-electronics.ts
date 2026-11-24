/** Removes the starter's demo electronics so the pilot shows only the packaging catalog. */
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  deleteProductCategoriesWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function removeDemo({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const handles = ["laptops", "monitors", "phones", "accessories"]
  const { data: cats } = await query.graph({
    entity: "product_category",
    fields: ["id", "products.id"],
    filters: { handle: handles },
  })
  const productIds = [
    ...new Set(cats.flatMap((c: any) => (c.products ?? []).map((p: any) => p.id))),
  ] as string[]
  if (productIds.length) {
    await deleteProductsWorkflow(container).run({ input: { ids: productIds } })
  }
  if (cats.length) {
    await deleteProductCategoriesWorkflow(container).run({
      input: cats.map((c: any) => c.id),
    })
  }
  // Scripts run outside the server, so rebuild the product search index here.
  await container.resolve(Modules.SEARCH).reindex({ index: "product" })
}
