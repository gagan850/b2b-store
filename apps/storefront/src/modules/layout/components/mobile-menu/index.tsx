"use client"

import { BRAND } from "@/lib/brand"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

type Cat = HttpTypes.StoreProductCategory

const quickLinks = [
  { label: "All products", href: "/store" },
  { label: "Order status", href: "/account/orders" },
  { label: "My quotes", href: "/account/quotes" },
  { label: "Contact us", href: "/contact" },
]

/** Phone/tablet navigation: a slide-in drawer with an expandable category tree. */
export default function MobileMenu({ categories }: { categories: Cat[] }) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const pathname = usePathname()

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const kids = (id: string | null) =>
    categories
      .filter((c) => (c.parent_category_id ?? null) === id)
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

  const Tree = ({ parent, depth }: { parent: string | null; depth: number }) => (
    <ul className={clx(depth > 0 && "ml-4 border-l-2 border-brand-blue-light")}>
      {kids(parent).map((c) => {
        const hasKids = kids(c.id).length > 0
        return (
          <li key={c.id} className={clx(depth === 0 && "border-b border-brand-line")}>
            <div className="flex items-center justify-between">
              <LocalizedClientLink
                href={`/categories/${c.handle}`}
                className={clx(
                  "flex-1 px-4 py-3",
                  depth === 0 ? "font-bold text-brand-navy" : "text-brand-ink"
                )}
              >
                {depth === 0 && c.metadata?.icon ? (
                  <span className="mr-2">{c.metadata.icon as string}</span>
                ) : null}
                {c.name}
              </LocalizedClientLink>
              {hasKids && (
                <button
                  aria-label={`${expanded[c.id] ? "Collapse" : "Expand"} ${c.name}`}
                  aria-expanded={!!expanded[c.id]}
                  onClick={() => setExpanded((e) => ({ ...e, [c.id]: !e[c.id] }))}
                  className="h-12 w-12 text-xl text-brand-blue"
                >
                  {expanded[c.id] ? "−" : "+"}
                </button>
              )}
            </div>
            {hasKids && expanded[c.id] && <Tree parent={c.id} depth={depth + 1} />}
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded text-2xl text-brand-navy hover:bg-brand-blue-light small:hidden"
        data-testid="mobile-menu-button"
      >
        ☰
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] small:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <nav className="absolute inset-y-0 left-0 flex w-[85vw] max-w-sm flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between bg-brand-navy px-4 py-3 text-white">
              <span className="font-bold">Shop by Category</span>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <Tree parent={null} depth={0} />
            <div className="mt-auto border-t border-brand-line p-4 text-sm">
              <ul className="flex flex-col gap-3">
                {quickLinks.map((l) => (
                  <li key={l.label}>
                    <LocalizedClientLink href={l.href} className="text-brand-blue">
                      {l.label}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-neutral-600">
                Call{" "}
                <a
                  href={`tel:${BRAND.phone.replace(/\D/g, "")}`}
                  className="font-bold text-brand-navy"
                >
                  {BRAND.phone}
                </a>
              </p>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
