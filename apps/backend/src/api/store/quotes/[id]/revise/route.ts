import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils";
import { customerRejectQuoteWorkflow } from "../../../../../workflows/quote/workflows";

/**
 * Buyer asks for changes to a quote they received. One short note, no chat:
 * the quote goes back to staff, who change it and send it again.
 */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const note = String((req.body as any)?.note ?? "").trim().slice(0, 500);
  if (note.length < 3) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Please say what you would like changed");
  }
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [quote],
  } = await query.graph(
    {
      entity: "quote",
      fields: ["id", "status", "draft_order_id"],
      filters: { id, customer_id: req.auth_context.actor_id },
    },
    { throwIfKeyNotFound: true }
  );
  if (quote.status !== "pending_customer") {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This quote can't be changed right now");
  }

  await customerRejectQuoteWorkflow(req.scope).run({ input: { quote_id: id } });

  const orders = req.scope.resolve(Modules.ORDER);
  const draft = await orders.retrieveOrder(quote.draft_order_id);
  await orders.updateOrders(quote.draft_order_id, {
    metadata: {
      ...(draft.metadata ?? {}),
      quote_revision_note: note,
      quote_revision_at: new Date().toISOString(),
    },
  });
  res.json({ ok: true });
};
