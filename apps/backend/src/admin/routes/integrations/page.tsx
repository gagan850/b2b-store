import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ArrowPath } from "@medusajs/icons";
import { Badge, Button, Container, Heading, Text, toast, Toaster } from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { sdk } from "../../lib/client";

type Ev = {
  id: string;
  integration: string;
  action: string;
  direction: string;
  status: "success" | "failed";
  reference_type: string | null;
  reference_id: string | null;
  error: string | null;
  duration_ms: number;
  attempt: number;
  retry_of: string | null;
  created_at: string;
  request?: unknown;
  response?: unknown;
};
type Summary = {
  integration: string;
  d1: { ok: number; failed: number };
  d7: { ok: number; failed: number };
  d30: { ok: number; failed: number };
  last_error: { action: string; error: string; at: string } | null;
};
type Resp = { events: Ev[]; count: number; limit: number; offset: number; summary: Summary[] };

const LABEL: Record<string, string> = {
  erp: "ERP",
  payment: "Payments",
  tax: "Tax",
  shipping: "Shipping",
  email: "Email",
  test: "Sample",
};
const label = (k: string) => LABEL[k] ?? k;

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const rate = (s: { ok: number; failed: number }) => {
  const t = s.ok + s.failed;
  return t ? Math.round((s.ok / t) * 1000) / 10 : null;
};

const Health = ({ s }: { s: Summary }) => {
  const r = rate(s.d1);
  if (r === null) return <Badge size="2xsmall" color="grey">No activity today</Badge>;
  if (s.d1.failed === 0) return <Badge size="2xsmall" color="green">Healthy</Badge>;
  return <Badge size="2xsmall" color={r >= 90 ? "orange" : "red"}>{s.d1.failed} failed today</Badge>;
};

const Json = ({ title, value }: { title: string; value: unknown }) => (
  <div>
    <Text size="small" weight="plus" className="mb-1">{title}</Text>
    <pre className="bg-ui-bg-subtle max-h-72 overflow-auto rounded-md p-3 text-xs">
      {value == null ? "—" : JSON.stringify(value, null, 2)}
    </pre>
  </div>
);

