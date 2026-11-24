import { BRAND } from "@/lib/brand"
import { clx } from "@medusajs/ui"

export default function BrandLogo({
  className,
  inverted = false,
}: {
  className?: string
  inverted?: boolean
}) {
  return (
    <span className={clx("flex items-center gap-2", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-accent text-lg font-black text-white">
        {BRAND.shortName.charAt(0)}
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={clx(
            "text-xl font-black tracking-tight",
            inverted ? "text-white" : "text-brand-navy"
          )}
        >
          {BRAND.shortName}
        </span>
        <span
          className={clx(
            "text-[10px] font-semibold uppercase tracking-[0.18em]",
            inverted ? "text-white/70" : "text-brand-blue"
          )}
        >
          Industrial Supply
        </span>
      </span>
    </span>
  )
}
