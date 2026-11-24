/** Hides the starter's demo electronics so the pilot shows only the industrial catalog. */
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { updateProductCategoriesWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"

export default async function hideDemo({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const handles = ["laptops", "monitors", "phones", "accessories"]
  const { data: cats } = await query.graph({
    entity: "product_category",
    fields: ["id", "products.id"],
    filters: { handle: handles },
  })
  const productIds = [...new Set(cats.flatMap((c: any) => c.products.map((p: any) => p.id)))]
  if (productIds.length) {
    await updateProductsWorkflow(container).run({
      input: { selector: { id: productIds }, update: { status: ProductStatus.DRAFT } },
    })
  }
  await updateProductCategoriesWorkflow(container).run({
    input: { selector: { handle: handles }, update: { is_active: false } },
  })
}
