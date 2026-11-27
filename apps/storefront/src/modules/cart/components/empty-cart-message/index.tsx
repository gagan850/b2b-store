import EmptyState from "@/modules/common/components/empty-state"

const EmptyCartMessage = () => (
  <EmptyState
    icon="cart"
    title="Your cart is empty"
    text="Add items from the catalog, or reorder something you bought before."
    primary={{ label: "Browse all products", href: "/store" }}
    secondary={{ label: "Order history", href: "/account/orders" }}
    testId="empty-cart-message"
  />
)

export default EmptyCartMessage
