import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { childrenOf } from "./category-sidebar"

type Cat = HttpTypes.StoreProductCategory

/** First product image found anywhere under a category, used as its tile picture. */
export const categoryImage = (categories: Cat[], cat: Cat): string | null => {
  const own = (cat.products ?? []).find((p: any) => p.thumbnail) as any
  if (own) return own.thumbnail
  for (const child of childrenOf(categories, cat.id)) {
    const img = categoryImage(categories, child)
    if (img) return img
  }
  return (cat.metadata?.image as string) ?? null
}

/** Picture grid of child categories: image, name, nothing else. */
export default function SubcategoryTiles({
  categories,
  parent,
}: {
  categories: Cat[]
  parent: Cat | null
}) {
  const kids = childrenOf(categories, parent?.id ?? null)

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 small:grid-cols-4">
      {kids.map((c) => {
        const img = categoryImage(categories, c)
        return (
          <li key={c.id}>
            <LocalizedClientLink
              href={`/categories/${c.handle}`}
              className="group flex flex-col items-center gap-3 text-center"
              data-testid="category-tile"
            >
              <span className="flex aspect-square w-full max-w-[220px] items-center justify-center overflow-hidden bg-white">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-contain transition-transform group-hover:scale-105"
                  />
                ) : (
                  <span className="text-6xl">{(c.metadata?.icon as string) ?? "📦"}</span>
                )}
              </span>
              <span className="text-base font-bold text-brand-navy group-hover:text-brand-blue group-hover:underline">
                {c.name}
              </span>
            </LocalizedClientLink>
          </li>
        )
      })}
    </ul>
  )
}
