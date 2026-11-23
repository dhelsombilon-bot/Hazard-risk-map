import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, Eye, ClipboardCheck, AlertCircle, FileX, FileCheck } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import StatCard from '../../components/ui/StatCard'
import { Table, Skeleton } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { permitService } from '../../services/permits'
import { lookupService } from '../../services/lookups'
import { buildingService } from '../../services/buildings'
import { formatDate } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'

export default function PermitsPage() {
  const { canEdit } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const status = searchParams.get('permit_status') || ''
  const buildingId = searchParams.get('building_id') || ''
  const page = Number(searchParams.get('page') || 1)

  const setParam = (key, val) => setSearchParams(prev => { const p = new URLSearchParams(prev); if (val) p.set(key, val); else p.delete(key); p.set('page', '1'); return p })
  const setPage = (p) => setSearchParams(prev => { const q = new URLSearchParams(prev); q.set('page', String(p)); return q })

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['permits', { search, status, buildingId, page }],
    placeholderData: keepPreviousData,
    queryFn: () => permitService.list({ search, permit_status: status, building_id: buildingId, page }),
  })

  const { data: lookups } = useQuery({ queryKey: ['lookups'], queryFn: lookupService.all })
  const { data: allPermits, isLoading: statsLoading } = useQuery({ queryKey: ['permits', { page: 1 }], queryFn: () => permitService.list({ page: 1 }) })

  const all = allPermits?.data || []
  const compliant = all.filter(p => p.permit_status === 'Compliant').length
  const forReview = all.filter(p => ['For review', 'Needs review'].includes(p.permit_status)).length
  const incomplete = all.filter(p => p.permit_status === 'Incomplete').length
  const noRecord = all.filter(p => p.permit_status === 'No permit record').length

  const columns = [
    {
      key: 'permit_number',
      label: 'Permit No. / Building',
      render: r => (
        <div>
          <Link to={`/permits/${r.permit_id}`} className="text-blue-600 hover:underline font-medium text-sm">{r.permit_number}</Link>
          <div className="text-xs text-gray-500">{r.building_name}</div>
        </div>
      )
    },
    { key: 'permit_type', label: 'Type' },
    { key: 'permit_status', label: 'Status', render: r => <StatusBadge status={r.permit_status} /> },
    { key: 'issue_date', label: 'Issue Date', render: r => formatDate(r.issue_date) },
    { key: 'expiry_date', label: 'Expiry Date', render: r => formatDate(r.expiry_date) },
    {
      key: 'actions',
      label: '',
      render: r => (
        <Link to={`/permits/${r.permit_id}`} className="text-gray-500 hover:text-blue-600" title="View"><Eye size={15} /></Link>
      )
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard loading={statsLoading} title="Compliant" value={compliant} subtitle="Up to date" icon={FileCheck} iconBg="bg-green-100" iconColor="text-green-600" />
        <StatCard loading={statsLoading} title="For Review" value={forReview} subtitle="Needs attention" icon={ClipboardCheck} iconBg="bg-amber-100" iconColor="text-amber-600" />
        <StatCard loading={statsLoading} title="Incomplete" value={incomplete} subtitle="Missing documents" icon={FileX} iconBg="bg-red-100" iconColor="text-red-600" />
        <StatCard loading={statsLoading} title="No Permit Record" value={noRecord} subtitle="Not on file" icon={AlertCircle} iconBg="bg-gray-100" iconColor="text-gray-500" />
      </div>

      <Card title="Permit Records">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search permit number or building…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setParam('search', search)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={status}
            onChange={e => setParam('permit_status', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            {lookups?.permit_statuses?.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {canEdit && (
            <Link to="/permits/new"><Button><Plus size={15} /> Add Permit</Button></Link>
          )}
        </div>

        {isLoading ? <Skeleton rows={8} cols={6} /> : (
          <div className={`transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`} aria-busy={isPlaceholderData}>
            <Table columns={columns} data={data?.data} emptyMessage="No permit records found." />
          </div>
        )}
        <Pagination meta={data?.meta} onPage={setPage} />
      </Card>
    </div>
  )
}
