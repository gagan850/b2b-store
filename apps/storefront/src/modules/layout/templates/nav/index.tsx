import { BRAND } from "@/lib/brand"
import { SEARCH_PRICE_CURRENCIES } from "@/lib/search-client"
import BrandLogo from "@/modules/common/components/brand-logo"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { MegaMenuWrapper } from "@/modules/layout/components/mega-menu"
import NavSessionActions from "@/modules/layout/components/nav-session-actions"
import Search from "@/modules/layout/components/search"
import SkeletonMegaMenu from "@/modules/skeletons/components/skeleton-mega-menu"
import { Suspense } from "react"

const utilityLinks = [
  { label: "Quick Order", href: "/store" },
  { label: "Order Status", href: "/account/orders" },
  { label: "Quotes", href: "/account/quotes" },
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
  return (
    <div className="sticky top-0 inset-x-0 z-50 shadow-md">
      {/* Utility bar */}
      <div className="hidden small:block bg-brand-navy text-[12px] text-white/80">
        <div className="content-container flex h-8 items-center justify-between">
          <span>
            Call <span className="font-semibold text-white">{BRAND.phone}</span>{" "}
            · {BRAND.hours}
          </span>
          <ul className="flex items-center gap-5">
            {utilityLinks.map((l) => (
              <li key={l.label}>
                <LocalizedClientLink
                  href={l.href}
                  className="hover:text-white hover:underline"
                >
                  {l.label}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-brand-navy-2 text-white">
        <header className="content-container flex h-[72px] items-center gap-6">
          <LocalizedClientLink href="/" className="shrink-0">
            <BrandLogo inverted />
          </LocalizedClientLink>

          <div className="flex-1">
            <Search currencyCode={currencyCode} variant="bar" />
          </div>

          <div className="nav-dark flex shrink-0 items-center gap-1 text-sm">
            <NavSessionActions />
          </div>
        </header>
      </div>

      {/* Category bar */}
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
                <LocalizedClientLink
                  href={l.href}
                  className="hover:underline underline-offset-4"
                >
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
