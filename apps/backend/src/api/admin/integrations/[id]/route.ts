import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { INTEGRATION_LOG_MODULE } from "../../../../modules/integration-log";

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const svc: any = req.scope.resolve(INTEGRATION_LOG_MODULE);
  const event = await svc.retrieveIntegrationEvent(req.params.id);
  res.json({ event });
};
