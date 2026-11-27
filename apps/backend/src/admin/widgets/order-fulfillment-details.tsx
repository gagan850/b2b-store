import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/client"
import { estimate } from "../lib/ship-dates"

/**
 * What the warehouse and AR need from checkout, in one place on the order
 * page: PO number, how it ships (carrier, customer's own account, or will
 * call), blind ship, instructions, ETA and the card used.
 */

type Row = { label: string; value: React.ReactNode }

const RowList = ({ rows }: { rows: Row[] }) => (
  <dl>
    {rows.map((r) => (
      <div key={r.label} className="grid grid-cols-[110px_1fr] gap-3 border-b last:border-b-0 border-ui-border-base px-6 py-3">
        <dt>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {r.label}
          </Text>
        </dt>
        <dd>
          <Text as="div" size="small" leading="compact" weight="plus" className="break-words">
            {r.value}
          </Text>
        </dd>
      </div>
    ))}
  </dl>
)

const OrderFulfillmentDetails = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const { data: res, isPending } = useQuery({
    queryKey: ["order-fulfillment-details", data.id],
    queryFn: () =>
      sdk.admin.order.retrieve(data.id, {
        fields:
          "created_at,metadata,*shipping_methods,*payment_collections,*payment_collections.payments",
      }),
  })

  if (isPending || !res) return null
  const order = res.order as any
  const meta = (order.metadata ?? {}) as Record<string, any>
  const method = order.shipping_methods?.[0]
  const mdata = (method?.data ?? {}) as Record<string, any>
  const kind: string = mdata.kind ?? "carrier"
  const payment = order.payment_collections?.[0]?.payments?.[0]
  const card = payment?.data?.card as { brand: string; last4: string; exp?: string } | undefined
  const eta = method ? estimate(mdata, new Date(order.created_at), new Date(order.created_at)) : null

  const rows: Row[] = []

  rows.push({ label: "PO number", value: meta.po_number || "None given" })

  if (kind === "pickup") {
    const p = mdata.pickup ?? {}
    rows.push({
      label: "Delivery",
      value: (
        <>
          <Badge size="2xsmall" color="purple" className="mr-2">
            Will call
          </Badge>
          {p.warehouse ?? method?.name}
        </>
      ),
    })
    if (p.address) rows.push({ label: "Pickup at", value: p.address })
    if (p.hours) rows.push({ label: "Hours", value: p.hours })
    if (eta) rows.push({ label: "Ready", value: eta.shipDate })
  } else if (kind === "collect") {
    const a = mdata.carrier_account ?? {}
    rows.push({
      label: "Delivery",
      value: (
        <>
          <Badge size="2xsmall" color="orange" className="mr-2">
            Customer's account
          </Badge>
          {[a.carrier, a.service].filter(Boolean).join(" ")}
        </>
      ),
    })
    rows.push({ label: "Bill to acct #", value: a.account_number ?? "Missing" })
    if (eta) rows.push({ label: "Ship by", value: eta.shipDate })
  } else {
    rows.push({ label: "Delivery", value: method?.name ?? "Not set" })
    if (eta) rows.push({ label: "Ship by", value: eta.shipDate })
    if (eta?.arrive) rows.push({ label: "Est. arrival", value: eta.arrive })
  }

  if (kind !== "pickup") {
    rows.push({
      label: "Blind ship",
      value: meta.blind_ship ? (
        <>
          <Badge size="2xsmall" color="red" className="mr-2">
            Yes
          </Badge>
          Ship from: {meta.blind_ship_name || "no name, leave blank"}
        </>
      ) : (
        "No"
      ),
    })
  }

  if (meta.notes) rows.push({ label: "Instructions", value: meta.notes })

  if (meta.placed_by_staff) {
    rows.push({
      label: "Placed by",
      value: (
        <>
          <Badge size="2xsmall" color="blue" className="mr-2">
            On behalf
          </Badge>
          {meta.placed_by_staff}
        </>
      ),
    })
  }

  rows.push({
    label: "Payment",
    value: card
      ? `${card.brand} ending in ${card.last4}${card.exp ? `, exp ${card.exp}` : ""}`
      : payment?.provider_id === "pp_account_account"
      ? "Billed to account"
      : payment?.provider_id ?? "Payment Pending",
  })

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between border-b border-ui-border-base px-6 py-4">
        <Heading level="h2">Order details</Heading>
        {meta.blind_ship && kind !== "pickup" && (
          <Badge size="2xsmall" color="red">
            Blind ship
          </Badge>
        )}
      </div>
      <RowList rows={rows} />
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default OrderFulfillmentDetails
