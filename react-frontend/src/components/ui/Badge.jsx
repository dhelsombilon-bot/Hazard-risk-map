import { statusStyle } from '../../utils/statusColors'
import { riskBadgeStyle } from '../../utils/riskColors'

export function StatusBadge({ status }) {
  const style = statusStyle(status)
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: style.bg, color: style.text }}>
      {status || '—'}
    </span>
  )
}

export function RiskBadge({ level }) {
  const style = riskBadgeStyle(level)
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: style.bg, color: style.text }}>
      {level || '—'}
    </span>
  )
}
