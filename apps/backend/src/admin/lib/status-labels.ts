/**
 * Status wording for admin. Keep in step with the storefront's
 * lib/util/status-labels.ts so staff and buyers see the same words.
 */
export type Tone = "green" | "orange" | "red" | "blue" | "grey";

export const quoteStatus = (
  status: string,
  revision = false
): { label: string; color: Tone } => {
  if (revision && status === "customer_rejected")
    return { label: "Revision Requested", color: "orange" };
  switch (status) {
    case "pending_merchant":
      return { label: "Under Review", color: "orange" };
    case "pending_customer":
      return { label: "Quote Issued", color: "blue" };
    case "accepted":
      return { label: "Accepted", color: "green" };
    case "customer_rejected":
      return { label: "Declined", color: "grey" };
    case "merchant_rejected":
      return { label: "Unable to Quote", color: "red" };
    default:
      return { label: status, color: "grey" };
  }
};

export const approvalStatus = (status: string): { label: string; color: Tone } => {
  const s = String(status).toLowerCase();
  if (s === "approved") return { label: "Approved", color: "green" };
  if (s === "rejected") return { label: "Rejected", color: "red" };
  return { label: "Pending Approval", color: "orange" };
};
