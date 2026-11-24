"use client"

import {
  PAYMENT_TERMS_LABEL,
  getPaymentInfo,
  isAccount,
  isCardPayment,
  isStripeLike,
} from "@/lib/constants"
import { initiatePaymentSession } from "@/lib/data/cart"
import { getPaymentErrorMessage } from "@/lib/util/payment-error"
import ErrorMessage from "@/modules/checkout/components/error-message"
import PaymentContainer from "@/modules/checkout/components/payment-container"
import { StripeContext } from "@/modules/checkout/components/payment-wrapper"
import Button from "@/modules/common/components/button"
import Divider from "@/modules/common/components/divider"
import { ApprovalStatusType } from "@/types"
import { RadioGroup } from "@headlessui/react"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Container, Heading, Text, clx } from "@medusajs/ui"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )
  const [poNumber, setPoNumber] = useState<string>(
    activeSession?.data?.po_number ?? ""
  )
  const company = cart.company
  const terms = company?.payment_terms
  const onCreditHold = !!company?.credit_hold

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const cartApprovalStatus = cart.approval_status?.status

  const stripeReady = useContext(StripeContext)

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (activeSession && cart?.shipping_methods.length !== 0) || paidByGiftcard

  const useOptions: StripeCardElementOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "Inter, sans-serif",
          color: "#424270",
          "::placeholder": {
            color: "rgb(107 114 128)",
          },
        },
      },
      classes: {
        base: "pt-3 pb-1 block w-full h-11 px-4 mt-0 bg-ui-bg-field border rounded-md appearance-none focus:outline-none focus:ring-0 focus:shadow-borders-interactive-with-active border-ui-border-base hover:bg-ui-bg-field-hover transition-all duration-300 ease-in-out",
      },
    }
  }, [])

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeLike(selectedPaymentMethod) && !activeSession

      if (isAccount(selectedPaymentMethod)) {
        if (onCreditHold) {
          throw new Error(
            "Your account is on credit hold. Please pay by card or contact your account manager."
          )
        }
        if (!poNumber.trim()) {
          throw new Error("Enter a PO number to bill this order to your account.")
        }
        // Always re-create, so a changed PO number is saved on the session
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
          data: { po_number: poNumber.trim() },
        })
      } else if (
        !activeSession ||
        activeSession.provider_id !== selectedPaymentMethod
      ) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <Container>
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-row items-center justify-between w-full">
          <Heading
            level="h2"
            className={clx("flex flex-row text-xl gap-x-2 items-center", {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            })}
          >
            Payment Method
            {!isOpen && paymentReady && <CheckCircleSolid />}
          </Heading>
          {!isOpen &&
            paymentReady &&
            cartApprovalStatus !== ApprovalStatusType.PENDING && (
              <Text>
                <button
                  onClick={handleEdit}
                  className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                  data-testid="edit-payment-button"
                >
                  Edit
                </button>
              </Text>
            )}
        </div>
        {(isOpen || (cart && paymentReady && activeSession)) && <Divider />}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && availablePaymentMethods?.length && (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setSelectedPaymentMethod(value)}
              >
                {availablePaymentMethods
                  .sort((a, b) => {
                    return a.provider_id > b.provider_id ? 1 : -1
                  })
                  .map((paymentMethod) => {
                    return (
                      <PaymentContainer
                        paymentProviderId={paymentMethod.id}
                        key={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                      />
                    )
                  })}
              </RadioGroup>
              {isAccount(selectedPaymentMethod) && (
                <div className="mt-5 flex flex-col gap-3 rounded-md border border-brand-line bg-brand-canvas p-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-brand-navy">
                      {company?.name}
                    </span>
                    {terms && (
                      <span className="chip chip-info">
                        {PAYMENT_TERMS_LABEL[terms] ?? terms}
                      </span>
                    )}
                    {onCreditHold && (
                      <span className="chip chip-bad">Credit hold</span>
                    )}
                  </div>
                  {onCreditHold ? (
                    <Text className="text-sm text-status-bad">
                      This account is on credit hold, so orders can't be billed
                      to it right now. Pay by card or contact your account
                      manager.
                    </Text>
                  ) : (
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-semibold">
                        PO number <span className="text-status-bad">*</span>
                      </span>
                      <input
                        value={poNumber}
                        onChange={(e) => setPoNumber(e.target.value)}
                        placeholder="e.g. PO-104233"
                        maxLength={40}
                        className="w-full max-w-xs rounded border border-brand-line bg-white px-3 py-2 outline-none focus:border-brand-blue"
                        data-testid="po-number-input"
                      />
                      <span className="text-xs text-neutral-500">
                        Printed on your invoice. Payment is due per your terms.
                      </span>
                    </label>
                  )}
                </div>
              )}
              {stripeReady && isCardPayment(selectedPaymentMethod) && (
                <div className="mt-5 transition-all duration-150 ease-in-out">
                  <Text className="txt-medium-plus text-ui-fg-base mb-1">
                    Enter your card details:
                  </Text>

                  <CardElement
                    options={useOptions as StripeCardElementOptions}
                    onChange={(e) => {
                      setCardBrand(
                        e.brand &&
                          e.brand.charAt(0).toUpperCase() + e.brand.slice(1)
                      )
                      setError(getPaymentErrorMessage(e.error))
                      setCardComplete(e.complete)
                    }}
                  />
                </div>
              )}
            </>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          )}

          <div className="flex flex-col gap-y-2 items-end">
            <ErrorMessage
              error={error}
              data-testid="payment-method-error-message"
            />

            <Button
              size="large"
              className="mt-6"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={
                (isCardPayment(selectedPaymentMethod) && !cardComplete) ||
                (isAccount(selectedPaymentMethod) &&
                  (onCreditHold || !poNumber.trim())) ||
                (!selectedPaymentMethod && !paidByGiftcard)
              }
              data-testid="submit-payment-button"
            >
              {!activeSession && isStripeLike(selectedPaymentMethod)
                ? " Enter card details"
                : "Next step"}
            </Button>
          </div>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex items-center gap-x-1 w-full pt-2">
              <div className="flex flex-col w-1/3">
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  {getPaymentInfo(selectedPaymentMethod)?.title ||
                    selectedPaymentMethod}
                </Text>
              </div>
              <div className="flex flex-col w-1/3">
                <div
                  className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {getPaymentInfo(selectedPaymentMethod)?.icon || (
                      <CreditCard />
                    )}
                  </Container>
                  <Text>
                    {isStripeLike(selectedPaymentMethod) && cardBrand
                      ? cardBrand
                      : isAccount(selectedPaymentMethod)
                      ? `PO ${activeSession?.data?.po_number ?? poNumber}`
                      : getPaymentInfo(selectedPaymentMethod)?.title}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          ) : null}
        </div>
      </div>
    </Container>
  )
}

export default Payment
