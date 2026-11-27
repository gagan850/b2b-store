import { retrieveCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import Wrapper from "@/modules/checkout/components/payment-wrapper"
import CheckoutForm from "@/modules/checkout/templates/checkout-form"
import CheckoutSummary from "@/modules/checkout/templates/checkout-summary"
import { B2BCart } from "@/types/global"
import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { countryCode } = await props.params
  const searchParams = await props.searchParams
  const cartId = searchParams.cartId as string
  const cart = (await retrieveCart(cartId)) as B2BCart

  // No cart (or an empty one): send the buyer back to the cart page.
  if (!cart || !cart.items?.length) {
    redirect(`/${countryCode}/cart`)
  }

  const customer = await retrieveCustomer()

  return (
    <Wrapper cart={cart}>
      <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-4 py-8 h-full">
        <CheckoutForm cart={cart} customer={customer} />
        <div className="relative">
          <CheckoutSummary cart={cart} />
        </div>
      </div>
    </Wrapper>
  )
}
