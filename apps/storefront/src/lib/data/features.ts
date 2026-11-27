import "server-only"

/** Store-wide feature switches set in admin (Approvals page). Fails closed. */
export type Features = { approvals: boolean }

export async function getFeatures(): Promise<Features> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/features`,
      {
        headers: {
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
        },
        next: { revalidate: 15 },
      }
    )
    if (!res.ok) return { approvals: false }
    const { features } = await res.json()
    return { approvals: Boolean(features?.approvals) }
  } catch {
    return { approvals: false }
  }
}
