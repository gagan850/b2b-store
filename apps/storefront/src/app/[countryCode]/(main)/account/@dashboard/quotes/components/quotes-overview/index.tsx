"use client"

import EmptyState from "@/modules/common/components/empty-state"
import QuoteCard from "@/modules/account/components/quote-card"
import { StoreQuoteResponse } from "@/types/quote"

const QuotesOverview = ({
  quotes,
}: {
  quotes: StoreQuoteResponse["quote"][]
}) => {
  if (quotes?.length) {
    return (
      <div className="flex flex-col gap-y-2 w-full">
        {quotes.map((quote) => (
          <div key={quote.id}>
            <QuoteCard quote={quote} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <EmptyState
      icon="doc"
      title="No quote requests yet"
      text="Need a bigger quantity or a special price? Use Request a quote on any product page."
      primary={{ label: "Browse all products", href: "/store" }}
      compact
    />
  )
}

export default QuotesOverview
