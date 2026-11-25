import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  generateJwtToken,
} from "@medusajs/framework/utils";
import { IMPERSONATION_MINUTES } from "../../../../lib/impersonation";

/**
 * Swaps a one-time code (made by a logged-in staff member) for a short buyer
 * session. The code works once and expires after 60 seconds.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const code = String((req.body as any)?.code ?? "");
  if (!/^[a-f0-9]{48}$/.test(code)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid code");
  }
  const cache = req.scope.resolve(Modules.CACHE);
  const key = `impersonation:${code}`;
  const entry = (await cache.get(key)) as any;
  await cache.invalidate(key); // one use only
  if (!entry) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Code expired or already used");
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: identities } = await query.graph({
    entity: "auth_identity",
    fields: ["id", "app_metadata"],
  });
  const identity = identities.find((i: any) => i.app_metadata?.customer_id === entry.customer_id);

  const { projectConfig } = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE);
  const http = projectConfig.http;
  const token = generateJwtToken(
    {
      actor_id: entry.customer_id,
      actor_type: "customer",
      auth_identity_id: identity?.id ?? "",
      app_metadata: { customer_id: entry.customer_id },
      impersonated_by: entry.staff_id,
    },
    {
      secret: http.jwtSecret!,
      expiresIn: `${IMPERSONATION_MINUTES}m`,
      jwtOptions: http.jwtOptions,
    }
  );

  res.json({
    token,
    minutes: IMPERSONATION_MINUTES,
    customer_name: entry.customer_name,
    company_name: entry.company_name,
    staff_name: entry.staff_name,
    staff_id: entry.staff_id,
  });
};
