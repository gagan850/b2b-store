import { BRAND } from "@/lib/brand"
import { listCategories } from "@/lib/data/categories"
import { childrenOf } from "@/modules/categories/components/category-sidebar"
import { categoryImage } from "@/modules/categories/components/subcategory-tiles"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type Cat = HttpTypes.StoreProductCategory

/** All leaf categories under a department, in order */
const leavesOf = (all: Cat[], id: string): Cat[] =>
  childrenOf(all, id).flatMap((c) => {
    const kids = childrenOf(all, c.id)
    return kids.length ? leavesOf(all, c.id) : [c]
  })

const facts = [
  "Ships today if ordered by 2 PM CT",
  "Will call in Los Angeles, Dallas and Edison",
  "Net terms for business accounts",
]

export default async function Hero(_: { countryCode: string }) {
  const all = await listCategories({ limit: 200 }).catch(() => [] as Cat[])
  const departments = childrenOf(all, null)

  return (
    <div className="content-container flex flex-col gap-10 py-8">
      {/* Banner */}
      <section className="flex flex-col gap-5 rounded-md bg-brand-navy px-6 py-8 text-white small:flex-row small:items-center small:justify-between small:px-10">
        <div className="flex flex-col gap-2">
          <h1 className="font-condensed text-3xl font-bold leading-tight small:text-4xl">
            {BRAND.slogan}
          </h1>
          <p className="max-w-xl text-white/75">{BRAND.tagline}.</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 xsmall:flex-row">
          <LocalizedClientLink href="/store" className="btn-accent px-6 py-3 text-center">
            Shop all products
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/account/quotes"
            className="inline-flex items-center justify-center rounded-md border border-white/40 px-6 py-3 text-sm font-semibold hover:bg-white/10"
          >
            Request a quote
          </LocalizedClientLink>
        </div>
      </section>

      {/* Categories */}
      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-bold text-brand-navy">Shop by category</h2>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 small:grid-cols-4 small:gap-x-6">
          {departments.map((d) => {
            const img = categoryImage(all, d)
            const leaves = leavesOf(all, d.id)
            return (
              <li key={d.id} className="flex flex-col gap-3" data-testid="department">
                <LocalizedClientLink
                  href={`/categories/${d.handle}`}
                  className="group flex flex-col gap-3"
                >
                  <span className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md border border-brand-line bg-white p-4">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt=""
                        className="h-full w-full object-contain transition-transform group-hover:scale-105"
                      />
                    ) : null}
                  </span>
                  <span className="font-bold text-brand-navy group-hover:text-brand-blue">
                    {d.name}
                  </span>
                </LocalizedClientLink>
                {leaves.length > 0 && (
                  <ul className="flex flex-col gap-1 text-sm">
                    {leaves.slice(0, 5).map((c) => (
                      <li key={c.id}>
                        <LocalizedClientLink
                          href={`/categories/${c.handle}`}
                          className="text-neutral-600 hover:text-brand-blue hover:underline"
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* One quiet line of facts */}
      <ul className="flex flex-col gap-1 border-t border-brand-line pt-5 text-sm text-neutral-600 small:flex-row small:gap-0 small:divide-x small:divide-brand-line">
        {facts.map((f) => (
          <li key={f} className="small:px-4 small:first:pl-0">
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}
