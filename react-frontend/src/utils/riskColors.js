export const RISK_COLORS = {
  High: { bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626', hex: '#DC2626' },
  'Moderate-to-High': { bg: '#FFEDD5', text: '#9A3412', dot: '#EA580C', hex: '#EA580C' },
  Moderate: { bg: '#FEF9C3', text: '#854D0E', dot: '#CA8A04', hex: '#EAB308' },
  Low: { bg: '#DCFCE7', text: '#166534', dot: '#16A34A', hex: '#22C55E' },
}

export function riskBadgeStyle(level) {
  const c = RISK_COLORS[level] || { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8', hex: '#94A3B8' }
  return { backgroundColor: c.bg, color: c.text }
}

export function riskHex(level) {
  return RISK_COLORS[level]?.hex || '#94A3B8'
}
