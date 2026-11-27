import { MedusaContainer } from "@medusajs/framework/types";
import { INTEGRATION_LOG_MODULE } from "../modules/integration-log";

const KEEP_DAYS = 90;

/** Keeps the integration log from growing forever: drops events older than 90 days. */
export default async function purgeIntegrationLog(container: MedusaContainer) {
  const svc: any = container.resolve(INTEGRATION_LOG_MODULE);
  const cutoff = new Date(Date.now() - KEEP_DAYS * 86400000);
  const old = await svc.listIntegrationEvents(
    { created_at: { $lt: cutoff } },
    { select: ["id"], take: 5000 }
  );
  if (old.length) await svc.deleteIntegrationEvents(old.map((e: any) => e.id));
}

export const config = { name: "purge-integration-log", schedule: "0 3 * * *" };
