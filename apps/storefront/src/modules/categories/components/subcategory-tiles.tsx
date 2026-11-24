import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { childrenOf } from "./category-sidebar"

type Cat = HttpTypes.StoreProductCategory

/** Drill-down grid: each child category as a tile, listing its own children underneath. */
export default function SubcategoryTiles({
  categories,
  parent,
}: {
  categories: Cat[]
  parent: Cat | null
}) {
  const kids = childrenOf(categories, parent?.id ?? null)

  return (
    <ul className="grid grid-cols-1 gap-4 xsmall:grid-cols-2 medium:grid-cols-3 large:grid-cols-4">
      {kids.map((c) => {
        const grandkids = childrenOf(categories, c.id)
        return (
          <li key={c.id} className="panel flex flex-col overflow-hidden">
            <LocalizedClientLink
              href={`/categories/${c.handle}`}
              className="group flex items-center gap-4 border-b border-brand-line p-4 hover:bg-brand-blue-light"
            >
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-brand-canvas text-3xl">
                {(c.metadata?.icon as string) ?? "📦"}
              </span>
              <span className="text-base font-black leading-tight text-brand-navy group-hover:text-brand-blue group-hover:underline">
                {c.name}
              </span>
            </LocalizedClientLink>
            <ul className="flex flex-1 flex-col gap-1 p-4 text-sm">
              {grandkids.length > 0 ? (
                grandkids.map((g) => (
                  <li key={g.id}>
                    <LocalizedClientLink
                      href={`/categories/${g.handle}`}
                      className="text-brand-blue hover:underline"
                    >
                      › {g.name}
                    </LocalizedClientLink>
                  </li>
                ))
              ) : (
                <li className="text-neutral-500">
                  {c.products?.length ?? 0} product families
                </li>
              )}
            </ul>
            <LocalizedClientLink
              href={`/categories/${c.handle}`}
              className="border-t border-brand-line px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-blue hover:bg-brand-blue-light"
            >
              Shop {c.name} ›
            </LocalizedClientLink>
          </li>
        )
      })}
    </ul>
  )
}
