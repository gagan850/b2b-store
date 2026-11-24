"use client"

import Login from "@/modules/account/components/login"
import Register from "@/modules/account/components/register"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export enum LOGIN_VIEW {
  LOG_IN = "log-in",
  REGISTER = "register",
}

const LoginTemplate = ({ regions }: { regions: HttpTypes.StoreRegion[] }) => {
  const route = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [currentView, setCurrentView] = useState<LOGIN_VIEW>(() => {
    const viewFromUrl = searchParams.get("view") as LOGIN_VIEW
    return viewFromUrl && Object.values(LOGIN_VIEW).includes(viewFromUrl)
      ? viewFromUrl
      : LOGIN_VIEW.LOG_IN
  })

  useEffect(() => {
    if (searchParams.has("view")) {
      const newParams = new URLSearchParams(searchParams)
      newParams.delete("view")
      router.replace(
        `${route}${newParams.toString() ? `?${newParams.toString()}` : ""}`,
        { scroll: false }
      )
    }
  }, [searchParams, route, router])

  const updateView = (view: LOGIN_VIEW) => {
    setCurrentView(view)
    router.push(`/account?view=${view}`)
  }

  return (
    <div className="content-container grid grid-cols-1 small:grid-cols-2 gap-0 my-6 bg-white">
      <div className="flex justify-center items-center p-6 small:p-12 h-full">
        {currentView === LOGIN_VIEW.LOG_IN ? (
          <Login setCurrentView={updateView} />
        ) : (
          <Register setCurrentView={updateView} regions={regions} />
        )}
      </div>

      <div className="flex flex-col justify-center gap-6 bg-brand-navy p-8 text-white small:p-12">
        <h2 className="font-condensed text-3xl font-bold small:text-4xl">
          Why open an LK Packaging account
        </h2>
        <ul className="flex flex-col gap-4 text-base">
          {[
            ["Net terms", "Approved accounts can bill orders to the account and pay on terms."],
            ["Your pricing", "See volume and contract prices for your company on every item."],
            ["Your whole team", "Add buyers, set spending limits and approve orders."],
            ["Quotes and reorders", "Request a quote from your cart and reorder past purchases in one click."],
          ].map(([t, d]) => (
            <li key={t} className="border-l-4 border-brand-accent pl-4">
              <p className="font-bold">{t}</p>
              <p className="text-sm text-white/80">{d}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm text-white/80">Questions? Call 800.809.8393.</p>
      </div>
    </div>
  )
}

export default LoginTemplate
