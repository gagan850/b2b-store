import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { QUOTE_VALID_DAYS } from "../../../../../lib/brand";
import { merchantSendQuoteWorkflow } from "../../../../../workflows/quote/workflows";
import { AdminSendQuoteType } from "../../validators";

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminSendQuoteType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id } = req.params;

  const { valid_until, note } = req.validatedBody ?? {};
  await merchantSendQuoteWorkflow(req.scope).run({ input: { quote_id: id } });

  // Price validity and note live on the draft order so the buyer and the PDF can show them
  const {
    data: [q],
  } = await query.graph({ entity: "quote", fields: ["id", "draft_order_id"], filters: { id } });
  const orderModule = req.scope.resolve(Modules.ORDER);
  const draft = await orderModule.retrieveOrder(q.draft_order_id);
  const until =
    valid_until && !isNaN(Date.parse(valid_until))
      ? new Date(valid_until)
      : new Date(Date.now() + QUOTE_VALID_DAYS * 86400000);
  until.setHours(23, 59, 59, 0);
  await orderModule.updateOrders(q.draft_order_id, {
    metadata: {
      ...(draft.metadata ?? {}),
      quote_valid_until: until.toISOString(),
      quote_note: note ?? "",
    },
  });

  const {
    data: [quote],
  } = await query.graph(
    {
      entity: "quote",
      fields: req.queryConfig.fields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ quote });
};
