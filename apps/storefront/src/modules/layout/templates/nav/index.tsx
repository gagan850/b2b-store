import { BRAND } from "@/lib/brand"
import { listCategories } from "@/lib/data/categories"
import { SEARCH_PRICE_CURRENCIES } from "@/lib/search-client"
import BrandLogo from "@/modules/common/components/brand-logo"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { MegaMenuWrapper } from "@/modules/layout/components/mega-menu"
import MobileMenu from "@/modules/layout/components/mobile-menu"
import NavSessionActions from "@/modules/layout/components/nav-session-actions"
import InlineSearch from "@/modules/layout/components/search/inline"
import SkeletonMegaMenu from "@/modules/skeletons/components/skeleton-mega-menu"
import { Suspense } from "react"

const utilityLinks = [
  { label: "Quick Order", href: "/store" },
  { label: "Order Status", href: "/account/orders" },
  { label: "Shipping", href: "/shipping" },
  { label: "Returns", href: "/returns" },
  { label: "Contact", href: "/contact" },
]

const categoryLinks = [
  { label: "All Products", href: "/store" },
  { label: "New Arrivals", href: "/store?sortBy=created_at" },
  { label: "On Sale", href: "/store" },
]

export async function NavigationHeader({
  currencyCode = SEARCH_PRICE_CURRENCIES[0],
}: {
  currencyCode?: string
}) {
  const categories = await listCategories({ limit: 200 }).catch(() => [])

  return (
    <div className="sticky top-0 inset-x-0 z-50 bg-white shadow-md">
      {/* Utility bar (desktop) */}
      <div className="hidden small:block bg-brand-navy text-[12px] text-white/80">
        <div className="content-container flex h-8 items-center justify-between">
          <span>
            Customer service{" "}
            <span className="font-semibold text-white">{BRAND.phone}</span>
            {BRAND.hours ? ` · ${BRAND.hours}` : ""}
          </span>
          <ul className="flex items-center gap-5">
            {utilityLinks.map((l) => (
              <li key={l.label}>
                <LocalizedClientLink href={l.href} className="hover:text-white hover:underline">
                  {l.label}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main header */}
      <header className="content-container flex flex-wrap items-center gap-x-3 gap-y-2 py-2 small:h-[72px] small:flex-nowrap small:gap-6 small:py-0">
        <MobileMenu categories={categories} />
        <LocalizedClientLink href="/" className="shrink-0" aria-label={`${BRAND.name} home`}>
          <BrandLogo className="hidden xsmall:flex" />
          <BrandLogo compact className="xsmall:hidden" />
        </LocalizedClientLink>

        <div className="order-last w-full small:order-none small:flex-1">
          <InlineSearch currencyCode={currencyCode} />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 text-sm text-brand-navy">
          <NavSessionActions />
        </div>
      </header>

      {/* Category bar (desktop) */}
      <div className="hidden small:block bg-brand-blue text-sm text-white">
        <div className="content-container flex h-10 items-center gap-6">
          <nav className="nav-dark font-semibold">
            <Suspense fallback={<SkeletonMegaMenu />}>
              <MegaMenuWrapper />
            </Suspense>
          </nav>
          <span className="h-5 w-px bg-white/30" />
          <ul className="flex items-center gap-6">
            {categoryLinks.map((l) => (
              <li key={l.label}>
                <LocalizedClientLink href={l.href} className="hover:underline underline-offset-4">
                  {l.label}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
