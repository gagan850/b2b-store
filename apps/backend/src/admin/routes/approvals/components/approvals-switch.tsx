import { Badge, Switch, Text, toast } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { sdk } from "../../../lib/client";

/** Store-wide on/off for the approval workflow. Off by default. */
export const ApprovalsSwitch = () => {
  const [on, setOn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sdk.client
      .fetch<{ features: { approvals: boolean } }>("/admin/features")
      .then((r) => setOn(r.features.approvals))
      .catch(() => setOn(false));
  }, []);

  const change = async (v: boolean) => {
    setBusy(true);
    try {
      const r = await sdk.client.fetch<{ features: { approvals: boolean } }>(
        "/admin/features",
        { method: "POST", body: { approvals: v } }
      );
      setOn(r.features.approvals);
      toast.success(v ? "Approvals turned on" : "Approvals turned off");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not change the setting");
    } finally {
      setBusy(false);
    }
  };

  if (on === null) return null;
  return (
    <div className="flex items-center justify-between gap-6 border-b px-6 py-4">
      <div className="flex flex-col gap-y-1">
        <div className="flex items-center gap-x-2">
          <Text weight="plus">Order approvals</Text>
          <Badge size="2xsmall" color={on ? "green" : "grey"}>
            {on ? "On" : "Off"}
          </Badge>
        </div>
        <Text size="small" className="text-ui-fg-subtle">
          {on
            ? "Companies set to require approval hold orders until an admin approves them."
            : "Off: every order goes straight through. Approval pages are hidden in the store. Company settings are kept."}
        </Text>
      </div>
      <Switch checked={on} disabled={busy} onCheckedChange={change} />
    </div>
  );
};
