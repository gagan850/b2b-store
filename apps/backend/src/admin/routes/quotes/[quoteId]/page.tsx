import { JsonViewSection } from "@medusajs/dashboard/components";
import { CheckCircleSolid } from "@medusajs/icons";
import {
  Button,
  Container,
  Heading,
  Text,
  toast,
  Toaster,
  usePrompt,
} from "@medusajs/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useOrderPreview } from "../../../hooks/api";
import {
  useQuote,
  useRejectQuote,
  useSendQuote,
} from "../../../hooks/api/quotes";
import { formatAmount } from "../../../utils";
import {
  CostBreakdown,
  QuoteDetailsHeader,
  QuoteItems,
  QuoteTotal,
} from "../components/quote-details";
import { SendQuoteDialog } from "../components/send-quote-dialog";

const QuoteDetails = () => {
  const { quoteId } = useParams();
  const [sendOpen, setSendOpen] = useState(false);
  const prompt = usePrompt();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { quote, isLoading } = useQuote(quoteId!, {
    fields:
      "*draft_order.customer,*draft_order.customer.employee,*draft_order.customer.employee.company",
  });

  const { order: preview, isLoading: isPreviewLoading } = useOrderPreview(
    quote?.draft_order_id!,
    {},
    { enabled: !!quote?.draft_order_id }
  );

  const { mutateAsync: sendQuote, isPending: isSendingQuote } = useSendQuote(
    quoteId!
  );

  const { mutateAsync: rejectQuote, isPending: isRejectingQuote } =
    useRejectQuote(quoteId!);

  // Derived straight from the status, so nothing lingers after acceptance.
  const showSendQuote = ["pending_merchant", "customer_rejected"].includes(
    quote?.status as string
  );
  const showRejectQuote = ["pending_merchant", "pending_customer"].includes(
    quote?.status as string
  );

  const revisionNote: string =
    (quote?.draft_order as any)?.metadata?.quote_revision_note ?? "";
  const requestNote: string =
    ([...((quote as any)?.messages ?? [])] as any[])
      .filter((m) => m.customer_id)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0]?.text ?? "";

  const handleSendQuote = async (v: { valid_until: string; note: string }) => {
    await sendQuote(v, {
      onSuccess: () => {
        toast.success("Quote sent to customer");
        setSendOpen(false);
      },
      onError: (e) => toast.error(e.message),
    });
  };

  const handleRejectQuote = async () => {
    const res = await prompt({
      title: "Reject quote?",
      description:
        "You are about to reject this customer's quote. Do you want to continue?",
      confirmText: t("actions.continue"),
      cancelText: t("actions.cancel"),
      variant: "confirmation",
    });

    if (res) {
      await rejectQuote(void 0, {
        onSuccess: () =>
          toast.success("Successfully rejected customer's quote"),
        onError: (e) => toast.error(e.message),
      });
    }
  };

  if (isLoading || !quote) {
    return <></>;
  }

  if (isPreviewLoading) {
    return <></>;
  }

  if (!isPreviewLoading && !preview) {
    throw "preview not found";
  }

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex flex-col gap-x-4 lg:flex-row xl:items-start">
        <div className="flex w-full flex-col gap-y-3">
          {quote.status === "accepted" && (
            <Container className="divide-y divide-dashed p-0">
              <div className="flex items-center justify-between px-6 py-4">
                <Text className="txt-compact-small">
                  <CheckCircleSolid className="inline-block mr-2 text-green-500 text-lg" />
                  {(quote.draft_order as any)?.metadata?.quote_order_id
                    ? `Quote accepted. Order #${(quote.draft_order as any).metadata.quote_order_display_id} has been placed.`
                    : "Quote accepted. Awaiting the customer to complete checkout."}
                </Text>

                {(quote.draft_order as any)?.metadata?.quote_order_id && (
                  <Button
                    size="small"
                    onClick={() =>
                      navigate(
                        `/orders/${(quote.draft_order as any).metadata.quote_order_id}`
                      )
                    }
                  >
                    View Order
                  </Button>
                )}
              </div>
            </Container>
          )}

          {quote.status === "customer_rejected" && revisionNote && (
            <Container className="border-ui-tag-orange-border bg-ui-tag-orange-bg px-6 py-4">
              <Text size="small" weight="plus">
                The customer asked for changes
              </Text>
              <Text size="small" className="mt-1 whitespace-pre-line">
                {revisionNote}
              </Text>
              <Text size="xsmall" className="text-ui-fg-subtle mt-2">
                Edit prices or quantities from the menu (…) on the summary, then
                send the revised quote.
              </Text>
            </Container>
          )}

          {requestNote && (
            <Container className="px-6 py-4">
              <Text size="small" weight="plus">
                Customer's request note
              </Text>
              <Text size="small" className="text-ui-fg-subtle mt-1 whitespace-pre-line">
                {requestNote}
              </Text>
            </Container>
          )}

          <Container className="divide-y divide-dashed p-0">
            <QuoteDetailsHeader quote={quote} />
            <QuoteItems order={quote.draft_order} preview={preview!} />
            <CostBreakdown order={quote.draft_order} />
            <QuoteTotal order={quote.draft_order} preview={preview!} />

            {(showRejectQuote || showSendQuote) && (
              <div className="bg-ui-bg-subtle flex items-center justify-end gap-x-2 rounded-b-xl px-4 py-4">
                {showRejectQuote && (
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => handleRejectQuote()}
                    disabled={isSendingQuote}
                  >
                    Reject Quote
                  </Button>
                )}

                {showSendQuote && (
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => setSendOpen(true)}
                    disabled={isSendingQuote}
                  >
                    {quote.status === "customer_rejected" ? "Send revised quote" : "Send Quote"}
                  </Button>
                )}
              </div>
            )}
          </Container>

          <SendQuoteDialog
            open={sendOpen}
            setOpen={setSendOpen}
            busy={isSendingQuote}
            onSend={handleSendQuote}
          />

          <JsonViewSection data={quote} />
        </div>

        <div className="mt-2 flex w-full max-w-[100%] flex-col gap-y-3 xl:mt-0 xl:max-w-[400px]">
          <Container className="divide-y p-0">
            <div className="flex items-center justify-between px-6 py-4">
              <Heading level="h2">Customer</Heading>
            </div>

            <div className="text-ui-fg-subtle grid grid-cols-[110px_minmax(0,1fr)] items-start gap-x-3 px-6 py-4">
              <Text size="small" weight="plus" leading="compact">
                Email
              </Text>

              <Link
                className="text-sm break-all text-blue-500"
                to={`/customers/${quote.draft_order?.customer?.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                {quote.draft_order?.customer?.email}
              </Link>
            </div>

            <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
              <Text size="small" weight="plus" leading="compact">
                Phone
              </Text>

              <Text size="small" leading="compact" className="text-pretty">
                {quote.draft_order?.customer?.phone}
              </Text>
            </div>

            <div className="text-ui-fg-subtle grid grid-cols-[110px_minmax(0,1fr)] items-start gap-x-3 px-6 py-4">
              <Text size="small" weight="plus" leading="compact">
                Order limit
              </Text>

              <Text size="small" leading="compact" className="text-pretty">
                {Number((quote.draft_order?.customer as any)?.employee?.spending_limit) > 0
                  ? formatAmount(
                      Number((quote.draft_order?.customer as any)?.employee?.spending_limit),
                      (quote.draft_order?.currency_code as string) || "USD"
                    )
                  : "No limit"}
              </Text>
            </div>
          </Container>

          <Container className="divide-y p-0">
            <div className="flex items-center justify-between px-6 py-4">
              <Heading level="h2">Company</Heading>
            </div>

            <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
              <Text size="small" weight="plus" leading="compact">
                Name
              </Text>

              <Link
                className="text-sm text-pretty text-blue-500"
                to={`/companies/${(quote.draft_order?.customer as any)?.employee?.company?.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                {(quote.draft_order?.customer as any)?.employee?.company?.name}
              </Link>
            </div>
          </Container>
        </div>
      </div>

      <Toaster />
    </div>
  );
};

export default QuoteDetails;
