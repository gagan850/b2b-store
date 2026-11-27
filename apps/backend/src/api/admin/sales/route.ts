import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { getRepMap } from "../../../lib/sales-reps";

const r2 = (n: number) => Math.round(n * 100) / 100;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Sales overview for the admin Sales page.
 * ?rep=all (default) | me | <admin user id> | none (companies with no rep)
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const users = req.scope.resolve(Modules.USER);
  const me = req.auth_context.actor_id;
  const repParam = String((req.query as any).rep ?? "all");
  const repFilter = repParam === "me" ? me : repParam;

  const repMap = await getRepMap(req.scope);
  const userList = await users.listUsers({}, { take: 200 });
  const nameOf = (id?: string | null) => {
    if (!id) return "Unassigned";
    const u = userList.find((x) => x.id === id);
    return u ? [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email : "Unknown";
  };

  const { data: companies } = await query.graph({
    entity: "company",
    fields: ["id", "name", "currency_code", "carts.id", "carts.total", "carts.completed_at", "carts.updated_at", "carts.currency_code", "carts.items.id"],
    pagination: { take: 2000 },
  });

  const inScope = (companyId?: string | null) => {
    if (!companyId) return repFilter === "all";
    const rep = repMap[companyId];
    if (repFilter === "all") return true;
    if (repFilter === "none") return !rep;
    return rep === repFilter;
  };
  const scoped = companies.filter((c: any) => inScope(c.id));
  const scopedIds = new Set(scoped.map((c: any) => c.id));

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const lastMonthSameDay = new Date(
    Math.min(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, now.getUTCDate(), 23, 59, 59),
      monthStart.getTime() - 1
    )
  );
  const since30 = new Date(now.getTime() - 29 * 86400000);
  since30.setUTCHours(0, 0, 0, 0);
  const since = lastMonthStart < since30 ? lastMonthStart : since30;

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "total", "currency_code", "status", "created_at", "is_draft_order", "metadata", "customer.employee.company_id"],
    filters: { created_at: { $gte: since.toISOString() } } as any,
    pagination: { take: 10000, order: { created_at: "DESC" } },
  });

  // The order-to-company link isn't written for orders placed from a cart, so the
  // company comes from the buyer's employee record, falling back to cart metadata.
  for (const o of orders as any[]) {
    o.company = { id: o.customer?.employee?.company_id ?? o.metadata?.company_id ?? null };
  }

  const valid = orders.filter(
    (o: any) =>
      !o.is_draft_order &&
      o.status !== "canceled" &&
      o.status !== "draft" &&
      scopedIds.has(o.company?.id)
  );

  const currency =
    (valid[0] as any)?.currency_code ?? (companies[0] as any)?.currency_code ?? "usd";

  let today = 0, todayCount = 0, mtd = 0, mtdCount = 0, lastFull = 0, lastToDate = 0, lastCount = 0;
  const daily: Record<string, { total: number; count: number }> = {};
  for (let i = 0; i < 30; i++) {
    daily[dayKey(new Date(since30.getTime() + i * 86400000))] = { total: 0, count: 0 };
  }
  const perCompany: Record<string, { mtd: number; last: number; orders: number; lastOrder: string | null }> = {};
  const bump = (id: string) =>
    (perCompany[id] ??= { mtd: 0, last: 0, orders: 0, lastOrder: null });

  for (const o of valid as any[]) {
    const t = Number(o.total) || 0;
    const created = new Date(o.created_at);
    const k = dayKey(created);
    const pc = bump(o.company.id);
    if (!pc.lastOrder || o.created_at > pc.lastOrder) pc.lastOrder = o.created_at;
    if (daily[k]) {
      daily[k].total += t;
      daily[k].count += 1;
    }
    if (k === dayKey(now)) {
      today += t;
      todayCount += 1;
    }
    if (created >= monthStart) {
      mtd += t;
      mtdCount += 1;
      pc.mtd += t;
      pc.orders += 1;
    } else if (created >= lastMonthStart) {
      lastFull += t;
      lastCount += 1;
      pc.last += t;
      if (created <= lastMonthSameDay) lastToDate += t;
    }
  }

  const openCarts = scoped
    .flatMap((c: any) =>
      (c.carts ?? [])
        .filter((cart: any) => cart && !cart.completed_at && (cart.items?.length ?? 0) > 0)
        .map((cart: any) => ({
          id: cart.id,
          company_id: c.id,
          company: c.name,
          rep: nameOf(repMap[c.id]),
          items: cart.items.length,
          total: r2(Number(cart.total) || 0),
          updated_at: cart.updated_at,
        }))
    )
    .sort((a: any, b: any) => String(b.updated_at).localeCompare(String(a.updated_at)));

  const cartByCompany: Record<string, number> = {};
  openCarts.forEach((c: any) => (cartByCompany[c.company_id] = (cartByCompany[c.company_id] ?? 0) + c.total));

  const { data: quotes } = await query.graph({
    entity: "quote",
    fields: ["id", "status", "created_at", "customer.email", "customer.employee.company_id", "draft_order.display_id", "draft_order.total"],
    filters: { status: "pending_merchant" } as any,
    pagination: { take: 500 },
  });
  const quotesWaiting = quotes
    .filter((q: any) => scopedIds.has(q.customer?.employee?.company_id))
    .map((q: any) => ({
      id: q.id,
      number: q.draft_order?.display_id,
      company: scoped.find((c: any) => c.id === q.customer?.employee?.company_id)?.name,
      total: r2(Number(q.draft_order?.total) || 0),
      created_at: q.created_at,
    }));

  const accounts = scoped
    .map((c: any) => {
      const p = perCompany[c.id];
      return {
        id: c.id,
        name: c.name,
        rep_id: repMap[c.id] ?? null,
        rep: nameOf(repMap[c.id]),
        this_month: r2(p?.mtd ?? 0),
        last_month: r2(p?.last ?? 0),
        orders: p?.orders ?? 0,
        open_cart: r2(cartByCompany[c.id] ?? 0),
        last_order: p?.lastOrder ?? null,
      };
    })
    .sort((a: any, b: any) => b.this_month - a.this_month || a.name.localeCompare(b.name));

  // Leaderboard across all reps (always unfiltered by rep so managers can compare)
  const byRep: Record<string, { rep: string; this_month: number; last_month: number; accounts: number }> = {};
  for (const c of companies as any[]) {
    const key = repMap[c.id] ?? "none";
    byRep[key] ??= { rep: nameOf(repMap[c.id]), this_month: 0, last_month: 0, accounts: 0 };
    byRep[key].accounts += 1;
  }
  for (const o of orders as any[]) {
    if (o.is_draft_order || o.status === "canceled" || o.status === "draft" || !o.company?.id) continue;
    const key = repMap[o.company.id] ?? "none";
    byRep[key] ??= { rep: nameOf(repMap[o.company.id]), this_month: 0, last_month: 0, accounts: 0 };
    const created = new Date(o.created_at);
    if (created >= monthStart) byRep[key].this_month += Number(o.total) || 0;
    else if (created >= lastMonthStart) byRep[key].last_month += Number(o.total) || 0;
  }

  res.json({
    currency_code: currency,
    me,
    rep: repParam,
    reps: userList.map((u) => ({ id: u.id, name: nameOf(u.id) })),
    summary: {
      today: r2(today),
      today_orders: todayCount,
      month_to_date: r2(mtd),
      month_orders: mtdCount,
      last_month_to_date: r2(lastToDate),
      last_month_total: r2(lastFull),
      last_month_orders: lastCount,
      open_cart_value: r2(openCarts.reduce((s: number, c: any) => s + c.total, 0)),
      open_cart_count: openCarts.length,
      quotes_waiting: quotesWaiting.length,
      accounts: scoped.length,
    },
    daily: Object.entries(daily).map(([date, v]) => ({ date, total: r2(v.total), orders: v.count })),
    accounts,
    open_carts: openCarts.slice(0, 50),
    quotes_waiting: quotesWaiting,
    leaderboard: Object.values(byRep)
      .map((r) => ({ ...r, this_month: r2(r.this_month), last_month: r2(r.last_month) }))
      .sort((a, b) => b.this_month - a.this_month),
  });
};
