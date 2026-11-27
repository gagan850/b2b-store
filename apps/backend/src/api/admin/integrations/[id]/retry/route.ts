import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";
import { INTEGRATION_LOG_MODULE } from "../../../../../modules/integration-log";
import { getRetryHandler, withIntegrationLog } from "../../../../../lib/integration-log";
import "../../../../../lib/integration-handlers";

/** Resends a failed event using the handler registered for its integration + action. */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const svc: any = req.scope.resolve(INTEGRATION_LOG_MODULE);
  const event = await svc.retrieveIntegrationEvent(req.params.id);

  if (event.status !== "failed") {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Only failed events can be retried");
  }
  const handler = getRetryHandler(event.integration, event.action);
  if (!handler) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Retry is not available for this event yet"
    );
  }

  let ok = true;
  let message: string | undefined;
  try {
    await withIntegrationLog(
      req.scope,
      {
        integration: event.integration,
        action: event.action,
        reference_type: event.reference_type ?? undefined,
        reference_id: event.reference_id ?? undefined,
        attempt: (event.attempt ?? 1) + 1,
        retry_of: event.id,
      },
      event.request,
      () => handler(req.scope, event.request)
    );
  } catch (e: any) {
    ok = false;
    message = e?.message;
  }
  req.scope
    .resolve("logger")
    .info(`[integrations] ${req.auth_context?.actor_id} retried ${event.id}: ${ok ? "ok" : "failed"}`);
  res.json({ ok, error: message });
};
