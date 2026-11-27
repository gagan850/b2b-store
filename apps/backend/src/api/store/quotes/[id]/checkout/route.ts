import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
import { createCartWorkflow } from "@medusajs/core-flows";

/**
 * After a buyer accepts a quote, this builds a cart holding the agreed items at
 * the agreed prices. The buyer then finishes in the normal checkout (address,
 * shipping, tax, payment) and the order is created there, tagged with the quote.
 * Calling it again returns the same open cart.
 */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const orders = req.scope.resolve(Modules.ORDER);
  const carts = req.scope.resolve(Modules.CART);

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

  if (quote.status !== "accepted") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Accept the quote before continuing to checkout"
    );
  }

  const {
    data: [draft],
  } = await query.graph(
    {
      entity: "order",
      fields: [
        "id",
        "email",
        "currency_code",
        "region_id",
        "sales_channel_id",
        "customer_id",
        "metadata",
        "items.variant_id",
        "items.quantity",
        "items.unit_price",
        "items.adjustments.code",
      ],
      filters: { id: quote.draft_order_id },
    },
    { throwIfKeyNotFound: true }
  );

  const meta = (draft.metadata ?? {}) as Record<string, any>;

  if (meta.quote_order_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "An order has already been placed for this quote"
    );
  }

  if (meta.quote_cart_id) {
    try {
      const existing = await carts.retrieveCart(meta.quote_cart_id);
      if (!(existing as any).completed_at) {
        return res.json({ cart_id: existing.id });
      }
    } catch {
      // cart is gone: build a new one below
    }
  }

  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "employee.company_id"],
    filters: { id: req.auth_context.actor_id },
  });

  const promoCodes = Array.from(
    new Set(
      (draft.items ?? []).flatMap((i: any) =>
        (i.adjustments ?? []).map((a: any) => a?.code).filter(Boolean)
      )
    )
  ) as string[];

  const { result: cart } = await createCartWorkflow(req.scope).run({
    input: {
      region_id: draft.region_id!,
      currency_code: draft.currency_code,
      sales_channel_id: draft.sales_channel_id ?? undefined,
      customer_id: customer.id,
      email: customer.email ?? draft.email ?? undefined,
      promo_codes: promoCodes,
      metadata: {
        company_id: (customer as any).employee?.company_id,
        quote_id: quote.id,
        quote_number: draft.display_id ?? undefined,
      },
      items: (draft.items ?? [])
        .filter((i: any) => i.variant_id && Number(i.quantity) > 0)
        .map((i: any) => ({
          variant_id: i.variant_id,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          is_custom_price: true,
          metadata: { quote_id: quote.id },
        })),
    } as any,
  });

  await orders.updateOrders(quote.draft_order_id, {
    metadata: { ...meta, quote_cart_id: cart.id },
  });

  return res.json({ cart_id: cart.id });
};
