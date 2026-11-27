import { model } from "@medusajs/framework/utils";

/** One call to (or from) an outside system: ERP, payment, tax, shipping, email. */
export const IntegrationEvent = model
  .define("integration_event", {
    id: model.id({ prefix: "intev" }).primaryKey(),
    integration: model.text(), // e.g. "erp", "payment", "tax"
    action: model.text(), // e.g. "Send order to ERP"
    direction: model.enum(["outbound", "inbound"]).default("outbound"),
    status: model.enum(["success", "failed"]),
    reference_type: model.text().nullable(), // "order", "quote", "company"
    reference_id: model.text().nullable(),
    request: model.json().nullable(),
    response: model.json().nullable(),
    error: model.text().nullable(),
    duration_ms: model.number().default(0),
    attempt: model.number().default(1),
    retry_of: model.text().nullable(),
  })
  .indexes([
    { on: ["integration", "created_at"] },
    { on: ["status", "created_at"] },
  ]);
