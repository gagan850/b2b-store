import { BRAND } from "@/lib/brand"
import { clx } from "@medusajs/ui"

export default function BrandLogo({
  className,
  inverted = false,
  compact = false,
}: {
  className?: string
  inverted?: boolean
  compact?: boolean
}) {
  return (
    <span className={clx("flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND.logo}
        alt={`${BRAND.name} logo`}
        className={clx(
          "h-10 w-auto",
          inverted && "rounded bg-white p-0.5"
        )}
      />
      {!compact && (
        <span
          className={clx(
            "font-condensed text-xl font-bold uppercase leading-none tracking-wide",
            inverted ? "text-white" : "text-brand-navy-2"
          )}
        >
          Packaging
        </span>
      )}
    </span>
  )
}
