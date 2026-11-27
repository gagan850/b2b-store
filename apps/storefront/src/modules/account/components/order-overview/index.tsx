"use client"

import EmptyState from "@/modules/common/components/empty-state"

import OrderCard from "@/modules/account/components/order-card"
import { HttpTypes } from "@medusajs/types"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <div className="flex flex-col gap-y-2 w-full">
        {orders.map((o) => (
          <div key={o.id}>
            <OrderCard order={o} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <EmptyState
      icon="box"
      title="No orders yet"
      text="Orders you place will show up here, with tracking and invoices."
      primary={{ label: "Start shopping", href: "/store" }}
      compact
      testId="no-orders-container"
    />
  )
}

export default OrderOverview
