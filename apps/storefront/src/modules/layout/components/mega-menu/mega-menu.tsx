"use client"

import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type Cat = HttpTypes.StoreProductCategory

/**
 * Compact dropdown under the "Shop by Category" button: departments on the
 * left, the hovered department's categories on the right. No full-width
 * panel and no page blur.
 */
const MegaMenu = ({ categories }: { categories: Cat[] }) => {
  const [open, setOpen] = useState(false)
  const departments = categories.filter((c) => !c.parent_category_id)
  const [active, setActive] = useState<string | null>(departments[0]?.id ?? null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()

  const childrenOf = (id: string) => categories.filter((c) => c.parent_category_id === id)

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const activeDept = departments.find((d) => d.id === active)

  return (
    <div className="relative z-50" onMouseEnter={show} onMouseLeave={hide}>
      <LocalizedClientLink
        className={clx(
          "flex items-center gap-1 rounded px-3 py-2 hover:bg-white/10",
          open && "bg-white/10"
        )}
        href="/store"
        onFocus={show}
      >
        ☰ Shop by Category
      </LocalizedClientLink>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 flex w-[560px] overflow-hidden rounded-md border border-brand-line bg-white font-normal text-brand-ink shadow-xl [&_a]:!text-brand-ink"
          data-testid="category-menu"
        >
          <ul className="w-48 shrink-0 border-r border-brand-line bg-brand-canvas py-2">
            {departments.map((d) => (
              <li key={d.id}>
                <LocalizedClientLink
                  href={`/categories/${d.handle}`}
                  onMouseEnter={() => setActive(d.id)}
                  onFocus={() => setActive(d.id)}
                  className={clx(
                    "flex items-center justify-between px-4 py-2 text-sm font-semibold",
                    active === d.id ? "bg-white" : "hover:bg-white"
                  )}
                >
                  {d.name}
                  <span aria-hidden className="text-neutral-400">›</span>
                </LocalizedClientLink>
              </li>
            ))}
          </ul>

          {activeDept && (
            <div className="flex flex-1 flex-col gap-3 p-4">
              <ul className="flex flex-col gap-1.5 text-sm">
                {childrenOf(activeDept.id).map((c) => {
                  const kids = childrenOf(c.id)
                  return (
                    <li key={c.id}>
                      <LocalizedClientLink
                        href={`/categories/${c.handle}`}
                        className={clx("hover:underline", kids.length && "font-semibold")}
                      >
                        {c.name}
                      </LocalizedClientLink>
                      {kids.length > 0 && (
                        <ul className="mt-1 flex flex-col gap-1 pl-3">
                          {kids.map((k) => (
                            <li key={k.id}>
                              <LocalizedClientLink
                                href={`/categories/${k.handle}`}
                                className="hover:underline"
                              >
                                {k.name}
                              </LocalizedClientLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
              <LocalizedClientLink
                href={`/categories/${activeDept.handle}`}
                className="mt-auto border-t border-brand-line pt-3 text-sm font-semibold hover:underline"
              >
                <span className="text-brand-blue">Shop all {activeDept.name} ›</span>
              </LocalizedClientLink>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MegaMenu
