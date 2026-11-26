import { StatusBadge } from "@medusajs/ui";
import { quoteStatus } from "../../../lib/status-labels";

export default function QuoteStatusBadge({
  status,
  revision = false,
}: {
  status: string;
  revision?: boolean;
}) {
  const s = quoteStatus(status, revision);
  return <StatusBadge color={s.color}>{s.label}</StatusBadge>;
}
