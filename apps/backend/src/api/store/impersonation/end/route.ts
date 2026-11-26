import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

/**
 * Called when staff press Exit. Writes the end of the session to the buyer's
 * audit trail. Only does something for sessions that were started by staff.
 */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const customerId = req.auth_context?.actor_id;
  const staffId = (req.body as any)?.staff_id as string | undefined;
  if (customerId && staffId) {
    const customerModule = req.scope.resolve(Modules.CUSTOMER);
    const customer = await customerModule.retrieveCustomer(customerId);
    const log = Array.isArray(customer.metadata?.impersonation_log)
      ? (customer.metadata!.impersonation_log as any[])
      : [];
    log.push({ event: "end", at: new Date().toISOString(), staff_id: staffId });
    await customerModule.updateCustomers(customerId, {
      metadata: { ...(customer.metadata ?? {}), impersonation_log: log.slice(-50) },
    });
  }
  res.json({ ok: true });
};
