import { listCategories } from "@/lib/data/categories"
import { BRAND } from "@/lib/brand"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { childrenOf } from "@/modules/categories/components/category-sidebar"
import SubcategoryTiles from "@/modules/categories/components/subcategory-tiles"

const accountLinks = [
  { label: "Reorder past purchases", href: "/account/orders" },
  { label: "Track an order", href: "/account/orders" },
  { label: "My quotes", href: "/account/quotes" },
  { label: "Approvals", href: "/account/approvals" },
  { label: "Company & buyers", href: "/account/company" },
]

const valueProps = [
  {
    title: "Ready to ship",
    body: "Stocked packaging shipped from the warehouse nearest you.",
    color: "bg-status-ok-bg text-status-ok",
    icon: "🚚",
  },
  {
    title: "Net 30 terms",
    body: "Bill to your account, or pay by card. Credit checks in minutes.",
    color: "bg-status-info-bg text-status-info",
    icon: "🧾",
  },
  {
    title: "Volume pricing",
    body: "Price breaks by quantity and contract pricing for your company.",
    color: "bg-brand-accent-light text-brand-accent-dark",
    icon: "📦",
  },
  {
    title: "Custom quotes",
    body: "Request a quote from your cart and get a reply within one business day.",
    color: "bg-status-warn-bg text-status-warn",
    icon: "💬",
  },
]

export default async function Hero({ countryCode }: { countryCode: string }) {
  const all = await listCategories({ limit: 200 }).catch(() => [])
  const categories = childrenOf(all, null)

  return (
    <div className="content-container flex flex-col gap-4 py-4">
      <div className="grid grid-cols-1 gap-4 small:grid-cols-[240px_1fr_280px]">
        {/* Category sidebar */}
        <aside className="panel relative hidden small:block">
          <div className="panel-title rounded-t-md">Shop by Category</div>
          <ul className="divide-y divide-brand-line text-sm">
            {categories.map((c) => (
              <li key={c.id} className="group">
                <LocalizedClientLink
                  href={`/categories/${c.handle}`}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-brand-blue-light hover:text-brand-blue group-hover:bg-brand-blue-light group-hover:text-brand-blue"
                >
                  <span className="flex items-center gap-2">
                    <span>{(c.metadata?.icon as string) ?? "•"}</span>
                    {c.name}
                  </span>
                  <span className="text-neutral-400">›</span>
                </LocalizedClientLink>
                {/* Flyout: drill into sub-categories without leaving the page */}
                <div className="absolute left-full top-0 z-30 hidden min-h-full w-[560px] border-l-4 border-brand-accent bg-white p-6 shadow-xl group-hover:block">
                  <p className="mb-4 text-lg font-black text-brand-navy">{c.name}</p>
                  <div className="grid grid-cols-2 gap-6">
                    {childrenOf(all, c.id).map((sub) => (
                      <div key={sub.id} className="flex flex-col gap-1">
                        <LocalizedClientLink
                          href={`/categories/${sub.handle}`}
                          className="font-bold text-brand-ink hover:text-brand-blue hover:underline"
                        >
                          {sub.name}
                        </LocalizedClientLink>
                        {childrenOf(all, sub.id).map((leaf) => (
                          <LocalizedClientLink
                            key={leaf.id}
                            href={`/categories/${leaf.handle}`}
                            className="text-sm text-brand-blue hover:underline"
                          >
                            {leaf.name}
                          </LocalizedClientLink>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            ))}
            <li>
              <LocalizedClientLink
                href="/store"
                className="block px-4 py-2.5 font-semibold text-brand-blue hover:underline"
              >
                View all products ›
              </LocalizedClientLink>
            </li>
          </ul>
        </aside>

        {/* Banner */}
        <section className="relative overflow-hidden rounded-md bg-gradient-to-br from-brand-navy via-brand-navy-2 to-brand-blue p-6 text-white xsmall:p-8 small:p-12">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-accent/20" />
          <div className="absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/5" />
          <div className="relative flex h-full max-w-xl flex-col justify-center gap-4">
            <span className="chip w-fit bg-brand-accent text-white">
              Wholesale pricing for business accounts
            </span>
            <h1 className="font-condensed text-3xl font-bold leading-tight xsmall:text-4xl small:text-5xl">
              {BRAND.slogan}
            </h1>
            <p className="text-white/80">{BRAND.tagline}.</p>
            <div className="flex flex-col gap-3 pt-2 xsmall:flex-row xsmall:flex-wrap">
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
        </section>

        {/* Quick order + account */}
        <div className="flex flex-col gap-4">
          <form
            action={`/${countryCode}/search`}
            className="panel overflow-hidden"
          >
            <div className="panel-title">Quick Order</div>
            <div className="flex flex-col gap-2 p-4">
              <label className="text-xs font-semibold text-neutral-600" htmlFor="qo">
                Item # or keyword
              </label>
              <input
                id="qo"
                name="q"
                placeholder="e.g. S-4021"
                className="rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-blue"
              />
              <button type="submit" className="btn-brand w-full">
                Find item
              </button>
            </div>
          </form>
          <div className="panel hidden overflow-hidden small:block">
            <div className="panel-title">My Account</div>
            <ul className="divide-y divide-brand-line text-sm">
              {accountLinks.map((l) => (
                <li key={l.label}>
                  <LocalizedClientLink
                    href={l.href}
                    className="block px-4 py-2 text-brand-blue hover:bg-brand-blue-light"
                  >
                    {l.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Value props */}
      <ul className="grid grid-cols-1 gap-4 xsmall:grid-cols-2 small:grid-cols-4">
        {valueProps.map((v) => (
          <li key={v.title} className="panel flex items-start gap-3 p-4">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-lg ${v.color}`}
            >
              {v.icon}
            </span>
            <div>
              <p className="font-bold text-brand-navy">{v.title}</p>
              <p className="text-xs text-neutral-600">{v.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-3 pt-2">
        <div className="flex items-end justify-between border-b-2 border-brand-navy pb-2">
          <h2 className="text-lg font-black uppercase tracking-tight text-brand-navy">
            Shop by Department
          </h2>
          <LocalizedClientLink href="/store" className="text-sm font-semibold text-brand-blue hover:underline">
            View all products ›
          </LocalizedClientLink>
        </div>
        <SubcategoryTiles categories={all} parent={null} />
      </section>
    </div>
  )
}
