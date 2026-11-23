import { RISK_COLORS } from '../../utils/riskColors'

const LEVELS = ['High', 'Moderate-to-High', 'Moderate', 'Low']

export default function RiskLegend({ title = 'Risk Classification' }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</div>
      {LEVELS.map(level => (
        <div key={level} className="flex items-center gap-2 py-0.5">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: RISK_COLORS[level]?.hex }} />
          <span className="text-xs text-gray-700">{level}</span>
        </div>
      ))}
    </div>
  )
}
