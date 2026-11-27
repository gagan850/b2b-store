import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";
import { setRep } from "../../../../lib/sales-reps";

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const { company_id, user_id } = (req.body ?? {}) as {
    company_id?: string;
    user_id?: string | null;
  };
  if (!company_id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "company_id is required");
  }
  await setRep(req.scope, company_id, user_id || null);
  req.scope
    .resolve("logger")
    .info(
      `[sales] ${req.auth_context?.actor_id} assigned company ${company_id} to ${user_id || "nobody"}`
    );
  res.json({ ok: true });
};
