import { listProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import CategoryBreadcrumb from "@/modules/categories/category-breadcrumb"
import { childrenOf } from "@/modules/categories/components/category-sidebar"
import ProductFamilyTable from "@/modules/categories/components/product-family-table"
import SubcategoryTiles from "@/modules/categories/components/subcategory-tiles"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { HttpTypes } from "@medusajs/types"
import { notFound } from "next/navigation"

export const FAMILY_FIELDS =
  "*variants.calculated_price,*variants.options,*variants.prices,*options,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder"

export default async function CategoryTemplate({
  categories,
  currentCategory,
  countryCode,
}: {
  categories: HttpTypes.StoreProductCategory[]
  currentCategory: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  if (!currentCategory || !countryCode) notFound()

  const children = childrenOf(categories, currentCategory.id)
  const isLeaf = children.length === 0
  const region = await getRegion(countryCode)

  const products =
    isLeaf && region
      ? (
          await listProducts({
            countryCode,
            queryParams: {
              category_id: [currentCategory.id],
              limit: 50,
              fields: FAMILY_FIELDS,
            } as any,
          })
        ).response.products
      : []

  return (
    <div className="content-container flex flex-col gap-6 py-4" data-testid="category-container">
      <nav className="text-sm">
        <CategoryBreadcrumb categories={categories} category={currentCategory} />
      </nav>
      <div className="flex flex-col gap-6 bg-white p-4 small:p-8">
        <header>
          <h1 className="font-condensed text-3xl font-bold uppercase text-brand-navy small:text-4xl">
            {currentCategory.name}
          </h1>
          {currentCategory.description && (
            <p className="mt-1 text-sm text-neutral-600">{currentCategory.description}</p>
          )}
        </header>

        {isLeaf ? (
          products.length ? (
            <div className="flex flex-col gap-10">
              {products.map((p) => (
                <ProductFamilyTable key={p.id} product={p} region={region!} />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-neutral-500">
              No products in this category yet. Call us and we&apos;ll source it for you.
            </p>
          )
        ) : (
          <SubcategoryTiles categories={categories} parent={currentCategory} />
        )}
      </div>
    </div>
  )
}
