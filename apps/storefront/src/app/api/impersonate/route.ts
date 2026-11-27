import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

/**
 * Staff land here from admin ("Shop as this buyer") with a one-time code.
 * The code is swapped for a 30 minute buyer session, then the staff member is
 * sent to the store home page signed in as that buyer.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") ?? ""
  const res = await fetch(`${BACKEND_URL}/store/impersonation/exchange`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-publishable-api-key": PUBLISHABLE_API_KEY!,
    },
    body: JSON.stringify({ code }),
    cache: "no-store",
  }).catch(() => null)

  if (!res || !res.ok) {
    return new NextResponse(
      "This link has expired or was already used. Go back to admin and choose \"Shop as this buyer\" again.",
      { status: 400 }
    )
  }

  const s = await res.json()
  const maxAge = Number(s.minutes ?? 30) * 60
  const out = NextResponse.redirect(new URL("/", req.nextUrl.origin))
  const base = {
    maxAge,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  }
  out.cookies.set("_medusa_jwt", s.token, base)
  // Fresh cart for the buyer's session
  out.cookies.set("_medusa_cart_id", "", { path: "/", maxAge: -1 })
  out.cookies.set(
    "_lk_impersonation",
    JSON.stringify({
      staff: s.staff_name,
      staff_id: s.staff_id,
      customer: s.customer_name,
      company: s.company_name,
      reason: s.reason,
      mode: s.mode,
      expires_at: s.expires_at,
    }),
    base
  )
  out.headers.set("cache-control", "no-store")
  return out
}
