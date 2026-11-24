import { listProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import CategoryBreadcrumb from "@/modules/categories/category-breadcrumb"
import CategorySidebar, {
  childrenOf,
} from "@/modules/categories/components/category-sidebar"
import ProductFamilyTable from "@/modules/categories/components/product-family-table"
import SubcategoryTiles from "@/modules/categories/components/subcategory-tiles"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { HttpTypes } from "@medusajs/types"
import { notFound } from "next/navigation"

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
              fields:
                "*variants.calculated_price,*variants.options,*variants.prices,*options",
            } as any,
          })
        ).response.products
      : []

  return (
    <div className="content-container flex flex-col gap-4 py-4" data-testid="category-container">
      <nav className="text-sm">
        <CategoryBreadcrumb categories={categories} category={currentCategory} />
      </nav>
      <div className="flex flex-col gap-4 small:flex-row small:items-start">
        <CategorySidebar categories={categories} current={currentCategory} />
        <div className="flex w-full min-w-0 flex-col gap-4">
          <header className="panel flex items-center gap-4 p-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-brand-accent-light text-3xl">
              {(currentCategory.metadata?.icon as string) ?? "📦"}
            </span>
            <div>
              <h1 className="text-2xl font-black text-brand-navy small:text-3xl">
                {currentCategory.name}
              </h1>
              <p className="text-sm text-neutral-600">
                {currentCategory.description ||
                  (isLeaf
                    ? `${products.length} product families · prices drop at higher quantities`
                    : `Choose a category: ${children.map((c) => c.name).join(", ")}`)}
              </p>
            </div>
          </header>

          {isLeaf ? (
            products.length ? (
              products.map((p) => (
                <ProductFamilyTable key={p.id} product={p} region={region!} />
              ))
            ) : (
              <div className="panel p-8 text-center text-sm text-neutral-500">
                No products in this category yet.
              </div>
            )
          ) : (
            <SubcategoryTiles categories={categories} parent={currentCategory} />
          )}
        </div>
      </div>
    </div>
  )
}
