import { Eye } from "@medusajs/icons";
import {
  Alert,
  Badge,
  Button,
  Heading,
  Label,
  Prompt,
  RadioGroup,
  Select,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui";
import { useState } from "react";
import { QueryCompany, QueryEmployee } from "../../../../../types";
import { sdk } from "../../../../lib/client";

const STOREFRONT_URL =
  (import.meta as any).env?.VITE_STOREFRONT_URL ?? "http://localhost:8000";

const REASONS = [
  "Customer reports a pricing issue",
  "Customer needs help placing an order",
  "Checking contract or customer-group pricing",
  "Reproducing a problem the customer reported",
  "Account or catalogue review",
  "Other",
];

export const ShopAsBuyerModal = ({
  company,
  employee,
  open,
  setOpen,
}: {
  company: QueryCompany;
  employee: QueryEmployee;
  open: boolean;
  setOpen: (v: boolean) => void;
}) => {
  const [preset, setPreset] = useState<string>("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"view" | "order">("view");
  const [busy, setBusy] = useState(false);

  const name =
    [employee.customer?.first_name, employee.customer?.last_name]
      .filter(Boolean)
      .join(" ") ||
    employee.customer?.email ||
    "this buyer";
  const reason = [preset, note.trim()].filter(Boolean).join(": ");
  const ready = Boolean(preset) && (preset !== "Other" || note.trim().length >= 3);

  const start = async () => {
    setBusy(true);
    // Open the window first so the browser does not block it as a pop-up
    const win = window.open("", "_blank");
    try {
      const { code } = await sdk.client.fetch<{ code: string }>(
        `/admin/companies/${employee.company_id}/employees/${employee.id}/impersonate`,
        { method: "POST", body: { reason, mode } }
      );
      const url = `${STOREFRONT_URL}/api/impersonate?code=${code}`;
      if (win) win.location.href = url;
      else window.location.href = url;
      setOpen(false);
      setPreset("");
      setNote("");
      setMode("view");
    } catch (e: any) {
      win?.close();
      toast.error(e?.message ?? "Could not start a session for this buyer");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Prompt open={open} onOpenChange={setOpen}>
      <Prompt.Content className="max-w-lg">
        <Prompt.Header>
          <div className="flex items-center gap-x-2">
            <Eye />
            <Prompt.Title>Shop as {name}</Prompt.Title>
          </div>
          <Prompt.Description asChild>
            <div className="flex flex-col gap-y-1 pt-1">
              <Text size="small" className="text-ui-fg-subtle">
                {employee.customer?.email} · {company.name}
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                You will see the store exactly as this buyer does, including
                their contract prices. The session lasts 30 minutes.
              </Text>
            </div>
          </Prompt.Description>
        </Prompt.Header>

        <div className="flex flex-col gap-y-5 px-6 pb-2">
          <div className="flex flex-col gap-y-2">
            <Label size="small" weight="plus">Reason (required)</Label>
            <Select value={preset} onValueChange={setPreset}>
              <Select.Trigger>
                <Select.Value placeholder="Choose a reason" />
              </Select.Trigger>
              <Select.Content>
                {REASONS.map((r) => (
                  <Select.Item key={r} value={r}>{r}</Select.Item>
                ))}
              </Select.Content>
            </Select>
            <Textarea
              placeholder="Add detail, e.g. ticket number or item (optional)"
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label size="small" weight="plus">Access level</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)}>
              <div className="flex items-start gap-x-3">
                <RadioGroup.Item value="view" id="m-view" />
                <div>
                  <Label htmlFor="m-view" weight="plus">
                    View only <Badge size="2xsmall" color="green">Recommended</Badge>
                  </Label>
                  <Text size="small" className="text-ui-fg-subtle">
                    Browse, check prices and carts. Placing orders is blocked.
                  </Text>
                </div>
              </div>
              <div className="flex items-start gap-x-3">
                <RadioGroup.Item value="order" id="m-order" />
                <div>
                  <Label htmlFor="m-order" weight="plus">Can place orders</Label>
                  <Text size="small" className="text-ui-fg-subtle">
                    Orders are placed under the buyer's account and marked
                    "placed on behalf" with your name.
                  </Text>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Alert variant="warning">
            This session is recorded on the buyer's audit trail with your name,
            the reason and the time.
          </Alert>
        </div>

        <Prompt.Footer>
          <Prompt.Cancel>Cancel</Prompt.Cancel>
          <Button onClick={start} isLoading={busy} disabled={!ready}>
            Start session
          </Button>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  );
};