const Detail = ({ id, onRetry, retrying }: { id: string; onRetry: () => void; retrying: boolean }) => {
  const { data } = useQuery({
    queryKey: ["integration-event", id],
    queryFn: () => sdk.client.fetch<{ event: Ev }>(`/admin/integrations/${id}`),
  });
  const e = data?.event;
  if (!e) return <div className="px-6 py-4 text-sm">Loading…</div>;
  return (
    <div className="bg-ui-bg-subtle flex flex-col gap-y-3 px-6 py-4">
      {e.error && (
        <div className="border-ui-tag-red-border bg-ui-tag-red-bg rounded-md border px-3 py-2 text-sm">
          {e.error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Json title="What we sent" value={e.request} />
        <Json title="What came back" value={e.response} />
      </div>
      <div className="flex items-center justify-between">
        <Text size="xsmall" className="text-ui-fg-subtle">
          Event {e.id} · attempt {e.attempt}
          {e.retry_of ? ` · retry of ${e.retry_of}` : ""} · {e.duration_ms} ms
        </Text>
        {e.status === "failed" && (
          <Button size="small" variant="secondary" onClick={onRetry} isLoading={retrying}>
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};

const PAGE = 25;

const IntegrationsPage = () => {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [integration, setIntegration] = useState("");
  const [days, setDays] = useState("7");
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState<string | null>(null);

  const qs = new URLSearchParams({ limit: String(PAGE), offset: String(offset), days });
  if (status) qs.set("status", status);
  if (integration) qs.set("integration", integration);

  const { data, isLoading, error } = useQuery({
    queryKey: ["integrations", status, integration, days, offset],
    queryFn: () => sdk.client.fetch<Resp>(`/admin/integrations?${qs}`),
    refetchInterval: 30000,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["integrations"] });

  const retry = useMutation({
    mutationFn: (id: string) => sdk.client.fetch<{ ok: boolean; error?: string }>(`/admin/integrations/${id}/retry`, { method: "POST" }),
    onSuccess: (r) => {
      r.ok ? toast.success("Retry succeeded") : toast.error(`Retry failed: ${r.error ?? "unknown error"}`);
      refresh();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sample = useMutation({
    mutationFn: () => sdk.client.fetch("/admin/integrations/test", { method: "POST" }),
    onSuccess: () => {
      toast.success("Sample events added");
      refresh();
    },
  });

  if (error) return <Container className="p-6"><Text>Could not load integrations: {(error as any).message}</Text></Container>;

  const summary = data?.summary ?? [];
  const names = Array.from(new Set(["erp", "payment", "tax", "shipping", "email", ...summary.map((s) => s.integration)]));
  const total = data?.count ?? 0;

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <Heading>Integrations</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Every call to outside systems, with what was sent and what came back. Kept for 90 days.
          </Text>
        </div>
        <div className="flex gap-x-2">
          <Button size="small" variant="secondary" onClick={() => sample.mutate()} isLoading={sample.isPending}>
            Add sample events
          </Button>
          <Button size="small" variant="secondary" onClick={refresh}>
            <ArrowPath /> Refresh
          </Button>
        </div>
      </Container>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {summary.length === 0 && !isLoading && (
          <Container className="px-6 py-5 md:col-span-2 xl:col-span-3">
            <Text size="small" className="text-ui-fg-subtle">
              Nothing has been recorded yet. Events appear here as soon as an integration (ERP, payments, tax…) makes a
              call. Use “Add sample events” to see how this page looks.
            </Text>
          </Container>
        )}
        {summary.map((s) => (
          <Container key={s.integration} className="flex flex-col gap-y-3 px-5 py-4">
            <div className="flex items-center justify-between">
              <Heading level="h2">{label(s.integration)}</Heading>
              <Health s={s} />
            </div>
            <div className="grid grid-cols-3 gap-x-2 text-center">
              {([["24 hours", s.d1], ["7 days", s.d7], ["30 days", s.d30]] as const).map(([name, v]) => (
                <button
                  key={name}
                  className="hover:bg-ui-bg-subtle rounded-md py-1"
                  onClick={() => {
                    setIntegration(s.integration);
                    setStatus(v.failed ? "failed" : "");
                    setDays(name === "24 hours" ? "1" : name === "7 days" ? "7" : "30");
                    setOffset(0);
                  }}
                >
                  <div className="text-ui-fg-subtle text-xs">{name}</div>
                  <div className="text-lg font-medium tabular-nums">{v.ok + v.failed}</div>
                  <div className={`text-xs ${v.failed ? "text-ui-tag-red-text" : "text-ui-fg-muted"}`}>
                    {v.failed} failed
                  </div>
                </button>
              ))}
            </div>
            {s.last_error && (
              <Text size="xsmall" className="text-ui-fg-subtle line-clamp-2">
                Last error ({when(s.last_error.at)}): {s.last_error.error}
              </Text>
            )}
          </Container>
        ))}
      </div>

      <Container className="p-0">
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          {[
            [status, setStatus, [["", "All results"], ["failed", "Failed only"], ["success", "Succeeded only"]]],
            [integration, setIntegration, [["", "All integrations"], ...names.map((n) => [n, label(n)])]],
            [days, setDays, [["1", "Last 24 hours"], ["7", "Last 7 days"], ["30", "Last 30 days"], ["90", "Last 90 days"]]],
          ].map(([val, set, opts]: any, i) => (
            <select
              key={i}
              value={val}
              onChange={(e) => {
                set(e.target.value);
                setOffset(0);
              }}
              className="bg-ui-bg-field border-ui-border-base rounded-md border px-3 py-1.5 text-sm"
            >
              {opts.map(([v, l]: string[]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          ))}
          <Text size="small" className="text-ui-fg-subtle ml-auto">{total} events</Text>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-ui-fg-subtle text-left text-xs uppercase">
              <tr>
                {["Time", "Integration", "Event", "Reference", "Result", "Duration"].map((h) => (
                  <th key={h} className="px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.events ?? []).map((e) => (
                <>
                  <tr
                    key={e.id}
                    className="hover:bg-ui-bg-subtle cursor-pointer border-t"
                    onClick={() => setOpen(open === e.id ? null : e.id)}
                  >
                    <td className="whitespace-nowrap px-4 py-2">{when(e.created_at)}</td>
                    <td className="px-4 py-2">{label(e.integration)}</td>
                    <td className="px-4 py-2">
                      {e.action}
                      {e.attempt > 1 && <span className="text-ui-fg-muted"> · attempt {e.attempt}</span>}
                    </td>
                    <td className="text-ui-fg-subtle px-4 py-2">{e.reference_id ?? "—"}</td>
                    <td className="px-4 py-2">
                      <Badge size="2xsmall" color={e.status === "success" ? "green" : "red"}>
                        {e.status === "success" ? "Succeeded" : "Failed"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 tabular-nums">{e.duration_ms} ms</td>
                  </tr>
                  {open === e.id && (
                    <tr key={e.id + "d"}>
                      <td colSpan={6} className="p-0">
                        <Detail id={e.id} onRetry={() => retry.mutate(e.id)} retrying={retry.isPending} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {!isLoading && !(data?.events ?? []).length && (
                <tr>
                  <td colSpan={6} className="text-ui-fg-subtle px-4 py-8 text-center">
                    No events match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {total > PAGE && (
          <div className="flex items-center justify-between border-t px-4 py-2">
            <Text size="small" className="text-ui-fg-subtle">
              {offset + 1}–{Math.min(offset + PAGE, total)} of {total}
            </Text>
            <div className="flex gap-x-2">
              <Button size="small" variant="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
                Previous
              </Button>
              <Button size="small" variant="secondary" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Container>
      <Toaster />
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Integrations",
  icon: ArrowPath,
});

export default IntegrationsPage;
