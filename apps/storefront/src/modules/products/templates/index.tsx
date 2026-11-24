import { HttpTypes } from "@medusajs/types"
import ImageGallery from "@/modules/products/components/image-gallery"
import ProductActions from "@/modules/products/components/product-actions"
import ProductTabs from "@/modules/products/components/product-tabs"
import RelatedProducts from "@/modules/products/components/related-products"
import ProductInfo from "@/modules/products/templates/product-info"
import SkeletonRelatedProducts from "@/modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import React, { Suspense } from "react"
import ProductFacts from "../components/product-facts"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <div className="flex flex-col gap-y-4 py-4">
      <div
        className="content-container grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-4 w-full h-fit"
        data-testid="product-container"
      >
        <ImageGallery product={product} />
        <div className="panel flex flex-col w-full gap-5 items-start justify-start small:p-8 p-5 h-full">
          <ProductInfo product={product} />
          <ProductActions product={product} region={region} />
          <ProductFacts product={product} />
        </div>
      </div>
      <div className="content-container">
        <ProductTabs product={product} />
      </div>
      <div
        className="content-container"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </div>
  )
}

export default ProductTemplate
