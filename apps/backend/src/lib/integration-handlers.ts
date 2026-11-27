import { registerRetryHandler } from "./integration-log";

/**
 * Where real integrations register how to resend a failed call, e.g.
 *   registerRetryHandler("erp", "Send order to ERP", async (container, request) => erp.sendOrder(request))
 */

// Demo integration used by the "Add sample events" button.
registerRetryHandler("test", "Sample sync", async () => ({ ok: true, note: "Retried successfully" }));
