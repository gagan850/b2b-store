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
      text="We could not load that cart. Start again from the catalog."
      primary={{ label: "Go to the home page", href: "/" }}
      secondary={{ label: "Browse all products", href: "/store" }}
    />
  )
}
