import { getProductPrice } from "@/lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { Text, clx } from "@medusajs/ui"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewAddToCart from "./preview-add-to-cart"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  if (!product) {
    return null
  }

  const { cheapestPrice } = getProductPrice({
    product,
  })

  const itemNumber = product.variants?.[0]?.sku
  const variantCount = product.variants?.length ?? 0
  // Stock is only known when the listing fetched inventory; otherwise don't guess.
  const variants = product.variants ?? []
  const known = variants.some((v) => typeof v?.inventory_quantity === "number")
  const available = variants.some(
    (v) =>
      v?.manage_inventory === false ||
      v?.allow_backorder ||
      (v?.inventory_quantity ?? 0) > 0
  )
  const stock = !known
    ? null
    : available
    ? { label: "In stock", cls: "chip-ok" }
    : { label: "Out of stock", cls: "chip-bad" }

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div
        data-testid="product-wrapper"
        className="flex h-full flex-col gap-2 overflow-hidden rounded-md border border-brand-line bg-white p-3 transition-all duration-150 group-hover:border-brand-blue group-hover:shadow-md"
      >
        <div className="relative aspect-square w-full p-4">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            alt={product.title}
            size="square"
            isFeatured={isFeatured}
          />
        </div>
        {itemNumber && (
          <Text className="text-[11px] font-semibold text-neutral-500">
            Item # {itemNumber}
            {variantCount > 1 ? ` + ${variantCount - 1} more` : ""}
          </Text>
        )}
        <Text
          className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-brand-blue group-hover:underline"
          data-testid="product-title"
        >
          {product.title}
        </Text>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
            <Text className="text-[10px] text-neutral-500">
              {variantCount > 1 ? "Starting price · excl. tax" : "Excl. tax · per unit"}
            </Text>
          </div>
          {variantCount > 1 ? (
            <span className="text-sm font-semibold text-brand-blue group-hover:underline">
              {variantCount} sizes ›
            </span>
          ) : (
            <PreviewAddToCart product={product} region={region} />
          )}
        </div>
        {stock && (
          <span className={clx("chip w-fit", stock.cls)}>{stock.label}</span>
        )}
      </div>
    </LocalizedClientLink>
  )
}
