import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
import { randomBytes } from "crypto";
import { IMPERSONATION_CODE_TTL_SECONDS as CODE_TTL_SECONDS } from "../../../../../../../lib/impersonation";


/**
 * Staff only (admin session). Starts "shop as this buyer": returns a one-time
 * code, valid for 60 seconds, that the storefront swaps for a 30 minute buyer
 * session. The start is written to the customer's audit trail.
 */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const { id: companyId, employeeId } = req.params;
  const body = (req.body ?? {}) as { reason?: string; mode?: string };
  const reason = String(body.reason ?? "").trim().slice(0, 300);
  const mode = body.mode === "order" ? "order" : "view";
  if (reason.length < 3) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "A reason is required");
  }
  const staffId = req.auth_context?.actor_id;
  if (!staffId) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Staff login required");

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [employee],
  } = await query.graph(
    {
      entity: "employee",
      fields: ["id", "company_id", "customer.*", "company.name"],
      filters: { id: employeeId },
    },
    { throwIfKeyNotFound: true }
  );
  if (employee.company_id !== companyId) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Buyer is not part of this company");
  }

  const {
    data: [staff],
  } = await query.graph({ entity: "user", fields: ["id", "email", "first_name", "last_name"], filters: { id: staffId } });
  const staffName =
    [staff?.first_name, staff?.last_name].filter(Boolean).join(" ") || staff?.email || staffId;

  const customer = employee.customer as any;
  const customerId: string = customer?.id;
  const code = randomBytes(24).toString("hex");
  const cache = req.scope.resolve(Modules.CACHE);
  await cache.set(
    `impersonation:${code}`,
    {
      customer_id: customerId,
      customer_name: [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || customer?.email,
      company_name: (employee.company as any)?.name,
      staff_id: staffId,
      staff_name: staffName,
      reason,
      mode,
    },
    CODE_TTL_SECONDS
  );

  // Audit trail on the customer (last 50 entries)
  const customerModule = req.scope.resolve(Modules.CUSTOMER);
  const log = Array.isArray(customer?.metadata?.impersonation_log)
    ? customer.metadata.impersonation_log
    : [];
  log.push({ event: "start", at: new Date().toISOString(), staff_id: staffId, staff: staffName, reason, mode });
  await customerModule.updateCustomers(customerId, {
    metadata: { ...(customer?.metadata ?? {}), impersonation_log: log.slice(-50) },
  });
  req.scope
    .resolve(ContainerRegistrationKeys.LOGGER)
    .info(`[impersonation] ${staffName} (${staffId}) started shopping as customer ${customerId} (${mode}): ${reason}`);

  res.json({ code });
};
