import crypto from "crypto"
import {
  AbstractPaymentProvider,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"

/**
 * Credit card, DEMO MODE. Stands in for the PayPal (or Stripe) card provider
 * until sandbox credentials are set up. It never receives a card number:
 * the storefront sends only a display summary (brand, last 4, expiry), which
 * is what a real processor returns for a vaulted card. Nothing is charged.
 *
 * Swap for the real provider by replacing this module in medusa-config.ts;
 * the storefront reads only `data.card` for display.
 *
 * Provider id: pp_card_card
 */
const pickCard = (data: any) => {
  const c = data?.card
  if (!c) return null
  return {
    brand: String(c.brand ?? "Card").slice(0, 20),
    last4: String(c.last4 ?? "").replace(/\D/g, "").slice(-4),
    exp: String(c.exp ?? "").slice(0, 7),
    saved_card_id: c.saved_card_id ? String(c.saved_card_id).slice(0, 40) : null,
  }
}

class CardPaymentProviderService extends AbstractPaymentProvider {
  static identifier = "card"

  constructor(container: Record<string, unknown>, options: Record<string, unknown> = {}) {
    super(container, options)
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    return {
      id: crypto.randomUUID(),
      data: { card: pickCard(input.data), demo: true },
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return { data: { card: pickCard(input.data), demo: true } }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    return {
      data: { ...(input.data ?? {}), authorized_at: new Date().toISOString() },
      status: PaymentSessionStatus.AUTHORIZED,
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return { data: { ...(input.data ?? {}), captured_at: new Date().toISOString() } }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data ?? {} }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    return { data: input.data ?? {} }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async getPaymentStatus(_: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    return { status: PaymentSessionStatus.AUTHORIZED }
  }

  async getWebhookActionAndData(_: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    return { action: PaymentActions.NOT_SUPPORTED }
  }
}

export default CardPaymentProviderService
