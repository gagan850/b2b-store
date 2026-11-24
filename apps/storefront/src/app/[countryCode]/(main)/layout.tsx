import { SessionProvider } from "@/lib/context/session-context"
import { getRegion } from "@/lib/data/regions"
import { retrieveSession } from "@/lib/data/session"
import { getBaseURL } from "@/lib/util/env"
import {
  SessionCartMismatchBanner,
  SessionFreeShippingNudge,
} from "@/modules/layout/components/session-banners"
import Footer from "@/modules/layout/templates/footer"
import { NavigationHeader } from "@/modules/layout/templates/nav"
import { BRAND } from "@/lib/brand"
import { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const [session, region] = await Promise.all([
    retrieveSession(),
    getRegion(countryCode),
  ])

  return (
    <SessionProvider session={session}>
      <NavigationHeader currencyCode={region?.currency_code} />
      <div className="border-b border-brand-line bg-brand-accent-light text-[13px] text-brand-ink">
        <ul className="content-container flex flex-wrap items-center justify-center gap-x-8 gap-y-1 py-2">
          {BRAND.promo.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              <span className="font-medium">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <SessionCartMismatchBanner />

      {props.children}

      <Footer />

      <SessionFreeShippingNudge />
    </SessionProvider>
  )
}
