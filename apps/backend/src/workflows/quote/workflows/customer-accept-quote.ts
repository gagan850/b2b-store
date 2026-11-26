import {
  confirmOrderEditRequestWorkflow,
  useRemoteQueryStep,
} from "@medusajs/core-flows";
import { createWorkflow } from "@medusajs/framework/workflows-sdk";
import { validateQuoteAcceptanceStep } from "../steps/validate-quote-acceptance";
import { updateQuotesWorkflow } from "./update-quote";

/*
  A workflow that accepts a quote by a customer. 
  
  Once the customer accepts the quote, any staged changes made on the draft order is then committed.
  The draft order stays a draft: the buyer finishes in checkout (address, shipping, tax,
  payment) on a cart built from the quote, and the order is created there.
*/
export const customerAcceptQuoteWorkflow = createWorkflow(
  "customer-accept-quote",
  function (input: { quote_id: string; customer_id: string }) {
    const quote = useRemoteQueryStep({
      entry_point: "quote",
      fields: ["id", "draft_order_id", "status"],
      variables: { id: input.quote_id },
      list: false,
      throw_if_key_not_found: true,
    });

    validateQuoteAcceptanceStep({ quote });

    updateQuotesWorkflow.runAsStep({
      input: [{ id: input.quote_id, status: "accepted" }],
    });

    confirmOrderEditRequestWorkflow.runAsStep({
      input: {
        order_id: quote.draft_order_id,
        confirmed_by: input.customer_id,
      },
    });
  }
);
