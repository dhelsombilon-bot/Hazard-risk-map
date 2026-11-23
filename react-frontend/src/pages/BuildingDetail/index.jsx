import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Pencil, MapPin, FileText, TriangleAlert, TreePine, Activity } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { StatusBadge, RiskBadge } from '../../components/ui/Badge'
import { DetailSkeleton } from '../../components/ui/Skeleton'
import { formatDate, formatDateTime } from '../../utils/formatters'
import { buildingService } from '../../services/buildings'
import { useAuth } from '../../context/AuthContext'
import BaseMap from '../../components/map/BaseMap'
import BuildingMarker from '../../components/map/BuildingMarker'

const TABS = [
  { key: 'details', label: 'Details', icon: FileText },
  { key: 'location', label: 'Location', icon: MapPin },
  { key: 'permits', label: 'Permits', icon: FileText },
  { key: 'hazard', label: 'Hazard Exposure', icon: TriangleAlert },
  { key: 'landscape', label: 'Landscape', icon: TreePine },
  { key: 'activity', label: 'Activity', icon: Activity },
]

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-gray-800 mt-0.5">{value || '—'}</dd>
    </div>
  )
}

export default function BuildingDetailPage() {
  const { id } = useParams()
  const { canEdit } = useAuth()
  const [tab, setTab] = useState('details')

  const { data: building, isLoading } = useQuery({
    queryKey: ['building', id],
    queryFn: () => buildingService.get(id),
  })

  if (isLoading) return <DetailSkeleton tabs={6} fields={12} action={canEdit} />
  if (!building) return <div className="text-center py-16 text-gray-400">Building not found.</div>

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">{building.building_code}</div>
            <h2 className="text-lg font-bold text-[#0F1E3D]">{building.building_name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <StatusBadge status={building.building_status} />
              <span className="text-xs text-gray-500">{building.building_type}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{building.barangay_name}</span>
            </div>
          </div>
          {canEdit && (
            <Link to={`/buildings/${id}/edit`}><Button variant="secondary" size="sm"><Pencil size={14} /> Edit</Button></Link>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1.5 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg font-medium whitespace-nowrap transition-colors ${
              tab === key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <Card>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            <Field label="Building Code" value={building.building_code} />
            <Field label="Building Name" value={building.building_name} />
            <Field label="Type" value={building.building_type} />
            <Field label="Status" value={<StatusBadge status={building.building_status} />} />
            <Field label="Barangay" value={building.barangay_name} />
            <Field label="Street Address" value={building.street_address} />
            <Field label="Managing Office" value={building.managing_office} />
            <Field label="Year Built" value={building.year_built} />
            <Field label="Description" value={building.description} />
            <Field label="Created By" value={building.created_by} />
            <Field label="Created At" value={formatDateTime(building.created_at)} />
            <Field label="Last Updated" value={formatDateTime(building.updated_at)} />
          </dl>
        </Card>
      )}

      {tab === 'location' && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div style={{ height: 280, borderRadius: 8, overflow: 'hidden' }}>
              {building.latitude && (
                <BaseMap center={[building.latitude, building.longitude]} zoom={15}>
                  <BuildingMarker building={building} />
                </BaseMap>
              )}
            </div>
            <dl className="space-y-4">
              <Field label="Latitude" value={building.latitude} />
              <Field label="Longitude" value={building.longitude} />
              <Field label="Elevation (m)" value={building.elevation_m} />
              <Field label="Coordinate Source" value={building.coordinate_source} />
              <Field label="Verified At" value={formatDateTime(building.verified_at)} />
              <Field label="Verified By" value={building.verified_by} />
            </dl>
          </div>
        </Card>
      )}

      {tab === 'permits' && (
        <Card>
          {building.permits?.length ? (
            <div className="space-y-3">
              {building.permits.map(p => (
                <div key={p.permit_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Link to={`/permits/${p.permit_id}`} className="text-sm font-medium text-blue-600 hover:underline">{p.permit_number}</Link>
                    <div className="text-xs text-gray-500">{p.permit_type} · {formatDate(p.issue_date)}</div>
                  </div>
                  <StatusBadge status={p.permit_status} />
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No permit records linked to this building.</p>}
        </Card>
      )}

      {tab === 'hazard' && (
        <Card>
          <p className="text-xs text-gray-500 mb-4">Based on available mapped data. This is not a structural safety assessment.</p>
          {building.hazards?.length ? (
            <div className="space-y-3">
              {building.hazards.map(h => (
                <div key={h.hazard_assessment_id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">{h.hazard_type}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{h.dataset_name} · {formatDate(h.assessment_date)}</div>
                    {h.assessment_notes && <div className="text-xs text-gray-400 mt-0.5">{h.assessment_notes}</div>}
                  </div>
                  <RiskBadge level={h.hazard_level} />
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No hazard assessment data available for this building.</p>}
        </Card>
      )}

      {tab === 'landscape' && (
        <Card>
          {building.landscape?.length ? (
            <div className="space-y-3">
              {building.landscape.map(l => (
                <div key={l.assessment_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">{l.feature_name}</div>
                    <div className="text-xs text-gray-500">{l.feature_type}</div>
                    {l.assessment_notes && <div className="text-xs text-gray-400">{l.assessment_notes}</div>}
                  </div>
                  <span className="text-sm text-gray-600">{l.distance_m} m</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No landscape features recorded.</p>}
        </Card>
      )}

      {tab === 'activity' && (
        <Card>
          <div className="space-y-3">
            {building.activity?.map(log => (
              <div key={log.log_id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">{log.user_name}</span>
                  <span className="text-gray-500"> — {log.action}</span>
                  <div className="text-xs text-gray-400">{formatDateTime(log.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
