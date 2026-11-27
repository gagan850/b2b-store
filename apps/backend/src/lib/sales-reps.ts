import { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

/**
 * Which sales rep owns which company: { [company_id]: admin_user_id }, kept on the
 * store record (metadata.sales_reps) so it needs no database migration.
 */
export const getRepMap = async (
  container: MedusaContainer
): Promise<Record<string, string>> => {
  const store = container.resolve(Modules.STORE);
  const [s] = await store.listStores({}, { take: 1 });
  return ((s?.metadata as any)?.sales_reps ?? {}) as Record<string, string>;
};

export const setRep = async (
  container: MedusaContainer,
  companyId: string,
  userId: string | null
) => {
  const store = container.resolve(Modules.STORE);
  const [s] = await store.listStores({}, { take: 1 });
  const map = { ...(((s?.metadata as any)?.sales_reps ?? {}) as Record<string, string>) };
  if (userId) map[companyId] = userId;
  else delete map[companyId];
  await store.updateStores(s.id, { metadata: { ...(s.metadata ?? {}), sales_reps: map } });
  return map;
};
