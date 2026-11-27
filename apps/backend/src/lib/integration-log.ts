import { MedusaContainer } from "@medusajs/framework/types";
import { INTEGRATION_LOG_MODULE } from "../modules/integration-log";

export const INTEGRATIONS = ["erp", "payment", "tax", "shipping", "email"] as const;

const SECRET_KEY = /pass(word)?|secret|token|api[-_]?key|authorization|card[-_]?number|cvc|cvv|pan\b/i;
const MAX_STRING = 4000;
const MAX_DEPTH = 6;

/** Copy of a payload that is safe to store: secrets masked, long text cut. */
export const sanitize = (value: unknown, depth = 0): unknown => {
  if (value == null) return value;
  if (depth > MAX_DEPTH) return "[too deep]";
  if (typeof value === "string")
    return value.length > MAX_STRING ? value.slice(0, MAX_STRING) + `… [+${value.length - MAX_STRING} chars]` : value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => sanitize(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SECRET_KEY.test(k) ? "••••••" : sanitize(v, depth + 1);
  }
  return out;
};

export type IntegrationCall = {
  integration: string;
  action: string;
  direction?: "outbound" | "inbound";
  reference_type?: string;
  reference_id?: string;
  attempt?: number;
  retry_of?: string;
};

/**
 * Wrap any call to an outside system so it shows up on the admin Integrations page.
 *   const result = await withIntegrationLog(container, { integration: "erp", action: "Send order", reference_type: "order", reference_id: order.id }, payload, () => erp.send(payload))
 * Logging never breaks the call itself: if the log write fails, the result is still returned.
 */
export const withIntegrationLog = async <T>(
  container: MedusaContainer,
  call: IntegrationCall,
  request: unknown,
  fn: () => Promise<T>
): Promise<T> => {
  const started = Date.now();
  const save = async (status: "success" | "failed", response: unknown, error?: string) => {
    try {
      const svc: any = container.resolve(INTEGRATION_LOG_MODULE);
      await svc.createIntegrationEvents({
        direction: "outbound",
        ...call,
        status,
        request: sanitize(request),
        response: sanitize(response),
        error: error ? String(error).slice(0, MAX_STRING) : null,
        duration_ms: Date.now() - started,
      });
    } catch (e) {
      container.resolve("logger").warn(`[integration-log] could not record event: ${(e as Error).message}`);
    }
  };
  try {
    const result = await fn();
    await save("success", result);
    return result;
  } catch (e: any) {
    await save("failed", e?.response ?? e?.data ?? null, e?.message ?? String(e));
    throw e;
  }
};

/**
 * Retry handlers, keyed by "integration:action". A real integration registers one so the
 * Retry button on a failed event can resend it. It receives the stored request.
 */
type RetryHandler = (container: MedusaContainer, request: any) => Promise<unknown>;
const handlers = new Map<string, RetryHandler>();
export const registerRetryHandler = (integration: string, action: string, fn: RetryHandler) =>
  handlers.set(`${integration}:${action}`, fn);
export const getRetryHandler = (integration: string, action: string) =>
  handlers.get(`${integration}:${action}`);
