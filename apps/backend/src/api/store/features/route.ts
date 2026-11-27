import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { getFeatures } from "../../../lib/features";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({ features: await getFeatures(req.scope) });
};
