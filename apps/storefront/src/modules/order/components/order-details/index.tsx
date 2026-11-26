import { HttpTypes } from "@medusajs/types"
import { orderStatus, paymentStatus } from "@/lib/util/status-labels"
import StatusChip from "@/modules/order/components/status-chip"
import { Heading, Text } from "@medusajs/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetails = ({ order }: OrderDetailsProps) => {
  const createdAt = new Date(order.created_at)

  return (
    <>
      <Heading level="h3" className="mb-2">
        Details
      </Heading>

      <div className="text-sm text-ui-fg-subtle overflow-auto">
        <div className="flex justify-between">
          <Text>Order Number</Text>
          <Text>#{order.display_id}</Text>
        </div>

        <div className="flex items-center justify-between">
          <Text>Order Status</Text>
          <StatusChip {...orderStatus(order as any)} />
        </div>

        <div className="flex items-center justify-between">
          <Text>Payment</Text>
          <StatusChip {...paymentStatus(order as any)} />
        </div>

        <div className="flex justify-between mb-2">
          <Text>Order Date</Text>
          <Text>
            {createdAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </div>

        {(order.metadata as any)?.po_number && (
          <div className="mb-2 flex justify-between">
            <Text>PO number</Text>
            <Text data-testid="order-po">{(order.metadata as any).po_number}</Text>
          </div>
        )}

        <Text>
          We have sent the order confirmation details to{" "}
          <span className="font-semibold">{order.email}</span>.
        </Text>
      </div>
    </>
  )
}

export default OrderDetails
