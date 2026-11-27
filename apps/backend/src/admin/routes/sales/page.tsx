import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ChartBar } from "@medusajs/icons";
import { Badge, Container, Heading, Text, toast, Toaster } from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { sdk } from "../../lib/client";
import { formatAmount } from "../../utils";

type Sales = {
  currency_code: string;
  me: string;
  reps: { id: string; name: string }[];
  summary: {
    today: number;
    today_orders: number;
    month_to_date: number;
    month_orders: number;
    last_month_to_date: number;
    last_month_total: number;
    last_month_orders: number;
    open_cart_value: number;
    open_cart_count: number;
    quotes_waiting: number;
    accounts: number;
  };
  daily: { date: string; total: number; orders: number }[];
  accounts: {
    id: string;
    name: string;
    rep_id: string | null;
    rep: string;
    this_month: number;
    last_month: number;
    orders: number;
    open_cart: number;
    last_order: string | null;
  }[];
  open_carts: {
    id: string;
    company_id: string;
    company: string;
    rep: string;
    items: number;
    total: number;
    updated_at: string;
  }[];
  quotes_waiting: { id: string; number: number; company: string; total: number; created_at: string }[];
  leaderboard: { rep: string; this_month: number; last_month: number; accounts: number }[];
};

const ago = (iso?: string | null) => {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? "Today" : d === 1 ? "Yesterday" : `${d} days ago`;
};

