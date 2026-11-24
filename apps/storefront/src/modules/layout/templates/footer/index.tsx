import { BRAND } from "@/lib/brand"
import { listCategories } from "@/lib/data/categories"
import BrandLogo from "@/modules/common/components/brand-logo"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

const service = [
  { label: "Contact us", href: "/contact" },
  { label: "Shipping information", href: "/shipping" },
  { label: "Returns", href: "/returns" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of sale", href: "/terms" },
]

const account = [
  { label: "Sign in / Register", href: "/account" },
  { label: "Order history", href: "/account/orders" },
  { label: "Quotes", href: "/account/quotes" },
  { label: "Approvals", href: "/account/approvals" },
  { label: "Company & buyers", href: "/account/company" },
]

export default async function Footer() {
  const categories = (
    await listCategories({ offset: 0, limit: 200, fields: "id,name,handle,parent_category_id,rank" }).catch(() => [])
  ).filter((c) => !c.parent_category_id)

  const Column = ({
    title,
    links,
  }: {
    title: string
    links: { label: string; href: string }[]
  }) => (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-bold uppercase tracking-wide text-white">
        {title}
      </span>
      <ul className="flex flex-col gap-2 text-sm text-white/70">
        {links.map((l) => (
          <li key={l.label}>
            <LocalizedClientLink href={l.href} className="hover:text-white hover:underline">
              {l.label}
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <footer className="mt-8 w-full bg-brand-navy text-white">
      <div className="content-container grid grid-cols-2 gap-8 py-12 small:grid-cols-5">
        <div className="col-span-2 flex flex-col gap-4 small:col-span-1">
          <BrandLogo inverted />
          <p className="text-sm text-white/70">{BRAND.tagline}.</p>
          <div className="rounded-md bg-white/5 p-3 text-sm">
            <p className="text-white/60">Customer service</p>
            <p className="text-lg font-black">{BRAND.phone}</p>
            <p className="text-xs text-white/60">{BRAND.hours}</p>
          </div>
        </div>
        <Column
          title="Shop"
          links={[
            { label: "All products", href: "/store" },
            ...categories.map((c) => ({ label: c.name, href: `/categories/${c.handle}` })),
          ]}
        />
        <Column title="Customer service" links={service} />
        <Column title="My account" links={account} />
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wide text-white">
            Open an account
          </span>
          <p className="text-sm text-white/70">
            Get net terms, contract pricing and multiple buyers under one company.
          </p>
          <LocalizedClientLink href="/account" className="btn-accent w-fit">
            Apply now
          </LocalizedClientLink>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="content-container flex h-12 items-center justify-between text-xs text-white/50">
          <span>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</span>
          <span>Prices exclude tax and freight.</span>
        </div>
      </div>
    </footer>
  )
}
