import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page not found",
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-canvas px-4 text-center">
      <h1 className="font-condensed text-3xl font-bold text-brand-navy">
        We can&apos;t find that page
      </h1>
      <p className="mt-2 max-w-md text-sm text-neutral-600">
        The link may be old or the item may no longer be sold.
      </p>
      <a href="/" className="btn-accent mt-6 px-6 py-3">
        Go to the home page
      </a>
    </div>
  )
}
