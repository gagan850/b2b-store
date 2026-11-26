"use client"

import { acceptQuote, rejectQuote, reviseQuote, startQuoteCheckout } from "@/lib/data/quotes"
import { formatAmount } from "@/modules/common/components/amount-cell"
import Button from "@/modules/common/components/button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { PromptModal } from "@/modules/common/components/prompt-modal"
import { B2BCustomer } from "@/types/global"
import { StoreQuoteResponse } from "@/types/quote"
import { ArrowUturnLeft, CheckCircleSolid } from "@medusajs/icons"
import { AdminOrderLineItem, AdminOrderPreview } from "@medusajs/types"
import { Container, Heading, Text, toast } from "@medusajs/ui"
import { useRouter } from "next/navigation"
import React, { useMemo, useState } from "react"
import QuoteStatusBadge from "../quote-status-badge"
import { QuoteTableItem } from "../quote-table"

type QuoteDetailsProps = {
  quote: StoreQuoteResponse["quote"] & {
    customer: B2BCustomer
  }
  preview: AdminOrderPreview
  countryCode: string
}

const Row = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-neutral-600">{label}</span>
    <span className={accent ? "font-semibold text-green-700" : "text-brand-ink"}>{value}</span>
  </div>
)

const QuoteDetails: React.FC<QuoteDetailsProps> = ({
  quote,
  preview,
  countryCode,
}) => {
  const order = quote.draft_order
  const originalItemsMap = useMemo(() => {
    return new Map<string, AdminOrderLineItem>(
      order.items?.map((item: AdminOrderLineItem) => [item.id, item])
    )
  }, [order])
  const router = useRouter()
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [reviseOpen, setReviseOpen] = useState(false)
  const [reviseNote, setReviseNote] = useState("")
  const [isRevising, setIsRevising] = useState(false)
  const meta = ((order as any).metadata ?? {}) as Record<string, any>
  const validUntil: Date | null = meta.quote_valid_until
    ? new Date(meta.quote_valid_until)
    : null
  const revisionNote: string = meta.quote_revision_note ?? ""
  const requestNote: string =
    ((quote.messages ?? []) as any[])
      .filter((m) => m.customer_id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]?.text ?? ""
  const discountNames = [
    ...new Set(
      (order.items ?? []).flatMap((i: any) =>
        (i.adjustments ?? []).map((a: any) => a?.code).filter(Boolean)
      )
    ),
  ].join(", ")
  const priceChanged = Number(order.total) !== Number(preview.total)
  const expired = validUntil ? validUntil.getTime() < Date.now() : false
  const daysLeft = validUntil
    ? Math.ceil((validUntil.getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="flex flex-col gap-y-2 p-0">
      <div className="flex gap-2 justify-between items-center mb-2">
        <LocalizedClientLink
          href="/account/quotes"
          className="flex gap-2 items-center text-ui-fg-subtle hover:text-ui-fg-base"
          data-testid="back-to-overview-button"
        >
          <Button variant="secondary">
            <ArrowUturnLeft /> Back
          </Button>
        </LocalizedClientLink>
      </div>

      <div className="small:grid small:grid-cols-6 flex flex-col-reverse small:gap-4 gap-2">
        <div className="small:col-span-4 flex flex-col gap-y-2">
          {quote.status === "accepted" && (
            <Container className="p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <Text className="txt-compact-small">
                  <CheckCircleSolid className="inline-block mr-2 text-green-500 text-lg" />
                  {meta.quote_order_id
                    ? `Quote accepted. Order #${meta.quote_order_display_id} has been placed.`
                    : "Quote accepted. Complete checkout to place the order."}
                </Text>

                {meta.quote_order_id ? (
                  <Button
                    size="small"
                    onClick={() =>
                      router.push(
                        `/${countryCode}/account/orders/details/${meta.quote_order_id}`
                      )
                    }
                  >
                    View Order
                  </Button>
                ) : (
                  <Button
                    size="small"
                    isLoading={isAccepting}
                    onClick={() => {
                      setIsAccepting(true)
                      startQuoteCheckout(quote.id)
                        .then(() => router.push(`/${countryCode}/checkout`))
                        .catch((e) => toast.error(e.message))
                        .finally(() => setIsAccepting(false))
                    }}
                  >
                    Continue to checkout
                  </Button>
                )}
              </div>
            </Container>
          )}

          {preview.items?.map((item) => (
            <Container key={item.id}>
              <QuoteTableItem
                key={item.id}
                item={item}
                originalItem={originalItemsMap.get(item.id)}
                currencyCode={order.currency_code}
              />
            </Container>
          ))}

          <Container className="p-0">
            <div className="flex flex-col gap-y-2 px-6 py-4 text-sm" data-testid="quote-summary">
              <Row label="Subtotal" value={formatAmount(Number(preview.item_subtotal ?? preview.subtotal ?? 0), order.currency_code)} />
              {Number(preview.discount_total) > 0 && (
                <Row
                  label={discountNames ? `Discount (${discountNames})` : "Discount"}
                  value={`- ${formatAmount(Number(preview.discount_total), order.currency_code)}`}
                  accent
                />
              )}
              {Number(preview.shipping_total) > 0 && (
                <Row label="Shipping" value={formatAmount(Number(preview.shipping_total), order.currency_code)} />
              )}
              {Number(preview.tax_total) > 0 && (
                <Row label="Tax" value={formatAmount(Number(preview.tax_total), order.currency_code)} />
              )}
              <div className="mt-1 flex items-center justify-between border-t border-brand-line pt-3">
                <span className="font-bold text-brand-navy">Quote total</span>
                <span className="text-base font-bold text-brand-navy">
                  {formatAmount(Number(preview.total), order.currency_code)}
                </span>
              </div>
              {priceChanged && (
                <p className="text-xs text-neutral-500">
                  Requested total: {formatAmount(Number(order.total), order.currency_code)}.{" "}
                  {Number(order.total) > Number(preview.total)
                    ? `Quoted savings: ${formatAmount(Number(order.total) - Number(preview.total), order.currency_code)}.`
                    : "Pricing has been revised."}
                </p>
              )}
            </div>
          </Container>

          {requestNote && (
            <Container>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Your request
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-brand-ink">{requestNote}</p>
            </Container>
          )}

          {quote.status === "customer_rejected" && revisionNote && (
            <Container className="border-amber-300 bg-amber-50">
              <p className="text-sm font-semibold text-amber-900">
                You asked for changes
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-amber-900">{revisionNote}</p>
              <p className="mt-2 text-xs text-amber-800">
                We will update the quote and send it back to you here.
              </p>
            </Container>
          )}

          {quote.status === "pending_customer" && expired && (
            <Container className="text-sm text-red-700">
              This quote has expired. Choose &quot;Request changes&quot; and we will
              issue a new one.
            </Container>
          )}

          {quote.status === "pending_customer" && (
            <div className="my-4 flex flex-col gap-3">
              {reviseOpen && (
                <div className="rounded-md border border-brand-line bg-white p-4">
                  <label className="text-sm font-semibold text-brand-navy" htmlFor="revise-note">
                    What would you like changed?
                  </label>
                  <textarea
                    id="revise-note"
                    value={reviseNote}
                    onChange={(e) => setReviseNote(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="e.g. Can you do $0.80 each at 3,000 units?"
                    className="mt-2 w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-blue"
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <Button size="small" variant="secondary" onClick={() => setReviseOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      isLoading={isRevising}
                      disabled={reviseNote.trim().length < 3}
                      onClick={() => {
                        setIsRevising(true)
                        reviseQuote(quote.id, reviseNote.trim())
                          .then(() => {
                            setReviseOpen(false)
                            router.refresh()
                          })
                          .catch((e) => toast.error(e.message))
                          .finally(() => setIsRevising(false))
                      }}
                    >
                      Send request
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap justify-end gap-x-3 gap-y-2">
                <PromptModal
                  title="Reject this quote?"
                  description="We will close this quote. You can always request a new one."
                  handleAction={() => {
                    setIsRejecting(true)

                    rejectQuote(quote.id)
                      .catch((e) => toast.error(e.message))
                      .finally(() => setIsRejecting(false))
                  }}
                  isLoading={isRejecting}
                >
                  <Button size="small" variant="secondary">
                    Reject
                  </Button>
                </PromptModal>

                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => setReviseOpen((v) => !v)}
                >
                  Request changes
                </Button>

                <PromptModal
                  title="Accept this quote?"
                  description="The quoted prices are locked in. You will confirm delivery address, shipping and payment at checkout."
                  handleAction={() => {
                    setIsAccepting(true)

                    acceptQuote(quote.id)
                      .then(() => startQuoteCheckout(quote.id))
                      .then(() => router.push(`/${countryCode}/checkout`))
                      .catch((e) => toast.error(e.message))
                      .finally(() => setIsAccepting(false))
                  }}
                  isLoading={isAccepting}
                >
                  <Button size="small" variant="primary" disabled={expired}>
                    Accept quote
                  </Button>
                </PromptModal>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-2 flex flex-col gap-y-2">
          <Container className="flex gap-x-3 justify-between">
            <div className="text-sm">
              <span className="font-semibold text-ui-fg-subtle">Quote</span>{" "}
              <span className="whitespace-nowrap">Q-{String(quote.draft_order.display_id).padStart(6, "0")}</span>
            </div>

            <QuoteStatusBadge status={quote.status} revision={!!revisionNote} />
          </Container>

          {(validUntil || meta.quote_note) && (
            <Container>
              <Heading level="h3" className="mb-2">
                Quote terms
              </Heading>
              <div className="text-sm text-ui-fg-subtle flex flex-col gap-2">
                {validUntil && (
                  <div className="flex justify-between items-center">
                    <Text>Prices valid until</Text>
                    <Text
                      className={
                        expired
                          ? "font-semibold text-red-600"
                          : daysLeft !== null && daysLeft <= 3
                          ? "font-semibold text-amber-600"
                          : ""
                      }
                      data-testid="quote-valid-until"
                    >
                      {validUntil.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      {expired
                        ? " (expired)"
                        : daysLeft !== null && daysLeft <= 7
                        ? ` (${daysLeft} day${daysLeft === 1 ? "" : "s"} left)`
                        : ""}
                    </Text>
                  </div>
                )}
                {meta.quote_note && (
                  <div>
                    <Text className="font-semibold">Note from LK Packaging</Text>
                    <Text className="whitespace-pre-line">{meta.quote_note}</Text>
                  </div>
                )}
              </div>
            </Container>
          )}

          <Container>
            <Heading level="h3" className="mb-2">
              Customer
            </Heading>

            <div className="text-sm text-ui-fg-subtle">
              <div className="flex justify-between">
                <Text>Email</Text>
                <Text>{quote.customer?.email || "-"}</Text>
              </div>

              <div className="flex justify-between">
                <Text>Phone</Text>
                <Text>{quote.customer?.phone || "-"}</Text>
              </div>

            </div>
          </Container>

          <Container>
            <Heading level="h3" className="mb-2">
              Company
            </Heading>

            <div className="text-sm text-ui-fg-subtle">
              <div className="flex justify-between">
                <Text>Name</Text>
                <Text>{quote.customer?.employee?.company?.name || "-"}</Text>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </div>
  )
}

export default QuoteDetails
