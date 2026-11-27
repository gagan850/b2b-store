import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

/**
 * Ends "shop as buyer": records the end on the audit trail, signs the buyer
 * out and clears the banner. Sends staff back to admin when it is known.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get("_medusa_jwt")?.value
  let staffId: string | undefined
  try {
    staffId = JSON.parse(req.cookies.get("_lk_impersonation")?.value ?? "{}").staff_id
  } catch {}
  if (token && staffId) {
    await fetch(`${BACKEND_URL}/store/impersonation/end`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      body: JSON.stringify({ staff_id: staffId }),
      cache: "no-store",
    }).catch(() => null)
  }

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL
  const out = NextResponse.redirect(
    adminUrl ? new URL(adminUrl) : new URL("/", req.nextUrl.origin)
  )
  for (const name of ["_medusa_jwt", "_medusa_cart_id", "_lk_impersonation"]) {
    out.cookies.set(name, "", { path: "/", maxAge: -1 })
  }
  out.headers.set("cache-control", "no-store")
  return out
}
