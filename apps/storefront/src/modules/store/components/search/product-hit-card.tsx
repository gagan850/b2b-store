"use client"

import { convertToLocale } from "@/lib/util/money"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import {
  hitPricing,
  type ProductHit,
} from "@/modules/layout/components/search/hit"
import Thumbnail from "@/modules/products/components/thumbnail"
import { Text, clx } from "@medusajs/ui"

const ProductHitCard = ({
  hit,
  currencyCode,
}: {
  hit: ProductHit
  currencyCode: string
}) => {
  // Without a handle there's no product page to link to.
  if (!hit.handle) {
    return null
  }

  const pricing = hitPricing(hit, currencyCode)
  const format = (value: number) =>
    convertToLocale({ amount: value, currency_code: pricing.currency_code })

  const max = pricing.max_price ?? pricing.min_price
  const isRange = pricing.min_price !== null && (max ?? 0) > pricing.min_price

  return (
    <LocalizedClientLink href={`/products/${hit.handle}`} className="group">
      <div
        data-testid="product-wrapper"
        className="flex h-full flex-col gap-2 overflow-hidden rounded-md border border-brand-line bg-white p-3 transition-all duration-150 group-hover:border-brand-blue group-hover:shadow-md"
      >
        <div className="relative aspect-square w-full p-4">
          <Thumbnail thumbnail={hit.thumbnail as string | null} size="square" />
        </div>

        <div className="flex flex-col txt-compact-medium">
          <Text className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-brand-blue group-hover:underline" data-testid="product-title">
            {hit.title}
          </Text>
        </div>

        {pricing.min_price !== null && (
          <div className="mt-auto flex flex-col gap-0">
            <div className="flex items-center gap-x-2">
              {/* A range already spans the discount, so the struck-through
                  original would describe only the cheapest variant. */}
              {!isRange && pricing.on_sale && (
                <Text className="line-through text-ui-fg-muted text-xs">
                  {format(pricing.original_price!)}
                </Text>
              )}
              <Text
                className={clx("text-brand-navy font-black text-base", {
                  "!text-status-bad": pricing.on_sale,
                })}
              >
                {isRange
                  ? `${format(pricing.min_price)} - ${format(max!)}`
                  : format(pricing.min_price)}
              </Text>
              {!isRange && pricing.on_sale && (
                <Text className="text-xs text-ui-fg-interactive">
                  -{pricing.discount_percentage}%
                </Text>
              )}
            </div>
            <Text className="text-neutral-500 text-[10px]">Excl. tax · per unit</Text>
          </div>
        )}
        <span className="btn-accent mt-1 w-full py-1.5">View options</span>
      </div>
    </LocalizedClientLink>
  )
}

export default ProductHitCard
