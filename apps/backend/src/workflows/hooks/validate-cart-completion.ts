import { completeCartWorkflow } from "@medusajs/core-flows";
import { StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { getCartApprovalStatus } from "../../utils/get-cart-approval-status";
import { checkSpendingLimit } from "../../utils/check-spending-limit";
import { HttpTypes } from "@medusajs/framework/types";

export const ACCOUNT_PROVIDER_ID = "pp_account_account";
completeCartWorkflow.hooks.validate(async ({ cart }, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [queryCart],
  } = await query.graph({
    entity: "cart",
    fields: [
      "approvals.*",
      "customer_id",
      "total",
      "metadata",
      "payment_collection.payment_sessions.provider_id",
      "payment_collection.payment_sessions.data",
    ],
    filters: {
      id: cart.id,
    },
  });

  // Check if cart is pending approval
  const { isPendingApproval } = getCartApprovalStatus(queryCart);

  if (isPendingApproval) {
    throw new Error("Cart is pending approval");
  }

  // Check if spending limit will be exceeded
  if (queryCart.customer_id) {
    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["employee.spending_limit"],
      filters: {
        id: queryCart.customer_id,
      },
    });

    if (customer.employee?.spending_limit) {
      const spendLimitExceeded = checkSpendingLimit(
        queryCart as any,
        customer as any
      );

      if (spendLimitExceeded) {
        throw new Error("Cart total exceeds spending limit");
      }
    }
  }

  // Bill to account: any company buyer, unless the company is on credit hold.
  // Payment is skipped at checkout and the credit team charges later.
  const accountSession = queryCart.payment_collection?.payment_sessions?.find(
    (s: any) => s?.provider_id === ACCOUNT_PROVIDER_ID
  );

  if (accountSession) {
    // Look the company up through the signed-in customer's employee record.
    // The cart's company link comes from client-supplied metadata, so it is
    // not trusted for credit decisions.
    const company = queryCart.customer_id
      ? (
          await query.graph({
            entity: "customer",
            fields: [
              "employee.company.payment_terms",
              "employee.company.credit_hold",
            ],
            filters: { id: queryCart.customer_id },
          })
        ).data[0]?.employee?.company
      : null;

    if (!company) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only company accounts can bill to account. Please pay by card."
      );
    }

    if (company.credit_hold) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Your account is on credit hold. Please pay by card or contact your account manager."
      );
    }
  }

  return new StepResponse(undefined, null);
});
