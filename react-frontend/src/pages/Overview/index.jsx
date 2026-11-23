import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Building2, FileText, AlertCircle, TriangleAlert } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Card from '../../components/ui/Card'
import { Table, Skeleton as TableSkeleton } from '../../components/ui/Table'
import { Skeleton, SkeletonGroup, BarsSkeleton } from '../../components/ui/Skeleton'
import { StatusBadge } from '../../components/ui/Badge'
import { formatDate } from '../../utils/formatters'
import { buildingService } from '../../services/buildings'
import { permitService } from '../../services/permits'
import BaseMap from '../../components/map/BaseMap'
import BuildingMarker from '../../components/map/BuildingMarker'

function ComplianceBar({ label, count, total, color }) {
  const pct = total ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs text-gray-600 flex-shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="text-xs text-gray-500 w-8 text-right">{count}</div>
    </div>
  )
}

export default function OverviewPage() {
  const { data: buildings, isLoading: buildingsLoading } = useQuery({
    queryKey: ['buildings', { page: 1 }],
    queryFn: () => buildingService.list({ page: 1 }),
  })

  const { data: permits, isLoading: permitsLoading } = useQuery({
    queryKey: ['permits', { page: 1 }],
    queryFn: () => permitService.list({ page: 1 }),
  })

  const { data: geojson, isLoading: geojsonLoading } = useQuery({
    queryKey: ['buildings-geojson'],
    queryFn: () => buildingService.geojson(),
  })

  const totalBuildings = buildings?.meta?.total || 0
  const totalPermits = permits?.meta?.total || 0
  const allPermits = permits?.data || []

  const compliant = allPermits.filter(p => p.permit_status === 'Compliant').length
  const forReview = allPermits.filter(p => p.permit_status === 'For review').length
  const incomplete = allPermits.filter(p => p.permit_status === 'Incomplete').length
  const noRecord = allPermits.filter(p => p.permit_status === 'No permit record').length
  const highHazard = (buildings?.data || []).filter(b => b.risk_level === 'High').length

  const recentBuildings = (buildings?.data || []).slice(0, 5)

  const tableColumns = [
    { key: 'building_name', label: 'Building', render: r => <Link to={`/buildings/${r.building_id}`} className="text-blue-600 hover:underline font-medium">{r.building_name}</Link> },
    { key: 'barangay_name', label: 'Barangay' },
    { key: 'building_status', label: 'Status', render: r => <StatusBadge status={r.building_status} /> },
    { key: 'updated_at', label: 'Last Updated', render: r => formatDate(r.updated_at) },
  ]

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard loading={buildingsLoading} title="Public Buildings" value={totalBuildings} subtitle="Across recorded barangays" icon={Building2} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <StatCard loading={permitsLoading} title="Permit Records" value={totalPermits} subtitle="Existing records on file" icon={FileText} iconBg="bg-green-100" iconColor="text-green-600" />
        <StatCard loading={permitsLoading} title="For Compliance Review" value={forReview} subtitle="Needs staff attention" icon={AlertCircle} iconBg="bg-amber-100" iconColor="text-amber-600" />
        <StatCard loading={buildingsLoading} title="High Hazard Exposure" value={highHazard} subtitle="Based on available data" icon={TriangleAlert} iconBg="bg-red-100" iconColor="text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map preview */}
        <Card title="Public Building Locations" className="lg:col-span-2" actions={<Link to="/map" className="text-xs text-blue-600 hover:underline">View full map →</Link>}>
          <div style={{ height: 260, borderRadius: 8, overflow: 'hidden' }}>
            {geojsonLoading ? (
              <SkeletonGroup label="Loading map…" className="h-full"><Skeleton className="h-full w-full rounded-lg" /></SkeletonGroup>
            ) : (
              <BaseMap zoom={11}>
                {geojson?.features?.map((f, i) => (
                  <BuildingMarker key={i} building={f} />
                ))}
              </BaseMap>
            )}
          </div>
        </Card>

        {/* Compliance summary */}
        <Card title="Permit Compliance">
          {permitsLoading ? <BarsSkeleton rows={4} /> : (
            <div className="space-y-3">
              <ComplianceBar label="Compliant" count={compliant} total={totalPermits} color="#16A34A" />
              <ComplianceBar label="For review" count={forReview} total={totalPermits} color="#CA8A04" />
              <ComplianceBar label="Incomplete" count={incomplete} total={totalPermits} color="#DC2626" />
              <ComplianceBar label="No permit record" count={noRecord} total={totalPermits} color="#94A3B8" />
            </div>
          )}
        </Card>
      </div>

      {/* Recently updated */}
      <Card title="Recently Updated Buildings">
        {buildingsLoading ? <TableSkeleton rows={5} cols={4} /> : (
          <Table columns={tableColumns} data={recentBuildings} emptyMessage="No buildings found." />
        )}
        <div className="pt-3 border-t border-gray-50 mt-2">
          <Link to="/buildings" className="text-xs text-blue-600 hover:underline">View all buildings →</Link>
        </div>
      </Card>
    </div>
  )
}
