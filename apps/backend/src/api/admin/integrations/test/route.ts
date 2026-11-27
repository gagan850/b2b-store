import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { withIntegrationLog } from "../../../../lib/integration-log";
import "../../../../lib/integration-handlers";

/** Writes a few sample events (successes and failures) so the page can be tried before real integrations exist. */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  for (let i = 1; i <= 6; i++) {
    const fail = i % 3 === 0;
    try {
      await withIntegrationLog(
        req.scope,
        { integration: "test", action: "Sample sync", reference_type: "order", reference_id: `sample_${i}` },
        { order: `SAMPLE-${i}`, total: 100 * i, api_key: "sk_live_should_be_masked" },
        async () => {
          if (fail) throw Object.assign(new Error("Sample failure: remote system returned 503"), { response: { status: 503 } });
          return { status: 200, accepted: true };
        }
      );
    } catch {
      // expected for the sample failures
    }
  }
  res.json({ ok: true });
};
