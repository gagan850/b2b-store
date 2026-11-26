import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * When an order is placed from an accepted quote (the cart carries quote_id),
 * remember the order on the quote's draft so the quote page can link to it.
 */
export default async function quoteOrderPlaced({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const orders = container.resolve(Modules.ORDER);

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "metadata"],
    filters: { id: data.id },
  });
  const quoteId = (order?.metadata as any)?.quote_id;
  if (!quoteId) return;

  const {
    data: [quote],
  } = await query.graph({
    entity: "quote",
    fields: ["id", "draft_order_id", "draft_order.metadata"],
    filters: { id: quoteId },
  });
  if (!quote) return;

  await orders.updateOrders(quote.draft_order_id, {
    metadata: {
      ...((quote as any).draft_order?.metadata ?? {}),
      quote_order_id: order.id,
      quote_order_display_id: order.display_id,
    },
  });
}

export const config: SubscriberConfig = { event: "order.placed" };