const Delta = ({ now, before }: { now: number; before: number }) => {
  if (!before) return <span className="text-ui-fg-muted text-xs">No sales last month yet</span>;
  const pct = ((now - before) / before) * 100;
  const up = pct >= 0;
  return (
    <span className={`text-xs font-medium ${up ? "text-ui-tag-green-text" : "text-ui-tag-red-text"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}% vs same days last month
    </span>
  );
};

const Kpi = ({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) => (
  <Container className="flex flex-col gap-y-1 px-5 py-4">
    <Text size="small" className="text-ui-fg-subtle">{label}</Text>
    <Heading level="h2" className="tabular-nums">{value}</Heading>
    <div className="min-h-[18px]">{sub}</div>
  </Container>
);

const BarChart = ({ data, currency }: { data: Sales["daily"]; currency: string }) => {
  const max = Math.max(1, ...data.map((d) => d.total));
  const W = 900, H = 180, pad = 4;
  const bw = (W - pad * 2) / data.length;
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={0} x2={W} y1={H - H * f} y2={H - H * f} stroke="currentColor" className="text-ui-border-base" strokeDasharray="3 4" />
        ))}
        {data.map((d, i) => {
          const h = (d.total / max) * (H - 6);
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad + i * bw} y={0} width={bw} height={H} fill="transparent" />
              <rect
                x={pad + i * bw + 2}
                y={H - h}
                width={Math.max(2, bw - 4)}
                height={Math.max(h, d.total > 0 ? 2 : 0)}
                rx={2}
                className={hover === i ? "fill-[#1e5a8e]" : "fill-[#3b82c4]"}
              />
              {i % 5 === 0 && (
                <text x={pad + i * bw + bw / 2} y={H + 16} textAnchor="middle" fontSize="11" className="fill-ui-fg-muted">
                  {new Date(d.date + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="bg-ui-bg-base shadow-elevation-card-rest absolute right-2 top-0 rounded-md border px-3 py-2 text-xs">
          <div className="font-medium">
            {new Date(data[hover].date + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}
          </div>
          <div>{formatAmount(data[hover].total, currency)} · {data[hover].orders} orders</div>
        </div>
      )}
    </div>
  );
};

const TABS = ["Accounts", "Open carts", "Quotes waiting", "Reps"] as const;

const SalesPage = () => {
  const qc = useQueryClient();
  const [rep, setRep] = useState("me");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Accounts");

  const { data, isLoading, error } = useQuery({
    queryKey: ["sales", rep],
    queryFn: () => sdk.client.fetch<Sales>(`/admin/sales?rep=${rep}`),
  });

  const assign = useMutation({
    mutationFn: (v: { company_id: string; user_id: string | null }) =>
      sdk.client.fetch("/admin/sales/assign", { method: "POST", body: v }),
    onSuccess: () => {
      toast.success("Sales rep updated");
      qc.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (error) return <Container className="p-6"><Text>Could not load sales: {(error as any).message}</Text></Container>;
  const cur = data?.currency_code ?? "usd";
  const money = (n: number) => formatAmount(n, cur);
  const s = data?.summary;

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <Heading>Sales</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {s ? `${s.accounts} accounts in view` : "Loading…"}
          </Text>
        </div>
        <label className="flex items-center gap-x-2 text-sm">
          <span className="text-ui-fg-subtle">Showing</span>
          <select
            value={rep}
            onChange={(e) => setRep(e.target.value)}
            className="bg-ui-bg-field border-ui-border-base rounded-md border px-3 py-1.5 text-sm"
          >
            <option value="me">My accounts</option>
            <option value="all">All accounts</option>
            {data?.reps.filter((r) => r.id !== data.me).map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
            <option value="none">Unassigned accounts</option>
          </select>
        </label>
      </Container>

      {isLoading || !s ? (
        <Container className="p-6"><Text>Loading…</Text></Container>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Today" value={money(s.today)} sub={<span className="text-ui-fg-muted text-xs">{s.today_orders} orders</span>} />
            <Kpi
              label="Month to date"
              value={money(s.month_to_date)}
              sub={<Delta now={s.month_to_date} before={s.last_month_to_date} />}
            />
            <Kpi
              label="Open carts"
              value={money(s.open_cart_value)}
              sub={<span className="text-ui-fg-muted text-xs">{s.open_cart_count} carts waiting to be ordered</span>}
            />
            <Kpi
              label="Quotes needing review"
              value={String(s.quotes_waiting)}
              sub={
                <Link to="/quotes" className="text-ui-fg-interactive text-xs">
                  Open quotes
                </Link>
              }
            />
          </div>

          <Container className="px-6 py-4">
            <div className="mb-2 flex items-baseline justify-between">
              <Heading level="h2">Daily sales, last 30 days</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                Last month total: {money(s.last_month_total)} · {s.last_month_orders} orders
              </Text>
            </div>
            <BarChart data={data!.daily} currency={cur} />
          </Container>

          <Container className="p-0">
            <div className="flex gap-x-1 border-b px-4 pt-3">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-t-md px-3 py-2 text-sm ${
                    tab === t ? "border-ui-fg-base border-b-2 font-medium" : "text-ui-fg-subtle"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              {tab === "Accounts" && (
                <table className="w-full text-sm">
                  <thead className="text-ui-fg-subtle text-left text-xs uppercase">
                    <tr>
                      {["Company", "Sales rep", "This month", "Last month", "Orders", "Open cart", "Last order"].map((h) => (
                        <th key={h} className="px-4 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data!.accounts.map((a) => (
                      <tr key={a.id} className="border-t">
                        <td className="px-4 py-2">
                          <Link to={`/companies/${a.id}`} className="text-ui-fg-interactive">{a.name}</Link>
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={a.rep_id ?? ""}
                            onChange={(e) => assign.mutate({ company_id: a.id, user_id: e.target.value || null })}
                            className="bg-ui-bg-field border-ui-border-base rounded-md border px-2 py-1 text-sm"
                          >
                            <option value="">Unassigned</option>
                            {data!.reps.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2 tabular-nums">{money(a.this_month)}</td>
                        <td className="px-4 py-2 tabular-nums text-ui-fg-subtle">{money(a.last_month)}</td>
                        <td className="px-4 py-2 tabular-nums">{a.orders}</td>
                        <td className="px-4 py-2 tabular-nums">{a.open_cart ? money(a.open_cart) : "—"}</td>
                        <td className="px-4 py-2 text-ui-fg-subtle">{ago(a.last_order)}</td>
                      </tr>
                    ))}
                    {!data!.accounts.length && (
                      <tr><td colSpan={7} className="text-ui-fg-subtle px-4 py-6 text-center">
                        No accounts here yet. Assign a sales rep to a company, or switch to “All accounts”.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              )}
              {tab === "Open carts" && (
                <table className="w-full text-sm">
                  <thead className="text-ui-fg-subtle text-left text-xs uppercase">
                    <tr>{["Company", "Sales rep", "Items", "Cart value", "Last activity"].map((h) => (
                      <th key={h} className="px-4 py-2 font-medium">{h}</th>))}</tr>
                  </thead>
                  <tbody>
                    {data!.open_carts.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="px-4 py-2"><Link to={`/companies/${c.company_id}`} className="text-ui-fg-interactive">{c.company}</Link></td>
                        <td className="px-4 py-2">{c.rep}</td>
                        <td className="px-4 py-2 tabular-nums">{c.items}</td>
                        <td className="px-4 py-2 tabular-nums">{money(c.total)}</td>
                        <td className="px-4 py-2 text-ui-fg-subtle">{ago(c.updated_at)}</td>
                      </tr>
                    ))}
                    {!data!.open_carts.length && (
                      <tr><td colSpan={5} className="text-ui-fg-subtle px-4 py-6 text-center">No open carts.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
              {tab === "Quotes waiting" && (
                <table className="w-full text-sm">
                  <thead className="text-ui-fg-subtle text-left text-xs uppercase">
                    <tr>{["Quote", "Company", "Requested total", "Received"].map((h) => (
                      <th key={h} className="px-4 py-2 font-medium">{h}</th>))}</tr>
                  </thead>
                  <tbody>
                    {data!.quotes_waiting.map((q) => (
                      <tr key={q.id} className="border-t">
                        <td className="px-4 py-2"><Link to={`/quotes/${q.id}`} className="text-ui-fg-interactive">Q-{String(q.number).padStart(6, "0")}</Link></td>
                        <td className="px-4 py-2">{q.company}</td>
                        <td className="px-4 py-2 tabular-nums">{money(q.total)}</td>
                        <td className="px-4 py-2 text-ui-fg-subtle">{ago(q.created_at)}</td>
                      </tr>
                    ))}
                    {!data!.quotes_waiting.length && (
                      <tr><td colSpan={4} className="text-ui-fg-subtle px-4 py-6 text-center">No quotes waiting for review.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
              {tab === "Reps" && (
                <table className="w-full text-sm">
                  <thead className="text-ui-fg-subtle text-left text-xs uppercase">
                    <tr>{["Sales rep", "Accounts", "This month", "Last month", "Change"].map((h) => (
                      <th key={h} className="px-4 py-2 font-medium">{h}</th>))}</tr>
                  </thead>
                  <tbody>
                    {data!.leaderboard.map((r) => (
                      <tr key={r.rep} className="border-t">
                        <td className="px-4 py-2">{r.rep}</td>
                        <td className="px-4 py-2 tabular-nums">{r.accounts}</td>
                        <td className="px-4 py-2 tabular-nums">{money(r.this_month)}</td>
                        <td className="px-4 py-2 tabular-nums text-ui-fg-subtle">{money(r.last_month)}</td>
                        <td className="px-4 py-2">
                          {r.last_month ? (
                            <Badge size="2xsmall" color={r.this_month >= r.last_month ? "green" : "red"}>
                              {(((r.this_month - r.last_month) / r.last_month) * 100).toFixed(0)}%
                            </Badge>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Container>
        </>
      )}
      <Toaster />
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Sales",
  icon: ChartBar,
});

export default SalesPage;
