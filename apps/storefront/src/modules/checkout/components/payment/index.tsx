"use client"

import {
  ACCOUNT_PROVIDER_ID,
  CARD_PROVIDER_ID,
  PAYMENT_TERMS_LABEL,
  isAccount,
  isSavedCardProvider,
} from "@/lib/constants"
import { initiatePaymentSession } from "@/lib/data/cart"
import { updateCustomer } from "@/lib/data/customer"
import {
  SavedCard,
  cardBrand,
  cardLabel,
  expiryValid,
  formatCardNumber,
  formatExpiry,
  luhnValid,
  parseSavedCards,
} from "@/lib/util/card"
import ErrorMessage from "@/modules/checkout/components/error-message"
import Button from "@/modules/common/components/button"
import Divider from "@/modules/common/components/divider"
import { ApprovalStatusType, B2BCart, B2BCustomer } from "@/types"
import { CheckCircleSolid } from "@medusajs/icons"
import { Container, Heading, Text, clx } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

const NEW_CARD = "new"

const inputCls =
  "w-full rounded-md border border-brand-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"

const Payment = ({
  cart,
  customer,
  availablePaymentMethods,
}: {
  cart: B2BCart
  customer: B2BCustomer | null
  availablePaymentMethods: { id: string }[]
}) => {
  const activeSession = (cart as any).payment_collection?.payment_sessions?.find(
    (s: any) => s.status === "pending"
  )
  const methodIds = availablePaymentMethods.map((m) => m.id)
  const canAccount = methodIds.includes(ACCOUNT_PROVIDER_ID)
  const canCard = methodIds.includes(CARD_PROVIDER_ID)

  const savedCards = useMemo(
    () => parseSavedCards((customer as any)?.metadata),
    [customer]
  )

  const [method, setMethod] = useState<string>(
    activeSession?.provider_id && methodIds.includes(activeSession.provider_id)
      ? activeSession.provider_id
      : canAccount
        ? ACCOUNT_PROVIDER_ID
        : canCard
          ? CARD_PROVIDER_ID
          : ""
  )
  const [cardChoice, setCardChoice] = useState<string>(
    activeSession?.data?.card?.saved_card_id ??
      savedCards[0]?.id ??
      NEW_CARD
  )
  const [cardName, setCardName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExp, setCardExp] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [saveCard, setSaveCard] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const company = cart.company as any
  const terms = company?.payment_terms
  const onCreditHold = !!company?.credit_hold

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isOpen = searchParams.get("step") === "payment"
  const cartApprovalStatus = cart.approval_status?.status
  const paymentReady = !!activeSession && (cart.shipping_methods?.length ?? 0) > 0

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const goTo = (step: string) =>
    router.push(pathname + "?step=" + step, { scroll: false })

  const digits = cardNumber.replace(/\D/g, "")
  const canContinue =
    (isAccount(method) && !onCreditHold) || isSavedCardProvider(method)

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (isAccount(method)) {
        if (onCreditHold) {
          throw new Error(
            "Your account is on credit hold. Pay by credit card or contact your account manager."
          )
        }
        await initiatePaymentSession(cart, {
          provider_id: ACCOUNT_PROVIDER_ID,
          data: {},
        })
      } else if (isSavedCardProvider(method)) {
        let card: SavedCard | undefined
        if (cardChoice === NEW_CARD) {
          if (cardName.trim().length < 2) throw new Error("Enter the name on the card.")
          if (!luhnValid(digits))
            throw new Error(
              "That card number isn't valid. For testing, use 4242 4242 4242 4242."
            )
          if (!expiryValid(cardExp)) throw new Error("The expiry date has passed or isn't valid (MM/YY).")
          if (!/^\d{3,4}$/.test(cardCvc)) throw new Error("Enter the 3 or 4 digit security code.")
          card = {
            id: `card_${Date.now().toString(36)}`,
            brand: cardBrand(digits),
            last4: digits.slice(-4),
            exp: cardExp,
            name: cardName.trim(),
          }
          if (saveCard && customer) {
            const meta = ((customer as any).metadata ?? {}) as Record<string, unknown>
            await updateCustomer({
              metadata: { ...meta, saved_cards: [...savedCards, card] },
            })
          }
          // The full number and CVC are dropped here; only the summary is kept
          setCardNumber("")
          setCardCvc("")
          setCardChoice(saveCard && customer ? card.id : NEW_CARD)
        } else {
          card = savedCards.find((c) => c.id === cardChoice)
          if (!card) throw new Error("Choose a card.")
        }
        await initiatePaymentSession(cart, {
          provider_id: CARD_PROVIDER_ID,
          data: {
            card: {
              brand: card.brand,
              last4: card.last4,
              exp: card.exp,
              saved_card_id: cardChoice === NEW_CARD && !(saveCard && customer) ? null : card.id,
            },
          },
        })
      }
      goTo("review")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const removeCard = async (id: string) => {
    if (!customer) return
    const meta = ((customer as any).metadata ?? {}) as Record<string, unknown>
    await updateCustomer({
      metadata: { ...meta, saved_cards: savedCards.filter((c) => c.id !== id) },
    })
    if (cardChoice === id) setCardChoice(NEW_CARD)
  }

  const summary = (() => {
    if (!activeSession) return null
    if (isAccount(activeSession.provider_id)) {
      return {
        title: "Bill to account",
        detail: "invoiced to your company",
      }
    }
    if (isSavedCardProvider(activeSession.provider_id) && activeSession.data?.card) {
      return {
        title: "Credit card",
        detail: `${cardLabel(activeSession.data.card)} · exp ${activeSession.data.card.exp}`,
      }
    }
    return { title: "Payment selected", detail: "" }
  })()

  const Tile = ({
    id,
    title,
    sub,
  }: {
    id: string
    title: string
    sub: string
  }) => (
    <button
      type="button"
      onClick={() => setMethod(id)}
      className={clx(
        "flex flex-1 items-start gap-3 rounded-md border p-4 text-left transition-colors",
        method === id
          ? "border-brand-blue bg-blue-50/60 ring-1 ring-brand-blue"
          : "border-brand-line bg-white hover:border-neutral-400"
      )}
      data-testid={`payment-tile-${id}`}
    >
      <span
        className={clx(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
          method === id ? "border-brand-blue" : "border-neutral-400"
        )}
      >
        {method === id && <span className="h-2 w-2 rounded-full bg-brand-blue" />}
      </span>
      <span>
        <span className="block font-semibold text-brand-navy">{title}</span>
        <span className="block text-sm text-neutral-600">{sub}</span>
      </span>
    </button>
  )

  return (
    <Container>
      <div className="flex flex-col gap-y-2">
        <div className="flex w-full flex-row items-center justify-between">
          <Heading
            level="h2"
            className={clx("flex flex-row items-center gap-x-2 text-xl", {
              "pointer-events-none select-none opacity-50": !isOpen && !paymentReady,
            })}
          >
            Payment
            {!isOpen && paymentReady && <CheckCircleSolid />}
          </Heading>
          {!isOpen && paymentReady && cartApprovalStatus !== ApprovalStatusType.PENDING && (
            <Text>
              <button
                onClick={() => goTo("payment")}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                data-testid="edit-payment-button"
              >
                Edit
              </button>
            </Text>
          )}
        </div>
        {(isOpen || paymentReady) && <Divider />}
      </div>

      {isOpen ? (
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-3 small:flex-row">
            {canAccount && (
              <Tile
                id={ACCOUNT_PROVIDER_ID}
                title="Bill to account"
                sub={`No payment now. Invoiced to ${company?.name ?? "your company"}${
                  terms && terms !== "prepaid"
                    ? `, ${PAYMENT_TERMS_LABEL[terms] ?? terms}`
                    : ""
                }`}
              />
            )}
            {canCard && (
              <Tile
                id={CARD_PROVIDER_ID}
                title="Credit card"
                sub="Visa, Mastercard, Amex, Discover"
              />
            )}
          </div>

          {isAccount(method) && onCreditHold && (
            <Text className="rounded-md border border-brand-line bg-brand-canvas p-4 text-sm text-status-bad">
              This account is on credit hold, so orders can&apos;t be billed to it
              right now. Pay by credit card or contact your account manager.
            </Text>
          )}

          {isSavedCardProvider(method) && (
            <div className="flex flex-col rounded-md border border-brand-line">
              {savedCards.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-brand-line px-4 py-3 text-sm"
                >
                  <input
                    type="radio"
                    name="card"
                    checked={cardChoice === c.id}
                    onChange={() => setCardChoice(c.id)}
                    className="accent-brand-blue"
                  />
                  <span className="w-20 font-semibold text-brand-navy">{c.brand}</span>
                  <span className="flex-1">•••• {c.last4}</span>
                  <span className="hidden text-neutral-500 xsmall:inline">Exp {c.exp}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      removeCard(c.id)
                    }}
                    className="text-xs text-neutral-500 underline hover:text-status-bad"
                  >
                    Remove
                  </button>
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm">
                <input
                  type="radio"
                  name="card"
                  checked={cardChoice === NEW_CARD}
                  onChange={() => setCardChoice(NEW_CARD)}
                  className="accent-brand-blue"
                  data-testid="new-card-radio"
                />
                <span className="font-semibold text-brand-navy">
                  {savedCards.length ? "Use a new card" : "Add a card"}
                </span>
              </label>
              {cardChoice === NEW_CARD && (
                <div className="grid grid-cols-2 gap-3 border-t border-brand-line bg-brand-canvas p-4 small:grid-cols-4">
                  <label className="col-span-2 flex flex-col gap-1 text-sm small:col-span-4">
                    <span className="font-semibold">Name on card</span>
                    <input
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      autoComplete="cc-name"
                      className={inputCls}
                      data-testid="card-name"
                    />
                  </label>
                  <label className="col-span-2 flex flex-col gap-1 text-sm">
                    <span className="font-semibold">Card number</span>
                    <input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="1234 5678 9012 3456"
                      className={inputCls}
                      data-testid="card-number"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-semibold">Expiry</span>
                    <input
                      value={cardExp}
                      onChange={(e) => setCardExp(formatExpiry(e.target.value))}
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      className={inputCls}
                      data-testid="card-exp"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-semibold">Security code</span>
                    <input
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="CVC"
                      className={inputCls}
                      data-testid="card-cvc"
                    />
                  </label>
                  {customer && (
                    <label className="col-span-2 flex items-center gap-2 text-sm small:col-span-4">
                      <input
                        type="checkbox"
                        checked={saveCard}
                        onChange={(e) => setSaveCard(e.target.checked)}
                        className="accent-brand-blue"
                      />
                      Save this card for future orders
                    </label>
                  )}
                  <p className="col-span-2 text-xs text-neutral-500 small:col-span-4">
                    Demo mode: cards are not charged. Only the card type, last 4
                    digits and expiry are kept. In production, PayPal processes and
                    stores the card.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col items-end gap-y-2">
            <ErrorMessage error={error} data-testid="payment-method-error-message" />
            <Button
              size="large"
              className="mt-2"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!canContinue}
              data-testid="submit-payment-button"
            >
              Next step
            </Button>
          </div>
        </div>
      ) : (
        summary &&
        paymentReady && (
          <div className="pt-2 text-sm" data-testid="payment-method-summary">
            <span className="font-semibold text-brand-navy">{summary.title}</span>
            {summary.detail && (
              <span className="text-neutral-600"> · {summary.detail}</span>
            )}
          </div>
        )
      )}
    </Container>
  )
}

export default Payment
