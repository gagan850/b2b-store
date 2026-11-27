import { describeDelivery, kindOf } from "@/lib/util/delivery"
import { estimate } from "@/lib/util/ship-dates"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  const method = order.shipping_methods?.[0] as any
  const pickup = method && kindOf(method) === "pickup"
  const a = order.shipping_address
  const meta = (order.metadata ?? {}) as Record<string, any>
  const eta = estimate(method?.data, new Date(order.created_at ?? Date.now()))

  return (
    <div className="flex flex-col gap-4">
      {method && (
        <div>
          <Heading level="h3" className="mb-1">
            Delivery
          </Heading>
          <Text className="txt-medium text-ui-fg-subtle" data-testid="delivery-method">
            {describeDelivery(method, method.data)}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {pickup ? "Ready for pickup " : "Estimated ship date "}
            {eta.shipDate}
            {eta.arrive ? ` · Est. delivery ${eta.arrive}` : ""}
          </Text>
          {meta.blind_ship && (
            <Text className="txt-medium text-ui-fg-subtle">
              Blind ship{meta.blind_ship_name ? ` as ${meta.blind_ship_name}` : ""}
            </Text>
          )}
          {meta.notes && (
            <Text className="txt-medium text-ui-fg-subtle">Instructions: {meta.notes}</Text>
          )}
        </div>
      )}
      {!pickup && a && (
        <div>
          <Heading level="h3" className="mb-1">
            Ship to
          </Heading>
          <div className="txt-medium text-ui-fg-subtle">
            {a.company && <Text>{a.company}</Text>}
            <Text>
              {a.first_name} {a.last_name}
            </Text>
            <Text>
              {a.address_1} {a.address_2}
            </Text>
            <Text>
              {[a.city, a.province].filter(Boolean).join(", ")} {a.postal_code}
            </Text>
            {a.phone && <Text>{a.phone}</Text>}
          </div>
        </div>
      )}
    </div>
  )
}

export default ShippingDetails
