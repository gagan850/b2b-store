import { StatusBadge } from "@medusajs/ui";

// Plain-language labels. The five statuses themselves are fixed in the quote module.
const StatusTitles: Record<string, string> = {
  pending_merchant: "Needs our reply",
  pending_customer: "Sent, waiting for customer",
  accepted: "Accepted",
  customer_rejected: "Declined by customer",
  merchant_rejected: "Declined by us",
};

const StatusColors: Record<string, "green" | "orange" | "red" | "blue" | "grey"> = {
  pending_merchant: "orange",
  pending_customer: "blue",
  accepted: "green",
  customer_rejected: "grey",
  merchant_rejected: "red",
};

export default function QuoteStatusBadge({
  status,
  revision = false,
}: {
  status: string;
  revision?: boolean;
}) {
  // The customer asked for changes instead of declining outright
  if (revision && status === "customer_rejected") {
    return <StatusBadge color="orange">Customer wants changes</StatusBadge>;
  }
  return (
    <StatusBadge color={StatusColors[status] ?? "grey"}>
      {StatusTitles[status] ?? status}
    </StatusBadge>
  );
}
