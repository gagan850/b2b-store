import { BRAND } from "@/lib/brand"
import BrandLogo from "@/modules/common/components/brand-logo"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mb-2 w-full bg-white relative small:min-h-screen">
      <div className="h-16 border-b border-brand-line bg-white">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink href="/" aria-label={`${BRAND.name} home`}>
            <BrandLogo />
          </LocalizedClientLink>
          <span className="flex items-center gap-2 text-xs text-neutral-600 small:text-sm">
            🔒 Secure checkout
            <span className="hidden xsmall:inline">
              · Questions? <span className="font-semibold text-brand-navy">{BRAND.phone}</span>
            </span>
          </span>
        </nav>
      </div>
      <div className="relative bg-brand-canvas" data-testid="checkout-container">
        {children}
      </div>
    </div>
  )
}
