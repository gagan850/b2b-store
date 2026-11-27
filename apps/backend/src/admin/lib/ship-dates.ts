// Copy of apps/storefront/src/lib/util/ship-dates.ts, so admin shows the same ETA the buyer saw. Keep the two in sync.
// Estimated ship, pickup and delivery dates.
// Orders placed before the daily cutoff (Central time) on a business day ship
// the same day; otherwise the next business day. Transit is in business days.
// Demo rules: replace with warehouse calendars / carrier APIs later.

export const CUTOFF_HOUR_CT = 14 // 2:00 PM Central
const TZ = "America/Chicago"

// US carrier holidays (no pickups or deliveries)
const HOLIDAYS = new Set([
  "2026-01-01", "2026-05-25", "2026-07-03", "2026-09-07", "2026-11-26", "2026-12-25",
  "2027-01-01", "2027-05-31", "2027-07-05", "2027-09-06", "2027-11-25", "2027-12-24",
])

type Day = { y: number; m: number; d: number } // calendar date in Central time

const partsInTz = (date: Date) => {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date)
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value)
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour") % 24 }
}

const toUtc = (x: Day) => new Date(Date.UTC(x.y, x.m - 1, x.d, 12))
const fromUtc = (dt: Date): Day => ({
  y: dt.getUTCFullYear(),
  m: dt.getUTCMonth() + 1,
  d: dt.getUTCDate(),
})
const key = (x: Day) =>
  `${x.y}-${String(x.m).padStart(2, "0")}-${String(x.d).padStart(2, "0")}`

const isBusinessDay = (x: Day) => {
  const wd = toUtc(x).getUTCDay()
  return wd !== 0 && wd !== 6 && !HOLIDAYS.has(key(x))
}

const nextDay = (x: Day): Day => {
  const dt = toUtc(x)
  dt.setUTCDate(dt.getUTCDate() + 1)
  return fromUtc(dt)
}

const addBusinessDays = (x: Day, n: number): Day => {
  let cur = x
  let left = n
  while (left > 0) {
    cur = nextDay(cur)
    if (isBusinessDay(cur)) left--
  }
  return cur
}

export const formatDay = (x: Day) =>
  toUtc(x).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })

/** The day an order placed at `placedAt` leaves (or is ready at) the warehouse. */
export const shipDay = (placedAt: Date = new Date()): Day => {
  const { y, m, d, h } = partsInTz(placedAt)
  let day: Day = { y, m, d }
  if (isBusinessDay(day) && h < CUTOFF_HOUR_CT) return day
  day = nextDay(day)
  while (!isBusinessDay(day)) day = nextDay(day)
  return day
}

export const isToday = (x: Day, now: Date = new Date()) => {
  const t = partsInTz(now)
  return x.y === t.y && x.m === t.m && x.d === t.d
}

/** Transit range in business days from option data or its description. */
export const transitDays = (data?: Record<string, any> | null): [number, number] | null => {
  if (Array.isArray(data?.transit_days)) {
    const [a, b] = data!.transit_days
    return [Number(a), Number(b ?? a)]
  }
  const m = /(\d+)\s*[–-]\s*(\d+)|(\d+)/.exec(String(data?.transit ?? ""))
  if (!m) return null
  return m[3] ? [Number(m[3]), Number(m[3])] : [Number(m[1]), Number(m[2])]
}

export type DeliveryEstimate = {
  ship: string // "Today" or "Wed, Nov 25"
  shipDate: string // always a date
  arrive?: string // "Wed, Nov 25" or "Wed, Nov 25 – Tue, Dec 1"
}

export const estimate = (
  data?: Record<string, any> | null,
  placedAt: Date = new Date(),
  now: Date = new Date()
): DeliveryEstimate => {
  const s = shipDay(placedAt)
  const shipDate = formatDay(s)
  const ship = isToday(s, now) ? "Today" : shipDate
  const t = transitDays(data)
  if (!t || data?.kind === "pickup" || data?.kind === "collect") {
    return { ship, shipDate }
  }
  const a = formatDay(addBusinessDays(s, t[0]))
  const b = formatDay(addBusinessDays(s, t[1]))
  return { ship, shipDate, arrive: a === b ? a : `${a} – ${b}` }
}
