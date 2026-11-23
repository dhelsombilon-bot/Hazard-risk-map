import { useState, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Download, Eye, Pencil } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Table, Skeleton } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { buildingService } from '../../services/buildings'
import { lookupService } from '../../services/lookups'
import { useAuth } from '../../context/AuthContext'

export default function BuildingsPage() {
  const { canEdit } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const barangayId = searchParams.get('barangay_id') || ''
  const typeId = searchParams.get('building_type_id') || ''
  const page = Number(searchParams.get('page') || 1)

  const setParam = (key, val) => setSearchParams(prev => { const p = new URLSearchParams(prev); if (val) p.set(key, val); else p.delete(key); p.set('page', '1'); return p })
  const setPage = (p) => setSearchParams(prev => { const q = new URLSearchParams(prev); q.set('page', String(p)); return q })

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['buildings', { search, barangayId, typeId, page }],
    placeholderData: keepPreviousData,
    queryFn: () => buildingService.list({ search, barangay_id: barangayId, building_type_id: typeId, page }),
  })

  const { data: lookups } = useQuery({ queryKey: ['lookups'], queryFn: lookupService.all })

  const columns = [
    {
      key: 'building_code',
      label: 'Building ID / Name',
      render: r => (
        <div>
          <Link to={`/buildings/${r.building_id}`} className="text-blue-600 hover:underline font-medium text-sm">{r.building_code} {r.building_name}</Link>
        </div>
      )
    },
    { key: 'barangay_name', label: 'Barangay' },
    { key: 'building_type', label: 'Type' },
    {
      key: 'coords',
      label: 'Coordinates',
      render: r => r.latitude ? <span className="text-xs text-gray-500">{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</span> : '—'
    },
    { key: 'building_status', label: 'Status', render: r => <StatusBadge status={r.building_status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: r => (
        <div className="flex items-center gap-2">
          <Link to={`/buildings/${r.building_id}`} className="text-gray-500 hover:text-blue-600" title="View"><Eye size={15} /></Link>
          {canEdit && <Link to={`/buildings/${r.building_id}/edit`} className="text-gray-500 hover:text-blue-600" title="Edit"><Pencil size={15} /></Link>}
        </div>
      )
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-bold text-[#0F1E3D]">{data?.meta?.total ?? '—'}</div>
            <div className="text-sm text-gray-600">Total recorded public buildings</div>
            <div className="text-xs text-gray-400 mt-0.5">Municipality-wide — Records grouped by barangay and location</div>
          </div>
          {canEdit && (
            <Link to="/buildings/new">
              <Button><Plus size={15} /> Add Building</Button>
            </Link>
          )}
        </div>
      </Card>

      <Card title="Building Records">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search building name or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setParam('search', search)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={barangayId}
            onChange={e => setParam('barangay_id', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All barangays</option>
            {lookups?.barangays?.map(b => <option key={b.barangay_id} value={b.barangay_id}>{b.barangay_name}</option>)}
          </select>
          <select
            value={typeId}
            onChange={e => setParam('building_type_id', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All building types</option>
            {lookups?.building_types?.map(t => <option key={t.building_type_id} value={t.building_type_id}>{t.type_name}</option>)}
          </select>
          <Button variant="secondary" size="sm"><Download size={14} /> Export list</Button>
        </div>

        {isLoading ? <Skeleton rows={8} cols={6} /> : (
          <div className={`transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`} aria-busy={isPlaceholderData}>
            <Table columns={columns} data={data?.data} emptyMessage="No buildings found matching your filters." />
          </div>
        )}

        <Pagination meta={data?.meta} onPage={setPage} />

        <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
          Only public buildings owned or managed by the government are included.
        </p>
      </Card>
    </div>
  )
}
