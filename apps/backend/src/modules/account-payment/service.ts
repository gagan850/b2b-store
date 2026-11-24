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
 * "Bill to account" (net terms). No money moves at checkout: the order is
 * authorized against the company's terms and captured later, when the ERP
 * invoices it. Who may use it is checked in the cart-completion hook
 * (see src/workflows/hooks/validate-cart-completion.ts).
 *
 * Provider id: pp_account_account
 */
class AccountPaymentProviderService extends AbstractPaymentProvider {
  static identifier = "account"

  constructor(container: Record<string, unknown>, options: Record<string, unknown> = {}) {
    super(container, options)
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    return {
      id: crypto.randomUUID(),
      data: { po_number: (input.data as any)?.po_number ?? null },
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return { data: { ...(input.data ?? {}) } }
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
    // Credit memos are issued in the ERP; nothing to call here.
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

export default AccountPaymentProviderService
