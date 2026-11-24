// Card helpers for the checkout card form. These run in the browser only:
// the full card number never leaves this page. Only the brand, last 4 digits
// and expiry are saved, which is what a processor shows for a stored card.

export type SavedCard = {
  id: string
  brand: string
  last4: string
  exp: string // MM/YY
  name?: string
}

export const cardBrand = (digits: string): string => {
  if (/^4/.test(digits)) return "Visa"
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard"
  if (/^3[47]/.test(digits)) return "Amex"
  if (/^(6011|65|64[4-9])/.test(digits)) return "Discover"
  return "Card"
}

export const luhnValid = (digits: string) => {
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i])
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return sum % 10 === 0
}

export const formatCardNumber = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 19)
  if (/^3[47]/.test(digits)) {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)]
      .filter(Boolean)
      .join(" ")
  }
  return digits.replace(/(.{4})/g, "$1 ").trim()
}

export const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

export const expiryValid = (exp: string, now = new Date()) => {
  const m = /^(\d{2})\/(\d{2})$/.exec(exp)
  if (!m) return false
  const month = Number(m[1])
  const year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return false
  // Valid through the last day of the expiry month
  return new Date(year, month, 1) > now
}

export const parseSavedCards = (metadata?: Record<string, unknown> | null): SavedCard[] => {
  const raw = metadata?.saved_cards
  if (!Array.isArray(raw)) return []
  return raw
    .filter((c: any) => c && typeof c.last4 === "string" && typeof c.id === "string")
    .map((c: any) => ({
      id: c.id,
      brand: String(c.brand ?? "Card"),
      last4: c.last4,
      exp: String(c.exp ?? ""),
      name: c.name ? String(c.name) : undefined,
    }))
}

export const cardLabel = (c: { brand: string; last4: string }) =>
  `${c.brand} ending in ${c.last4}`
