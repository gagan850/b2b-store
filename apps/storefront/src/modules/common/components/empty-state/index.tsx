import LocalizedClientLink from "@/modules/common/components/localized-client-link"

type Action = { label: string; href: string }

const icons = {
  cart: (
    <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L20 8H6.2M10 20.2a.8.8 0 1 0 0 .01M17 20.2a.8.8 0 1 0 0 .01" />
  ),
  box: (
    <path d="M21 8 12 3 3 8m18 0-9 5m9-5v8l-9 5m0-8L3 8m9 5v8M3 8v8l9 5" />
  ),
  doc: (
    <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" />
  ),
  search: <path d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />,
}

/**
 * One calm "nothing here" block used across the store: an icon, a short
 * headline, one helpful sentence and up to two next steps.
 */
export default function EmptyState({
  icon = "box",
  title,
  text,
  primary,
  secondary,
  compact = false,
  testId,
}: {
  icon?: keyof typeof icons
  title: string
  text: string
  primary?: Action
  secondary?: Action
  compact?: boolean
  testId?: string
}) {
  return (
    <div
      className={`content-container flex flex-col items-center text-center ${
        compact ? "py-10" : "py-20 small:py-28"
      }`}
      data-testid={testId}
    >
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-brand-line bg-white text-brand-blue">
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {icons[icon]}
        </svg>
      </span>
      <h1 className="font-condensed text-2xl font-bold text-brand-navy small:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-md text-sm text-neutral-600">{text}</p>
      {(primary || secondary) && (
        <div className="mt-6 flex flex-col gap-3 xsmall:flex-row">
          {primary && (
            <LocalizedClientLink href={primary.href} className="btn-accent px-6 py-3 text-center">
              {primary.label}
            </LocalizedClientLink>
          )}
          {secondary && (
            <LocalizedClientLink
              href={secondary.href}
              className="inline-flex items-center justify-center rounded-md border border-brand-line px-6 py-3 text-sm font-semibold text-brand-navy hover:bg-brand-canvas"
            >
              {secondary.label}
            </LocalizedClientLink>
          )}
        </div>
      )}
    </div>
  )
}
