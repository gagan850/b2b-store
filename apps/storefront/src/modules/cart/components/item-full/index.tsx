"use client"

import { useCart } from "@/lib/context/cart-context"
import AddNoteButton from "@/modules/cart/components/add-note-button"
import { convertToLocale } from "@/lib/util/money"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Spinner from "@/modules/common/icons/spinner"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { startTransition, useEffect, useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  showBorders?: boolean
  currencyCode: string
  disabled?: boolean
}

const ItemFull = ({
  item,
  showBorders = true,
  currencyCode,
  disabled,
}: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [quantity, setQuantity] = useState(item.quantity.toString())

  const { handleDeleteItem, handleUpdateCartQuantity } = useCart()

  const changeQuantity = async (newQuantity: number) => {
    setError(null)
    // setUpdating(true)

    startTransition(() => {
      setQuantity(newQuantity.toString())
    })

    await handleUpdateCartQuantity(item.id, Number(newQuantity))
  }

  useEffect(() => {
    setQuantity(item.quantity.toString())
  }, [item.quantity])

  const handleBlur = (value: number) => {
    if (value === item.quantity) {
      return
    }

    if (value > maxQuantity) {
      changeQuantity(maxQuantity)
    }

    if (value < 1) {
      setUpdating(true)
      handleDeleteItem(item.id)
      setUpdating(false)
    }

    changeQuantity(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return
    }

    if (e.key === "Enter") {
      changeQuantity(Number(quantity))
    }

    if (e.key === "ArrowUp" && e.shiftKey) {
      e.preventDefault()
      setQuantity((Number(quantity) + 10).toString())
    }

    if (e.key === "ArrowDown" && e.shiftKey) {
      e.preventDefault()
      setQuantity((Number(quantity) - 10).toString())
    }
  }

  const maxQuantity = item.variant?.inventory_quantity ?? 100

  const fmt = (n?: number | null) =>
    convertToLocale({ amount: n ?? 0, currency_code: currencyCode })

  return (
    <div
      className={clx(
        "grid grid-cols-[64px_1fr] gap-x-4 gap-y-3 bg-white p-4 small:grid-cols-[64px_1fr_120px_100px_110px] small:items-center",
        showBorders && "border border-brand-line"
      )}
      data-testid="cart-item"
    >
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        className="row-span-2 h-16 w-16 border border-brand-line bg-white small:row-span-1"
      >
        {item.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail} alt="" className="h-full w-full object-contain" />
        )}
      </LocalizedClientLink>
      <div className="flex min-w-0 flex-col">
        {item.variant?.sku && (
          <span className="text-xs font-semibold text-brand-blue">Item # {item.variant.sku}</span>
        )}
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className="font-semibold text-brand-navy hover:underline"
        >
          {item.product?.title}
        </LocalizedClientLink>
        <span className="text-sm text-neutral-600">{item.variant?.title}</span>
        <div className="mt-1 flex items-center gap-3">
          <AddNoteButton item={item as HttpTypes.StoreCartLineItem} disabled={disabled} />
        </div>
      </div>
      <div className="col-start-2 flex items-center gap-3 small:col-start-auto small:flex-col small:items-start small:gap-1">
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <span className="small:hidden">Qty</span>
          {updating ? (
            <Spinner size="16" />
          ) : (
            <input
              className="h-9 w-20 rounded border border-brand-line px-2 text-center text-sm outline-none focus:border-brand-blue disabled:opacity-50"
              type="number"
              min={1}
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onBlur={(e) => handleBlur(Number(e.target.value))}
              onKeyDown={(e) => handleKeyDown(e)}
              disabled={disabled}
              aria-label={`Quantity for ${item.variant?.sku ?? item.title}`}
              data-testid="cart-item-quantity"
            />
          )}
        </label>
        <button
          className="text-xs text-neutral-500 hover:text-red-600 hover:underline disabled:opacity-50"
          onClick={() => handleDeleteItem(item.id)}
          disabled={disabled}
          data-testid="cart-item-remove"
        >
          Remove
        </button>
      </div>
      <div className="col-start-2 text-sm text-neutral-600 small:col-start-auto small:text-right">
        {fmt(item.unit_price)} <span className="text-xs">each</span>
      </div>
      <div className="col-start-2 text-base font-bold text-brand-navy small:col-start-auto small:text-right">
        {fmt(item.subtotal ?? item.unit_price * item.quantity)}
      </div>
    </div>
  )
}

export default ItemFull
