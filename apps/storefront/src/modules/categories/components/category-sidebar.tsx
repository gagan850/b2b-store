import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type Cat = HttpTypes.StoreProductCategory

export const childrenOf = (categories: Cat[], id: string | null) =>
  categories
    .filter((c) => (c.parent_category_id ?? null) === id)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

export const ancestorsOf = (categories: Cat[], cat: Cat) => {
  const chain: Cat[] = []
  let cur: Cat | undefined = cat
  while (cur) {
    chain.unshift(cur)
    cur = categories.find((c) => c.id === cur!.parent_category_id)
  }
  return chain
}

/** Left-hand tree: the top-level department, expanded down to the current category. */
export default function CategorySidebar({
  categories,
  current,
}: {
  categories: Cat[]
  current: Cat
}) {
  const chain = ancestorsOf(categories, current)
  const top = chain[0]
  const openIds = new Set(chain.map((c) => c.id))

  const Branch = ({ parent, depth }: { parent: Cat; depth: number }) => (
    <ul className={clx(depth > 0 && "ml-3 border-l border-brand-line")}>
      {childrenOf(categories, parent.id).map((c) => {
        const active = c.id === current.id
        return (
          <li key={c.id}>
            <LocalizedClientLink
              href={`/categories/${c.handle}`}
              className={clx(
                "block px-3 py-1.5 text-sm hover:text-brand-blue hover:underline",
                active
                  ? "font-bold text-brand-blue bg-brand-blue-light"
                  : "text-brand-ink"
              )}
            >
              {c.name}
            </LocalizedClientLink>
            {openIds.has(c.id) && childrenOf(categories, c.id).length > 0 && (
              <Branch parent={c} depth={depth + 1} />
            )}
          </li>
        )
      })}
    </ul>
  )

  return (
    <aside className="hidden w-full flex-col gap-4 small:flex small:w-[240px] small:shrink-0">
      <div className="panel overflow-hidden">
        <LocalizedClientLink
          href={`/categories/${top.handle}`}
          className="panel-title block hover:underline"
        >
          {top.name}
        </LocalizedClientLink>
        <div className="py-2">
          <Branch parent={top} depth={0} />
        </div>
      </div>
      <div className="panel overflow-hidden">
        <div className="panel-title">All Departments</div>
        <ul className="py-2">
          {childrenOf(categories, null).map((c) => (
            <li key={c.id}>
              <LocalizedClientLink
                href={`/categories/${c.handle}`}
                className={clx(
                  "flex items-center gap-2 px-3 py-1.5 text-sm hover:text-brand-blue hover:underline",
                  c.id === top.id && "font-bold text-brand-blue"
                )}
              >
                <span>{(c.metadata?.icon as string) ?? "•"}</span>
                {c.name}
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
