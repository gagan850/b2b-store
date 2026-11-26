import { AmountCell } from "@/modules/common/components/amount-cell"
import Thumbnail from "@/modules/products/components/thumbnail"
import { AdminOrderLineItem, AdminOrderPreview } from "@medusajs/types"
import { Badge, Text } from "@medusajs/ui"
import { useMemo } from "react"

export const QuoteTableItem = ({
  item,
  originalItem,
  currencyCode,
}: {
  item: AdminOrderPreview["items"][0]
  originalItem?: AdminOrderLineItem
  currencyCode: string
}) => {
  const isAddedItem = useMemo(
    () => !!item.actions?.find((a) => a.action === "ITEM_ADD"),
    [item]
  )

  const isItemUpdated = useMemo(
    () => !!item.actions?.find((a) => a.action === "ITEM_UPDATE"),
    [item]
  )

  const isItemRemoved = useMemo(() => {
    const updateAction = item.actions?.find((a) => a.action === "ITEM_UPDATE")

    return !!updateAction && item.quantity === item.detail.fulfilled_quantity
  }, [item])

  return (
    <div className="flex gap-x-4">
      <Thumbnail thumbnail={item.thumbnail} size="square" className="w-16" />

      <div className="flex flex-col w-full">
        <div>
          <Text
            size="small"
            leading="compact"
            weight="plus"
            className="text-ui-fg-base"
          >
            {item.product_title}
          </Text>

          {item.variant_sku && (
            <div className="flex items-center gap-x-1">
              <Text size="small">{item.variant_sku}</Text>
            </div>
          )}
          <Text size="small">
            {item.variant?.options?.map((o) => o.value).join(" · ")}
          </Text>
        </div>

        <div className="flex justify-between w-full items-center gap-x-3">
          <div className="flex flex-wrap items-center gap-x-2 text-sm text-ui-fg-subtle">
            <span className="tabular-nums">
              {Number(item.quantity).toLocaleString("en-US")}
            </span>
            <span aria-hidden>×</span>
            <AmountCell
              className="text-sm text-right justify-end items-end"
              currencyCode={currencyCode}
              amount={item.unit_price}
              originalAmount={originalItem?.unit_price}
            />
            {isAddedItem && (
              <Badge size="2xsmall" rounded="full" color="blue">New</Badge>
            )}
            {isItemRemoved ? (
              <Badge size="2xsmall" rounded="full" color="red">Removed</Badge>
            ) : (
              isItemUpdated && (
                <Badge size="2xsmall" rounded="full" color="orange">Modified</Badge>
              )
            )}
          </div>

          <AmountCell
            className="text-sm text-right justify-end items-end font-semibold"
            currencyCode={currencyCode}
            amount={item.total}
            originalAmount={originalItem?.total}
          />
        </div>
      </div>
    </div>
  )
}
