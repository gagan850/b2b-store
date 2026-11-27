import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { INTEGRATION_LOG_MODULE } from "../../../modules/integration-log";

const DAY = 86400000;

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const svc: any = req.scope.resolve(INTEGRATION_LOG_MODULE);
  const q = req.query as Record<string, string | undefined>;
  const limit = Math.min(Number(q.limit) || 25, 100);
  const offset = Number(q.offset) || 0;
  const days = Math.min(Number(q.days) || 30, 90);

  const filters: Record<string, any> = {
    created_at: { $gte: new Date(Date.now() - days * DAY) },
  };
  if (q.status === "success" || q.status === "failed") filters.status = q.status;
  if (q.integration) filters.integration = q.integration;
  if (q.reference_id) filters.reference_id = q.reference_id;

  const [events, count] = await svc.listAndCountIntegrationEvents(filters, {
    take: limit,
    skip: offset,
    order: { created_at: "DESC" },
    select: ["id", "integration", "action", "direction", "status", "reference_type", "reference_id", "error", "duration_ms", "attempt", "retry_of", "created_at"],
  });

  // Summary over the last 30 days, grouped by integration
  const recent = await svc.listIntegrationEvents(
    { created_at: { $gte: new Date(Date.now() - 30 * DAY) } },
    { take: 20000, select: ["integration", "status", "error", "action", "created_at"], order: { created_at: "DESC" } }
  );
  const now = Date.now();
  const sum: Record<string, any> = {};
  for (const e of recent as any[]) {
    const s = (sum[e.integration] ??= {
      integration: e.integration,
      d1: { ok: 0, failed: 0 },
      d7: { ok: 0, failed: 0 },
      d30: { ok: 0, failed: 0 },
      last_error: null,
    });
    const age = now - new Date(e.created_at).getTime();
    const k = e.status === "success" ? "ok" : "failed";
    s.d30[k]++;
    if (age <= 7 * DAY) s.d7[k]++;
    if (age <= DAY) s.d1[k]++;
    if (e.status === "failed" && !s.last_error)
      s.last_error = { action: e.action, error: e.error, at: e.created_at };
  }

  res.json({ events, count, limit, offset, summary: Object.values(sum) });
};
