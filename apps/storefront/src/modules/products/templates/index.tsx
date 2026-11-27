import { listCategories } from "@/lib/data/categories"
import { HttpTypes } from "@medusajs/types"
import CategoryBreadcrumb from "@/modules/categories/category-breadcrumb"
import ProductFamilyTable from "@/modules/categories/components/product-family-table"
import { notFound } from "next/navigation"
import React from "react"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate = async ({ product, region }: ProductTemplateProps) => {
  if (!product || !product.id) {
    return notFound()
  }

  const categories = await listCategories({ limit: 200 })
  const category = categories.find((c) => c.id === product.categories?.[0]?.id)
  const variants = product.variants ?? []
  const skus = variants.map((v) => v.sku).filter(Boolean) as string[]

  const specs: [string, React.ReactNode][] = [
    ["Item #", skus.length > 1 ? `${skus[0]} – ${skus[skus.length - 1]}` : skus[0]],
    [product.options?.[0]?.title ?? "Options", variants.map((v) => v.title).join(", ")],
    ["Material", product.material],
    ["Country of origin", product.origin_country?.toUpperCase()],
  ].filter(([, v]) => !!v) as [string, React.ReactNode][]

  return (
    <div className="content-container flex flex-col gap-4 py-4" data-testid="product-container">
      {category && (
        <nav className="text-sm">
          <CategoryBreadcrumb categories={categories} category={category} />
        </nav>
      )}
      <div className="flex flex-col gap-8 bg-white p-4 small:p-8">
        <div className="grid grid-cols-1 gap-8 small:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex aspect-square w-full max-w-md items-center justify-center self-start border border-brand-line bg-white">
            {product.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.thumbnail}
                alt={product.title}
                className="h-full w-full object-contain"
                data-testid="product-image"
              />
            ) : (
              <span className="text-sm text-neutral-400">No image</span>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <h1
              className="font-condensed text-3xl font-bold text-brand-navy small:text-4xl"
              data-testid="product-title"
            >
              {product.title}
            </h1>
            {product.description && (
              <p className="text-base text-brand-ink" data-testid="product-description">
                {product.description}
              </p>
            )}
            <table className="w-full max-w-lg text-sm">
              <tbody>
                {specs.map(([k, v]) => (
                  <tr key={k} className="border-b border-brand-line">
                    <th className="w-40 py-2 pr-4 text-left font-semibold text-neutral-600">
                      {k}
                    </th>
                    <td className="py-2 text-brand-ink">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm text-neutral-600">
              Prices exclude tax and freight. Buy more, pay less per unit.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-brand-navy">Choose a size and quantity</h2>
          <ProductFamilyTable product={product} region={region} showHeader={false} />
        </div>
      </div>
    </div>
  )
}

export default ProductTemplate
