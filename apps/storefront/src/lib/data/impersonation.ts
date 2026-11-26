"use server"

import "server-only"

import { cookies as nextCookies } from "next/headers"

export type Impersonation = {
  staff: string
  staff_id: string
  customer: string
  company: string
  reason?: string
  mode?: "view" | "order"
  expires_at?: string
}

/**
 * Set while a staff member is shopping as a buyer (30 minute session). Pages
 * are statically rendered, so the banner asks for this from the browser.
 */
export const getImpersonation = async (): Promise<Impersonation | null> => {
  try {
    const raw = (await nextCookies()).get("_lk_impersonation")?.value
    return raw ? (JSON.parse(raw) as Impersonation) : null
  } catch {
    return null
  }
}
