"use client"

import { useSession } from "@/lib/context/session-context"
import { requestItemQuote } from "@/lib/data/item-quote"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { useParams } from "next/navigation"
import { useState } from "react"

/**
 * Under a product table: for large volumes or special requests. Sends the
 * request to the sales team as a quote without touching the buyer's cart.
 */
export default function ItemQuoteForm({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  const { countryCode } = useParams<{ countryCode: string }>()
  const { customer } = useSession()
  const variants = product.variants ?? []
  const [open, setOpen] = useState(false)
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "")
  const [quantity, setQuantity] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState<{ quoteId: string; number: string } | null>(null)

  if (!variants.length) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      setDone(
        await requestItemQuote({
          variantId,
          quantity: Number(quantity),
          note,
          countryCode,
        })
      )
    } catch (e: any) {
      setErr(e?.message ?? "Could not send the request")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-md border border-brand-line bg-brand-canvas p-4 text-sm" data-testid="item-quote">
      {done ? (
        <p>
          Thank you. We received {done.number} and will reply with pricing.{" "}
          <LocalizedClientLink
            href={`/account/quotes/details/${done.quoteId}`}
            className="font-semibold text-brand-blue hover:underline"
          >
            View your request ›
          </LocalizedClientLink>
        </p>
      ) : !open ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-neutral-700">
            Need a bigger quantity, a special price or a custom size?
          </span>
          {customer ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-md border border-brand-blue px-3 py-1.5 font-semibold text-brand-blue hover:bg-white"
            >
              Request a quote
            </button>
          ) : (
            <LocalizedClientLink
              href="/account"
              className="font-semibold text-brand-blue hover:underline"
            >
              Sign in to request a quote
            </LocalizedClientLink>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-3 small:grid-cols-[2fr_1fr]">
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-neutral-700">Item</span>
            <select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="rounded border border-brand-line bg-white px-2 py-2"
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.sku} {v.title ? `- ${v.title}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-neutral-700">Quantity</span>
            <input
              type="number"
              min={1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="rounded border border-brand-line bg-white px-2 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 small:col-span-2">
            <span className="font-semibold text-neutral-700">
              Details (target price, delivery date, custom needs)
            </span>
            <textarea
              value={note}
              maxLength={500}
              rows={3}
              onChange={(e) => setNote(e.target.value)}
              className="rounded border border-brand-line bg-white px-2 py-2"
            />
          </label>
          {err && <p className="text-red-600 small:col-span-2">{err}</p>}
          <div className="flex gap-2 small:col-span-2">
            <button type="submit" disabled={busy} className="btn-accent px-4 py-2 disabled:opacity-60">
              {busy ? "Sending…" : "Send request"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-neutral-600 hover:underline">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
