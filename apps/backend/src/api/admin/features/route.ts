import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { getFeatures, setFeatures } from "../../../lib/features";

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  res.json({ features: await getFeatures(req.scope) });
};

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const body = (req.body ?? {}) as { approvals?: boolean };
  const features = await setFeatures(
    req.scope,
    typeof body.approvals === "boolean" ? { approvals: body.approvals } : {}
  );
  req.scope
    .resolve("logger")
    .info(`[features] ${req.auth_context?.actor_id} set features ${JSON.stringify(features)}`);
  res.json({ features });
};
