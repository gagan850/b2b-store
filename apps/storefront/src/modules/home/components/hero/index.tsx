import { BRAND } from "@/lib/brand"
import { listCategories } from "@/lib/data/categories"
import { listProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { childrenOf } from "@/modules/categories/components/category-sidebar"
import { categoryImage } from "@/modules/categories/components/subcategory-tiles"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import ProductPreview from "@/modules/products/components/product-preview"
import { HttpTypes } from "@medusajs/types"

type Cat = HttpTypes.StoreProductCategory

/* Simple line icons, so the page carries no emoji */
const Icon = ({ d }: { d: string }) => (
  <svg
    viewBox="0 0 24 24"
    className="h-6 w-6 shrink-0 text-brand-blue"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d={d} />
  </svg>
)

const services = [
  {
    title: "Ships today",
    body: "In-stock orders placed by 2 PM CT",
    icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  },
  {
    title: "Will call",
    body: "Pick up at Los Angeles, Dallas or Edison",
    icon: "M3 10l9-6 9 6v10H3zM9 20v-6h6v6",
  },
  {
    title: "Bill to account",
    body: "Net terms for business accounts, or pay by card",
    icon: "M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h4",
  },
  {
    title: "Volume pricing",
    body: "Price breaks on every item, quotes in one day",
    icon: "M20 12l-8 8-9-9V3h8zM7.5 7.5h.01",
  },
]

/** All leaf categories under a department, in order */
const leavesOf = (all: Cat[], id: string): Cat[] =>
  childrenOf(all, id).flatMap((c) => {
    const kids = childrenOf(all, c.id)
    return kids.length ? leavesOf(all, c.id) : [c]
  })

export default async function Hero({ countryCode }: { countryCode: string }) {
  const [all, region] = await Promise.all([
    listCategories({ limit: 200 }).catch(() => [] as Cat[]),
    getRegion(countryCode),
  ])
  const departments = childrenOf(all, null)
  const products = region
    ? (
        await listProducts({ countryCode, queryParams: { limit: 6 } }).catch(() => ({
          response: { products: [] as HttpTypes.StoreProduct[] },
        }))
      ).response.products
    : []

  return (
    <div className="content-container flex flex-col gap-8 py-6">
      {/* 1. Banner with quick order */}
      <section className="grid grid-cols-1 overflow-hidden rounded-md bg-gradient-to-br from-brand-navy via-brand-navy-2 to-brand-blue text-white small:grid-cols-[1fr_340px]">
        <div className="flex flex-col justify-center gap-4 p-6 xsmall:p-8 small:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-accent">
            Wholesale packaging for business
          </p>
          <h1 className="font-condensed text-3xl font-bold leading-tight xsmall:text-4xl small:text-[44px]">
            {BRAND.slogan}
          </h1>
          <p className="max-w-lg text-white/80">{BRAND.tagline}.</p>
          <div className="flex flex-col gap-3 pt-1 xsmall:flex-row">
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
        </div>
        <form
          action={`/${countryCode}/search`}
          className="flex flex-col justify-center gap-3 bg-white p-6 text-brand-ink small:m-6 small:rounded-md"
        >
          <h2 className="text-lg font-bold text-brand-navy">Quick order</h2>
          <label className="text-sm text-neutral-600" htmlFor="qo">
            Know the item number? Find it fast.
          </label>
          <input
            id="qo"
            name="q"
            placeholder="Item # or keyword, e.g. S-4121"
            className="rounded-md border border-brand-line px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
          />
          <button type="submit" className="btn-brand w-full py-2.5">
            Find item
          </button>
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-brand-line pt-3 text-sm">
            <LocalizedClientLink href="/account/orders" className="font-semibold text-brand-blue hover:underline">
              Reorder past purchases
            </LocalizedClientLink>
            <LocalizedClientLink href="/account/orders" className="text-brand-blue hover:underline">
              Track an order
            </LocalizedClientLink>
          </div>
        </form>
      </section>

      {/* 2. Why buy from LK */}
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-brand-line small:grid-cols-4">
        {services.map((s) => (
          <li key={s.title} className="flex items-start gap-3 bg-white px-4 py-3 small:px-5 small:py-4">
            <Icon d={s.icon} />
            <div>
              <p className="font-bold text-brand-navy">{s.title}</p>
              <p className="text-xs text-neutral-600 small:text-sm">{s.body}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* 3. Category directory */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between border-b-2 border-brand-navy pb-2">
          <h2 className="text-xl font-black uppercase tracking-tight text-brand-navy">
            Shop by category
          </h2>
          <LocalizedClientLink href="/store" className="text-sm font-semibold text-brand-blue hover:underline">
            All products ›
          </LocalizedClientLink>
        </div>
        <div className="grid grid-cols-1 gap-4 small:grid-cols-2">
          {departments.map((d) => {
            const leaves = leavesOf(all, d.id)
            return (
              <div key={d.id} className="flex flex-col rounded-md bg-white" data-testid="department">
                <div className="flex items-center justify-between border-b border-brand-line px-5 py-3">
                  <LocalizedClientLink
                    href={`/categories/${d.handle}`}
                    className="text-lg font-bold text-brand-navy hover:text-brand-blue"
                  >
                    {d.name}
                  </LocalizedClientLink>
                  <LocalizedClientLink
                    href={`/categories/${d.handle}`}
                    className="text-sm font-semibold text-brand-blue hover:underline"
                  >
                    Shop all ›
                  </LocalizedClientLink>
                </div>
                <ul className="grid grid-cols-3 gap-2 p-3 xsmall:grid-cols-4">
                  {leaves.slice(0, 4).map((c) => {
                    const img = categoryImage(all, c)
                    return (
                      <li key={c.id}>
                        <LocalizedClientLink
                          href={`/categories/${c.handle}`}
                          className="group flex flex-col items-center gap-2 rounded-md p-2 text-center hover:bg-brand-canvas"
                          data-testid="category-tile"
                        >
                          <span className="flex aspect-square w-full items-center justify-center">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={img}
                                alt=""
                                className="h-full w-full object-contain transition-transform group-hover:scale-105"
                              />
                            ) : null}
                          </span>
                          <span className="text-sm font-semibold leading-tight text-brand-ink group-hover:text-brand-blue group-hover:underline">
                            {c.name}
                          </span>
                        </LocalizedClientLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. Popular items */}
      {region && products.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between border-b-2 border-brand-navy pb-2">
            <h2 className="text-xl font-black uppercase tracking-tight text-brand-navy">
              Popular items
            </h2>
            <LocalizedClientLink href="/store" className="text-sm font-semibold text-brand-blue hover:underline">
              See more ›
            </LocalizedClientLink>
          </div>
          <ul className="grid grid-cols-2 gap-3 small:grid-cols-3 medium:grid-cols-6">
            {products.map((p) => (
              <li key={p.id}>
                <ProductPreview product={p} region={region} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 5. Help */}
      <section className="grid grid-cols-1 gap-4 rounded-md bg-white p-6 small:grid-cols-3">
        <div>
          <h3 className="font-bold text-brand-navy">Talk to a packaging specialist</h3>
          <p className="text-sm text-neutral-600">
            Call <strong className="text-brand-navy">{BRAND.phone}</strong>, Monday to Friday.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-brand-navy">Need custom sizes or large volumes?</h3>
          <p className="text-sm text-neutral-600">
            <LocalizedClientLink href="/account/quotes" className="font-semibold text-brand-blue hover:underline">
              Request a quote
            </LocalizedClientLink>{" "}
            and we reply within one business day.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-brand-navy">New to LK?</h3>
          <p className="text-sm text-neutral-600">
            <LocalizedClientLink href="/account" className="font-semibold text-brand-blue hover:underline">
              Open a business account
            </LocalizedClientLink>{" "}
            for net terms, contract pricing and multiple buyers.
          </p>
        </div>
      </section>
    </div>
  )
}
