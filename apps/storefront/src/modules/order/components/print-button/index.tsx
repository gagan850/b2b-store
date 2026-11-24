"use client"

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-canvas"
    >
      Print order
    </button>
  )
}
