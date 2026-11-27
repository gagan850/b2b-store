import { zodResolver } from "@hookform/resolvers/zod";
import { AdminOrderPreview } from "@medusajs/framework/types";
import {
  Button,
  clx,
  Container,
  Heading,
  Select,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { QueryQuote } from "../../../../types";
import { Form } from "@medusajs/dashboard/components";
import { useCreateQuoteMessage } from "../../../hooks/api/quotes";
import { QuoteItem } from "./quote-details";

const nameOf = (p: any, fallback: string) =>
  [p?.first_name, p?.last_name].filter(Boolean).join(" ") || p?.email || fallback;

export const CreateQuoteMessageForm = z.object({
  text: z.string().min(1),
  item_id: z.string().nullish(),
});

export function QuoteMessages({
  quote,
  preview,
}: {
  quote: QueryQuote;
  preview: AdminOrderPreview;
}) {
  const { quoteId } = useParams();

  /**
   * FORM
   */
  const form = useForm<z.infer<typeof CreateQuoteMessageForm>>({
    defaultValues: () =>
      Promise.resolve({
        text: "",
        item_id: null,
      }),
    resolver: zodResolver(CreateQuoteMessageForm),
  });

  const { mutateAsync: createMessage, isPending: isCreatingMessage } =
    useCreateQuoteMessage(quoteId!);

  const originalItemsMap = useMemo(() => {
    return new Map(quote?.draft_order?.items?.map((item) => [item.id, item]));
  }, [quote?.draft_order]);

  const previewItemsMap = useMemo(() => {
    return new Map(preview?.items?.map((item) => [item.id, item]));
  }, [preview]);

  const handleCreateMessage = async () => {
    await createMessage(
      {},
      {
        onSuccess: () => toast.success("Successfully sent message to customer"),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    await createMessage(
      {
        text: data.text,
        item_id: data.item_id,
      },
      {
        onSuccess: () => {
          form.reset();
          toast.success("Successfully sent message to customer");
        },
        onError: (e) => toast.error(e.message),
      }
    );
  });

  return (
    <Container className="divide-y divide-dashed p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Messages</Heading>
      </div>

      <div className="bg-ui-bg-subtle flex max-h-[32rem] flex-col gap-y-4 overflow-y-auto px-6 py-4">
        {(quote.messages ?? []).length === 0 && (
          <Text size="small" className="text-ui-fg-muted py-4 text-center">
            No messages yet.
          </Text>
        )}
        {[...(quote.messages ?? [])]
          .sort(
            (a: any, b: any) =>
              new Date(a.created_at ?? 0).getTime() -
              new Date(b.created_at ?? 0).getTime()
          )
          .map((message: any) => {
            const staff = !!message.admin_id;
            const line = message.item_id
              ? previewItemsMap.get(message.item_id)
              : null;
            return (
              <div
                key={message.id}
                className={clx("flex flex-col gap-y-1", {
                  "items-end": staff,
                  "items-start": !staff,
                })}
              >
                <Text size="xsmall" className="text-ui-fg-muted">
                  {staff
                    ? nameOf(message.admin, "Staff")
                    : nameOf(message.customer, "Customer")}
                  {message.created_at
                    ? ` · ${new Date(message.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}`
                    : ""}
                </Text>
                <div
                  className={clx(
                    "max-w-[85%] whitespace-pre-line rounded-lg px-4 py-2.5 text-sm",
                    staff
                      ? "bg-ui-bg-interactive text-ui-fg-on-color"
                      : "bg-ui-bg-base border"
                  )}
                >
                  {line && (
                    <div className="mb-1 border-b border-current/20 pb-1 text-xs opacity-80">
                      About: {line.variant_sku} · {line.title}
                    </div>
                  )}
                  {message.text}
                </div>
              </div>
            );
          })}
      </div>

      <div className="px-4 pt-5 pb-3">
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-y-3">
            <Form.Field
              control={form.control}
              name="item_id"
              render={({ field: { onChange, ref, ...field } }) => {
                return (
                  <Form.Item>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Form.Label>Pick Quote Item</Form.Label>
                        <Form.Hint>
                          Select a quote item to write a message around
                        </Form.Hint>
                      </div>
                      <div className="flex-1">
                        <Form.Control>
                          <Select
                            onValueChange={onChange}
                            {...field}
                            value={field.value ?? undefined}
                          >
                            <Select.Trigger className="bg-ui-bg-base" ref={ref}>
                              <Select.Value placeholder="Select Item" />
                            </Select.Trigger>
                            <Select.Content>
                              {preview.items.map((l) => (
                                <Select.Item key={l.id} value={l.id}>
                                  {l.variant_sku}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select>
                        </Form.Control>
                      </div>
                    </div>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />

            <Form.Field
              name={`text`}
              render={({ field: { ref, ...field } }) => {
                return (
                  <Form.Item>
                    <Form.Control>
                      <Textarea {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />

            <Button
              size="small"
              type="submit"
              className="self-end"
              disabled={isCreatingMessage}
              onClick={() => handleCreateMessage}
            >
              Send
            </Button>
          </form>
        </Form>
      </div>
    </Container>
  );
}
