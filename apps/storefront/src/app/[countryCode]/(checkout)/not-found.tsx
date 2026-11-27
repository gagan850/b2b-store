import EmptyState from "@/modules/common/components/empty-state"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page not found",
}

export default function NotFound() {
  return (
    <EmptyState
      icon="search"
      title="We can't find that page"
      text="The link may be old or the item may no longer be sold."
      primary={{ label: "Go to the home page", href: "/" }}
      secondary={{ label: "Browse all products", href: "/store" }}
    />
  )
}
