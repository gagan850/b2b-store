"use client"

import { useSession } from "@/lib/context/session-context"
import AccountButton from "@/modules/account/components/account-button"
import CartButton from "@/modules/cart/components/cart-button"

export default function NavSessionActions() {
  const { customer } = useSession()

  return (
    <>
      <AccountButton customer={customer} />

      <CartButton />
    </>
  )
}
