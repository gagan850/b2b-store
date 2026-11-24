"use client"

import { addToCartEventBus } from "@/lib/data/cart-event-bus"
import { convertToLocale } from "@/lib/util/money"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { useState } from "react"

type Tier = { min: number; amount: number }

const tiersFor = (variant: HttpTypes.StoreProductVariant, currency: string) => {
  const prices = ((variant as any).prices ?? []) as {
    amount: number
    currency_code: string
    min_quantity: number | null
    price_list_id: string | null
  }[]
  const byMin = new Map<number, number>()
  prices
    .filter((p) => p.currency_code === currency && !p.price_list_id)
    .forEach((p) => byMin.set(p.min_quantity ?? 1, p.amount))
  return [...byMin.entries()]
    .map(([min, amount]) => ({ min, amount }))
    .sort((a, b) => a.min - b.min) as Tier[]
}

/** One product family laid out as a catalog table: item #, option, price breaks, qty, add. */
export default function ProductFamilyTable({
  product,
  region,
  showHeader = true,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  showHeader?: boolean
}) {
  const currency = region.currency_code
  const variants = product.variants ?? []
  const tierMins = [
    ...new Set(variants.flatMap((v) => tiersFor(v, currency).map((t) => t.min))),
  ].sort((a, b) => a - b)
  const optionTitle = product.options?.[0]?.title ?? "Option"
  const [qty, setQty] = useState<Record<string, number>>({})

  const add = (variant: HttpTypes.StoreProductVariant) => {
    const q = qty[variant.id] || 1
    addToCartEventBus.emitCartAdd({
      lineItems: [{ productVariant: { ...variant, product }, quantity: q }],
      regionId: region.id,
    })
  }

  const fmt = (n: number) => convertToLocale({ amount: n, currency_code: currency })

  return (
    <section className="flex flex-col gap-4">
      {showHeader && (
        <div className="flex flex-col gap-4 xsmall:flex-row">
          {product.thumbnail && (
            <LocalizedClientLink
              href={`/products/${product.handle}`}
              className="h-32 w-32 shrink-0 self-center border border-brand-line bg-white xsmall:self-start"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.thumbnail} alt={product.title} className="h-full w-full object-contain" />
            </LocalizedClientLink>
          )}
          <div className="flex flex-col gap-1">
            <LocalizedClientLink
              href={`/products/${product.handle}`}
              className="text-xl font-bold text-brand-navy hover:text-brand-blue hover:underline"
            >
              {product.title}
            </LocalizedClientLink>
            {product.description && (
              <p className="text-sm text-brand-ink">{product.description}</p>
            )}
            <LocalizedClientLink
              href={`/products/${product.handle}`}
              className="text-sm text-brand-blue hover:underline"
            >
              Details and specifications ›
            </LocalizedClientLink>
          </div>
        </div>
      )}
      <div className="overflow-hidden border border-brand-line">
      {/* Phone: one card per item */}
      <ul className="divide-y divide-brand-line small:hidden">
        {variants.map((v) => {
          const tiers = tiersFor(v, currency)
          const inStock =
            !v.manage_inventory || v.allow_backorder || (v.inventory_quantity ?? 0) > 0
          return (
            <li key={v.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-brand-blue">{v.sku}</p>
                  <p className="text-sm text-brand-ink">
                    {optionTitle}: {v.title}
                  </p>
                </div>
                <span className={`chip ${inStock ? "chip-ok" : "chip-bad"}`}>
                  {inStock ? "In stock" : "Out of stock"}
                </span>
              </div>
              <div
                className="grid gap-1 rounded bg-brand-canvas p-2 text-center text-xs"
                style={{ gridTemplateColumns: `repeat(${Math.max(tierMins.length, 1)}, minmax(0, 1fr))` }}
              >
                {tierMins.map((m, i) => {
                  const t = tiers.find((x) => x.min === m)
                  return (
                    <div key={m}>
                      <p className="text-neutral-500">
                        {i === tierMins.length - 1 ? `${m}+` : `${m}–${tierMins[i + 1] - 1}`}
                      </p>
                      <p className="text-sm font-bold text-brand-navy">
                        {t ? fmt(t.amount) : "—"}
                      </p>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={qty[v.id] ?? ""}
                  placeholder="Qty"
                  onChange={(e) =>
                    setQty((q) => ({ ...q, [v.id]: Number(e.target.value) }))
                  }
                  className="w-20 rounded border border-brand-line px-2 py-2 text-center outline-none focus:border-brand-blue"
                  aria-label={`Quantity for ${v.sku}`}
                />
                <button onClick={() => add(v)} className="btn-accent flex-1">
                  Add to cart
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Tablet and desktop: catalog table */}
      <div className="hidden overflow-x-auto small:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-brand-navy bg-brand-canvas text-left text-xs font-bold uppercase tracking-wide text-brand-navy">
              <th className="px-4 py-2">Item #</th>
              <th className="px-4 py-2">{optionTitle}</th>
              {tierMins.map((m, i) => (
                <th key={m} className="px-4 py-2 text-right">
                  {i === tierMins.length - 1 ? `${m}+` : `${m}–${tierMins[i + 1] - 1}`}
                </th>
              ))}
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2 text-center">Qty</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {variants.map((v, idx) => {
              const tiers = tiersFor(v, currency)
              return (
                <tr
                  key={v.id}
                  className={`border-b border-brand-line last:border-0 ${idx % 2 ? "bg-brand-canvas/60" : "bg-white"}`}
                >
                  <td className="px-4 py-2 font-bold text-brand-blue">{v.sku}</td>
                  <td className="px-4 py-2">{v.title}</td>
                  {tierMins.map((m) => {
                    const t = tiers.find((x) => x.min === m)
                    return (
                      <td
                        key={m}
                        className="px-4 py-2 text-right font-semibold text-brand-navy"
                      >
                        {t ? fmt(t.amount) : "—"}
                      </td>
                    )
                  })}
                  <td className="px-4 py-2">
                    {!v.manage_inventory ||
                    v.allow_backorder ||
                    (v.inventory_quantity ?? 0) > 0 ? (
                      <span className="chip chip-ok">In stock</span>
                    ) : (
                      <span className="chip chip-bad">Out of stock</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number"
                      min={1}
                      value={qty[v.id] ?? ""}
                      placeholder="1"
                      onChange={(e) =>
                        setQty((q) => ({ ...q, [v.id]: Number(e.target.value) }))
                      }
                      className="w-16 rounded border border-brand-line px-2 py-1 text-center outline-none focus:border-brand-blue"
                      aria-label={`Quantity for ${v.sku}`}
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => add(v)}
                      className="btn-accent px-3 py-1.5 text-xs"
                    >
                      Add to cart
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      </div>
    </section>
  )
}
