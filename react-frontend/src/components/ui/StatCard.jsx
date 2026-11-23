import { StatCardSkeleton } from './Skeleton'

export default function StatCard({ title, value, subtitle, icon: Icon, iconBg = 'bg-blue-100', iconColor = 'text-blue-600', loading = false }) {
  if (loading) return <StatCardSkeleton />
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-[#0F1E3D]">{value}</div>
        <div className="text-sm font-medium text-gray-700 mt-0.5">{title}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
      </div>
    </div>
  )
}
