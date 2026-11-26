import { Button, Input, Label, Prompt, Text, Textarea } from "@medusajs/ui";
import { useState } from "react";

const inDays = (n: number) =>
  new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

/** Asks how long the prices stay valid and for an optional note, then sends. */
export const SendQuoteDialog = ({
  open,
  setOpen,
  busy,
  onSend,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  busy: boolean;
  onSend: (v: { valid_until: string; note: string }) => void;
}) => {
  const [until, setUntil] = useState(inDays(30));
  const [note, setNote] = useState("");

  return (
    <Prompt open={open} onOpenChange={setOpen}>
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>Send quote to customer</Prompt.Title>
          <Prompt.Description>
            The buyer can accept until the valid-until date. They can also
            download this quote as a PDF.
          </Prompt.Description>
        </Prompt.Header>
        <div className="flex flex-col gap-y-4 px-6 pb-2">
          <div className="flex flex-col gap-y-1">
            <Label size="small" weight="plus">Valid until</Label>
            <Input
              type="date"
              value={until}
              min={inDays(1)}
              onChange={(e) => setUntil(e.target.value)}
            />
            <Text size="small" className="text-ui-fg-subtle">
              Default is 30 days.
            </Text>
          </div>
          <div className="flex flex-col gap-y-1">
            <Label size="small" weight="plus">Note on the quote (optional)</Label>
            <Textarea
              value={note}
              maxLength={500}
              placeholder="e.g. Lead time 10 business days. Freight quoted separately."
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <Prompt.Footer>
          <Prompt.Cancel>Cancel</Prompt.Cancel>
          <Button
            isLoading={busy}
            disabled={!until}
            onClick={() => onSend({ valid_until: until, note })}
          >
            Send quote
          </Button>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  );
};
