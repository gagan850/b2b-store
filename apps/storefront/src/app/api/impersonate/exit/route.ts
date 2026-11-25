import { NextRequest, NextResponse } from "next/server"

/** Ends "shop as buyer": signs the buyer out and clears the banner. */
export async function GET(req: NextRequest) {
  const out = NextResponse.redirect(new URL("/", req.nextUrl.origin))
  for (const name of ["_medusa_jwt", "_medusa_cart_id", "_lk_impersonation"]) {
    out.cookies.set(name, "", { path: "/", maxAge: -1 })
  }
  out.headers.set("cache-control", "no-store")
  return out
}
