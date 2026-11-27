import { Tone, toneClass } from "@/lib/util/status-labels"

export default function StatusChip({ label, tone }: { label: string; tone: Tone }) {
  return <span className={`chip ${toneClass[tone]}`}>{label}</span>
}
