import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-2 w-full">
        {product.variants?.[0]?.sku && (
          <span className="text-xs font-semibold text-neutral-500">
            Item # {product.variants[0].sku}
          </span>
        )}
        <Heading
          level="h1"
          className="text-2xl small:text-3xl font-black leading-tight text-brand-navy"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        <Text
          className="text-base text-ui-fg-subtle whitespace-pre-line"
          data-testid="product-description"
        >
          {product.subtitle}
        </Text>
      </div>
    </div>
  )
}

export default ProductInfo
