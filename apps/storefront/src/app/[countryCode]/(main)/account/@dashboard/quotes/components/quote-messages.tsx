"use client"

import { createQuoteMessage } from "@/lib/data/quotes"
import { StoreQuoteResponse } from "@/types/quote"
import { AdminOrderPreview } from "@medusajs/types"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

const nameOf = (p: any, fallback: string) =>
  [p?.first_name, p?.last_name].filter(Boolean).join(" ") || p?.email || fallback

const when = (v?: string | Date) =>
  v
    ? new Date(v).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : ""

/**
 * The conversation about a quote: our replies on the left, yours on the right,
 * oldest first, with the time of each. New messages show here right after
 * sending; replies appear when you reopen or refresh the page.
 */
const QuoteMessages = ({
  quote,
  preview,
}: {
  quote: StoreQuoteResponse["quote"]
  preview: AdminOrderPreview
}) => {
  const router = useRouter()
  const [text, setText] = useState("")
  const [itemId, setItemId] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const items = useMemo(
    () => new Map((preview?.items ?? []).map((i) => [i.id, i])),
    [preview]
  )
  const messages = useMemo(
    () =>
      [...(quote.messages ?? [])].sort(
        (a: any, b: any) =>
          new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
      ),
    [quote.messages]
  )

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" })
  }, [messages.length])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    setErr(null)
    try {
      await createQuoteMessage(quote.id, {
        text: text.trim(),
        item_id: itemId || null,
      })
      setText("")
      setItemId("")
      router.refresh()
    } catch (e: any) {
      setErr(e?.message ?? "Could not send your message")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-md border border-brand-line bg-white" data-testid="quote-messages">
      <div className="border-b border-brand-line px-5 py-3">
        <h3 className="text-sm font-bold text-brand-navy">Conversation</h3>
        <p className="text-xs text-neutral-500">
          Questions about this quote? Write to our sales team here. We reply on this page.
        </p>
      </div>

      <div className="flex max-h-[28rem] flex-col gap-4 overflow-y-auto bg-brand-canvas px-5 py-4">
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-neutral-500">No messages yet.</p>
        )}
        {messages.map((m: any) => {
          const mine = !!m.customer_id
          const line = m.item_id ? items.get(m.item_id) : null
          return (
            <div key={m.id} className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
              <span className="text-xs text-neutral-500">
                {mine ? "You" : "LK Packaging"} · {when(m.created_at)}
              </span>
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-lg px-4 py-2.5 text-sm ${
                  mine
                    ? "bg-brand-blue text-white"
                    : "border border-brand-line bg-white text-brand-ink"
                }`}
              >
                {line && (
                  <p
                    className={`mb-1 border-b pb-1 text-xs ${
                      mine ? "border-white/30 text-white/80" : "border-brand-line text-neutral-500"
                    }`}
                  >
                    About: {line.variant_sku} · {line.product_title ?? line.title}
                  </p>
                )}
                {m.text}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex flex-col gap-3 border-t border-brand-line px-5 py-4">
        {(preview?.items?.length ?? 0) > 1 && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-neutral-600">About</span>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="rounded border border-brand-line bg-white px-2 py-1.5 text-sm"
            >
              <option value="">The whole quote</option>
              {preview.items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.variant_sku} - {i.product_title ?? i.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Write a message to our sales team"
          className="rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-blue"
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="btn-accent self-end px-5 py-2 text-sm disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  )
}

export default QuoteMessages
