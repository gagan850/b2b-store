"use client"

import { setShippingMethod } from "@/lib/data/cart"
import {
  DeliveryOption,
  describeDelivery,
  kindOf,
  warehouseAddress,
  warehouseName,
} from "@/lib/util/delivery"
import { convertToLocale } from "@/lib/util/money"
import ErrorMessage from "@/modules/checkout/components/error-message"
import Button from "@/modules/common/components/button"
import Divider from "@/modules/common/components/divider"
import { ApprovalStatusType, B2BCart } from "@/types"
import { CheckCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text, clx } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type Option = DeliveryOption

type Mode = "ship" | "pickup"

const CARRIERS = ["UPS", "FedEx", "DHL", "Other"]

const inputCls =
  "w-full rounded-md border border-brand-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"

type ShippingProps = {
  cart: B2BCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

const Shipping: React.FC<ShippingProps> = ({ cart, availableShippingMethods }) => {
  const options = (availableShippingMethods ?? []) as Option[]
  const shipOptions = options.filter((o) => kindOf(o) !== "pickup")
  const carrierOptions = shipOptions
    .filter((o) => kindOf(o) === "carrier")
    .sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0))
  const collectOption = shipOptions.find((o) => kindOf(o) === "collect")
  const pickupOptions = options.filter((o) => kindOf(o) === "pickup")

  const currentMethod = cart.shipping_methods?.at(-1) as any
  const selected = options.find((o) => o.id === currentMethod?.shipping_option_id)
  const selectedKind = selected ? kindOf(selected) : undefined
  const savedAccount = currentMethod?.data?.carrier_account as
    | { carrier: string; account_number: string; service?: string }
    | undefined

  const [mode, setMode] = useState<Mode>(selectedKind === "pickup" ? "pickup" : "ship")
  const [pendingCollect, setPendingCollect] = useState(false)
  const [acctCarrier, setAcctCarrier] = useState(savedAccount?.carrier ?? "UPS")
  const [acctNumber, setAcctNumber] = useState(savedAccount?.account_number ?? "")
  const [acctService, setAcctService] = useState(savedAccount?.service ?? "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isOpen = searchParams.get("step") === "delivery"
  const cartApprovalStatus = cart?.approval_status?.status
  const hasMethod = (cart.shipping_methods?.length ?? 0) > 0

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const collectSelected = pendingCollect || selectedKind === "collect"

  const choose = async (id: string, data?: Record<string, unknown>) => {
    setIsLoading(true)
    setError(null)
    await setShippingMethod({ cartId: cart.id, shippingMethodId: id, data })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }

  const pickCarrier = (id: string) => {
    setPendingCollect(false)
    choose(id)
  }

  const saveAccount = async () => {
    if (!collectOption) return
    if (acctNumber.trim().length < 4) {
      setError("Enter your carrier account number.")
      return
    }
    await choose(collectOption.id, {
      carrier_account: {
        carrier: acctCarrier,
        account_number: acctNumber.trim().slice(0, 30),
        service: acctService.trim().slice(0, 40),
      },
    })
    setPendingCollect(false)
  }

  const modeMatches =
    selected && (mode === "pickup" ? selectedKind === "pickup" : selectedKind !== "pickup")
  const collectReady = selectedKind !== "collect" || !!savedAccount?.account_number
  const canContinue = hasMethod && modeMatches && collectReady && !pendingCollect

  const price = (o: Option) =>
    !o.amount
      ? "Free"
      : convertToLocale({ amount: o.amount, currency_code: cart.currency_code })

  const summary = useMemo(
    () => describeDelivery(selected, currentMethod?.data),
    [selected, currentMethod?.data]
  )

  const ModeTile = ({ id, title, sub }: { id: Mode; title: string; sub: string }) => (
    <button
      type="button"
      onClick={() => {
        setMode(id)
        setPendingCollect(false)
      }}
      className={clx(
        "flex flex-1 items-start gap-3 rounded-md border p-4 text-left transition-colors",
        mode === id
          ? "border-brand-blue bg-blue-50/60 ring-1 ring-brand-blue"
          : "border-brand-line bg-white hover:border-neutral-400"
      )}
      data-testid={`delivery-mode-${id}`}
    >
      <span
        className={clx(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
          mode === id ? "border-brand-blue" : "border-neutral-400"
        )}
      >
        {mode === id && <span className="h-2 w-2 rounded-full bg-brand-blue" />}
      </span>
      <span>
        <span className="block font-semibold text-brand-navy">{title}</span>
        <span className="block text-sm text-neutral-600">{sub}</span>
      </span>
    </button>
  )

  const Row = ({
    checked,
    onSelect,
    children,
    right,
    testId,
  }: {
    checked: boolean
    onSelect: () => void
    children: React.ReactNode
    right: React.ReactNode
    testId?: string
  }) => (
    <label
      className={clx(
        "flex cursor-pointer items-center gap-3 border-b border-brand-line px-4 py-3 text-sm last:border-b-0",
        checked && "bg-blue-50/50"
      )}
      data-testid={testId}
    >
      <input
        type="radio"
        name="delivery-option"
        checked={checked}
        onChange={onSelect}
        disabled={isLoading}
        className="accent-brand-blue"
      />
      <span className="min-w-0 flex-1">{children}</span>
      <span className="shrink-0 font-semibold text-brand-navy">{right}</span>
    </label>
  )

  return (
    <Container>
      <div className="flex flex-col gap-y-2">
        <div className="flex w-full flex-row items-center justify-between">
          <Heading
            level="h2"
            className={clx("flex flex-row items-center gap-x-2 text-xl", {
              "pointer-events-none select-none opacity-50": !isOpen && !hasMethod,
            })}
          >
            Delivery
            {!isOpen && hasMethod && <CheckCircleSolid />}
          </Heading>
          {!isOpen &&
            cart?.shipping_address &&
            cart?.billing_address &&
            cart?.email &&
            cartApprovalStatus !== ApprovalStatusType.PENDING && (
              <Text>
                <button
                  onClick={() => router.push(pathname + "?step=delivery", { scroll: false })}
                  className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                  data-testid="edit-delivery-button"
                >
                  Edit
                </button>
              </Text>
            )}
        </div>
        {(isOpen || hasMethod) && <Divider />}
      </div>

      {isOpen ? (
        <div className="flex flex-col gap-4 pt-2" data-testid="delivery-options-container">
          <div className="flex flex-col gap-3 small:flex-row">
            <ModeTile
              id="ship"
              title="Ship it"
              sub="UPS, FedEx, LTL freight or your own carrier account"
            />
            {pickupOptions.length > 0 && (
              <ModeTile
                id="pickup"
                title="Will call"
                sub="Pick up at an LK warehouse"
              />
            )}
          </div>

          {mode === "ship" ? (
            <div className="flex flex-col rounded-md border border-brand-line">
              {carrierOptions.map((o) => (
                <Row
                  key={o.id}
                  checked={!pendingCollect && selected?.id === o.id}
                  onSelect={() => pickCarrier(o.id)}
                  right={price(o)}
                  testId="delivery-option-radio"
                >
                  <span className="block font-semibold text-brand-navy">{o.name}</span>
                  {o.data?.transit && (
                    <span className="block text-neutral-500">{o.data.transit}</span>
                  )}
                </Row>
              ))}
              {collectOption && (
                <>
                  <Row
                    checked={collectSelected}
                    onSelect={() => setPendingCollect(true)}
                    right="No charge"
                    testId="delivery-option-collect"
                  >
                    <span className="block font-semibold text-brand-navy">
                      Ship on my carrier account
                    </span>
                    <span className="block text-neutral-500">
                      Freight is billed to your UPS, FedEx or other account
                    </span>
                  </Row>
                  {collectSelected && (
                    <div className="grid grid-cols-1 gap-3 border-t border-brand-line bg-brand-canvas p-4 small:grid-cols-[140px_1fr_1fr_auto] small:items-end">
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-semibold">Carrier</span>
                        <select
                          value={acctCarrier}
                          onChange={(e) => {
                            setAcctCarrier(e.target.value)
                            setPendingCollect(true)
                          }}
                          className={inputCls}
                          data-testid="carrier-select"
                        >
                          {CARRIERS.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-semibold">
                          Account number <span className="text-status-bad">*</span>
                        </span>
                        <input
                          value={acctNumber}
                          onChange={(e) => {
                            setAcctNumber(e.target.value)
                            setPendingCollect(true)
                          }}
                          maxLength={30}
                          className={inputCls}
                          data-testid="carrier-account-number"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-semibold">Service</span>
                        <input
                          value={acctService}
                          onChange={(e) => {
                            setAcctService(e.target.value)
                            setPendingCollect(true)
                          }}
                          placeholder="e.g. Ground, 2nd Day Air"
                          maxLength={40}
                          className={inputCls}
                          data-testid="carrier-service"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={saveAccount}
                        disabled={isLoading || !pendingCollect}
                        className="h-[38px] rounded-md border border-brand-blue px-4 text-sm font-semibold text-brand-blue hover:bg-blue-50 disabled:border-brand-line disabled:text-neutral-400"
                        data-testid="carrier-account-save"
                      >
                        {pendingCollect ? "Use this account" : "Saved"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col rounded-md border border-brand-line">
              {pickupOptions.map((o) => (
                <Row
                  key={o.id}
                  checked={selected?.id === o.id}
                  onSelect={() =>
                    choose(o.id, {
                      pickup: {
                        warehouse: warehouseName(o),
                        address: warehouseAddress(o),
                        hours: o.data?.hours ?? null,
                      },
                    })
                  }
                  right={null}
                  testId="pickup-option-radio"
                >
                  <span className="block font-semibold text-brand-navy">
                    {warehouseName(o)} warehouse
                  </span>
                  <span className="block text-neutral-600">{warehouseAddress(o)}</span>
                  {o.data?.hours && (
                    <span className="block text-neutral-500">
                      {o.data.hours}
                      {o.data.ready ? ` · ${o.data.ready}` : ""}
                    </span>
                  )}
                </Row>
              ))}
            </div>
          )}

          <div className="flex flex-col items-end gap-y-2">
            <ErrorMessage error={error} data-testid="delivery-option-error-message" />
            <Button
              size="large"
              className="mt-2"
              onClick={() => router.push(pathname + "?step=contact-details", { scroll: false })}
              isLoading={isLoading}
              disabled={!canContinue}
              data-testid="submit-delivery-option-button"
            >
              Next step
            </Button>
          </div>
        </div>
      ) : (
        hasMethod &&
        selected && (
          <div className="flex flex-wrap items-baseline gap-x-2 pt-2 text-sm">
            <span className="font-semibold text-brand-navy">{summary}</span>
            <span className="text-neutral-600">
              {selectedKind === "collect"
                ? "Freight billed to your account"
                : selectedKind === "pickup"
                  ? ""
                  : price(selected)}
            </span>
          </div>
        )
      )}
    </Container>
  )
}

export default Shipping
