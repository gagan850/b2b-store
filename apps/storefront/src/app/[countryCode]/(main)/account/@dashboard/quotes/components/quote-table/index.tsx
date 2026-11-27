import { formatAmount } from "@/modules/common/components/amount-cell"
import Thumbnail from "@/modules/products/components/thumbnail"
import { AdminOrderLineItem, AdminOrderPreview } from "@medusajs/types"
import { Badge } from "@medusajs/ui"

/**
 * One quote line: name and item number, then "qty × unit price" and the line
 * amount. If we changed the price, the old price is shown small as "was".
 */
export const QuoteTableItem = ({
  item,
  originalItem,
  currencyCode,
}: {
  item: AdminOrderPreview["items"][0]
  originalItem?: AdminOrderLineItem
  currencyCode: string
}) => {
  const added = !!item.actions?.find((a) => a.action === "ITEM_ADD")
  const updated = !!item.actions?.find((a) => a.action === "ITEM_UPDATE")
  const removed = updated && item.quantity === item.detail.fulfilled_quantity
  const unit = Number(item.unit_price)
  const was =
    !added && originalItem && Number(originalItem.unit_price) !== unit
      ? Number(originalItem.unit_price)
      : null
  const qty = Number(item.quantity)

  return (
    <div className="flex gap-x-4">
      <Thumbnail thumbnail={item.thumbnail} size="square" className="w-16" />

      <div className="flex w-full flex-col gap-y-1">
        <div className="flex items-start justify-between gap-x-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-navy">
              {item.product_title ?? item.title}
            </p>
            <p className="text-xs text-neutral-500">
              {item.variant_sku ? `Item # ${item.variant_sku}` : null}
              {item.variant?.options?.length
                ? ` · ${item.variant.options.map((o) => o.value).join(" · ")}`
                : null}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-brand-navy">
            {formatAmount(unit * qty, currencyCode)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 text-sm text-neutral-600">
          <span className="tabular-nums">{qty.toLocaleString("en-US")}</span>
          <span aria-hidden>×</span>
          <span>{formatAmount(unit, currencyCode)}</span>
          {was !== null && (
            <span className="text-xs text-neutral-400">
              (was <span className="line-through">{formatAmount(was, currencyCode)}</span>)
            </span>
          )}
          {added && <Badge size="2xsmall" rounded="full" color="blue">New</Badge>}
          {removed ? (
            <Badge size="2xsmall" rounded="full" color="red">Removed</Badge>
          ) : (
            updated && !added && (
              <Badge size="2xsmall" rounded="full" color="orange">Price Revised</Badge>
            )
          )}
        </div>
      </div>
    </div>
  )
}
