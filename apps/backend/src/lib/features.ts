import { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

/**
 * Feature switches kept on the store record (metadata.features), so staff can
 * flip them from admin without a restart. Anything not set uses the default.
 */
export type Features = { approvals: boolean };
export const FEATURE_DEFAULTS: Features = { approvals: false };

export const getFeatures = async (container: MedusaContainer): Promise<Features> => {
  const store = container.resolve(Modules.STORE);
  const [s] = await store.listStores({}, { take: 1 });
  return { ...FEATURE_DEFAULTS, ...((s?.metadata as any)?.features ?? {}) };
};

export const setFeatures = async (
  container: MedusaContainer,
  patch: Partial<Features>
): Promise<Features> => {
  const store = container.resolve(Modules.STORE);
  const [s] = await store.listStores({}, { take: 1 });
  const next = { ...FEATURE_DEFAULTS, ...((s?.metadata as any)?.features ?? {}), ...patch };
  await store.updateStores(s.id, { metadata: { ...(s.metadata ?? {}), features: next } });
  return next;
};
