import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, XCircle, Circle, Building2, FileText, ClipboardList, AlertTriangle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import { DetailSkeleton } from '../../components/ui/Skeleton'
import { formatDate, formatDateTime } from '../../utils/formatters'
import { permitService } from '../../services/permits'
import { useAuth } from '../../context/AuthContext'

const TABS = [
  { key: 'info', label: 'Permit Info', icon: FileText },
  { key: 'documents', label: 'Documents', icon: ClipboardList },
  { key: 'compliance', label: 'Compliance Checks', icon: CheckCircle2 },
  { key: 'findings', label: 'Findings', icon: AlertTriangle },
]

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-gray-800 mt-0.5">{value || '—'}</dd>
    </div>
  )
}

function DocRow({ doc }) {
  const present = doc.is_present
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${present ? 'bg-green-50' : 'bg-red-50'}`}>
      <div className="flex items-center gap-2">
        {present ? <CheckCircle2 size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-500" />}
        <div>
          <div className="text-sm font-medium">{doc.document_type}</div>
          {doc.file_name && <div className="text-xs text-gray-500">{doc.file_name}</div>}
          {doc.uploaded_at && <div className="text-xs text-gray-400">{formatDate(doc.uploaded_at)}</div>}
        </div>
      </div>
      <span className={`text-xs font-medium ${present ? 'text-green-700' : 'text-red-600'}`}>{present ? 'On file' : 'Missing'}</span>
    </div>
  )
}

export default function PermitDetailPage() {
  const { id } = useParams()
  const { canEdit } = useAuth()
  const [tab, setTab] = useState('info')

  const { data: permit, isLoading } = useQuery({
    queryKey: ['permit', id],
    queryFn: () => permitService.get(id),
  })

  if (isLoading) return <DetailSkeleton tabs={4} fields={12} action={false} />
  if (!permit) return <div className="text-center py-16 text-gray-400">Permit not found.</div>

  const findings = permit.findings || []
  const openFindings = findings.filter(f => f.status === 'Open')

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">{permit.permit_number}</div>
            <h2 className="text-lg font-bold text-[#0F1E3D]">{permit.permit_type}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <StatusBadge status={permit.permit_status} />
              <Link to={`/buildings/${permit.building_id}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <Building2 size={12} />{permit.building_name}
              </Link>
            </div>
          </div>
          {canEdit && openFindings.length > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">{openFindings.length} open finding{openFindings.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </Card>

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

      {tab === 'info' && (
        <Card>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            <Field label="Permit Number" value={permit.permit_number} />
            <Field label="Permit Type" value={permit.permit_type} />
            <Field label="Status" value={<StatusBadge status={permit.permit_status} />} />
            <Field label="Building" value={permit.building_name} />
            <Field label="Issue Date" value={formatDate(permit.issue_date)} />
            <Field label="Expiry Date" value={formatDate(permit.expiry_date)} />
            <Field label="Issuing Authority" value={permit.issuing_authority} />
            <Field label="Permit Fee (₱)" value={permit.permit_fee_amount ? Number(permit.permit_fee_amount).toLocaleString('en-PH') : null} />
            <Field label="Remarks" value={permit.remarks} />
            <Field label="Recorded By" value={permit.recorded_by} />
            <Field label="Created At" value={formatDateTime(permit.created_at)} />
            <Field label="Last Updated" value={formatDateTime(permit.updated_at)} />
          </dl>
        </Card>
      )}

      {tab === 'documents' && (
        <Card>
          <p className="text-xs text-gray-500 mb-4">Required permit documents checklist.</p>
          <div className="space-y-2">
            {(permit.documents || []).map((doc, i) => <DocRow key={i} doc={doc} />)}
          </div>
          {!permit.documents?.length && <p className="text-sm text-gray-400">No document records.</p>}
        </Card>
      )}

      {tab === 'compliance' && (
        <Card>
          <div className="space-y-3">
            {(permit.compliance_checks || []).map(c => (
              <div key={c.check_id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium">{c.check_type}</div>
                  <div className="text-xs text-gray-500">Checked by {c.checked_by} · {formatDate(c.checked_at)}</div>
                  {c.notes && <div className="text-xs text-gray-400 mt-0.5">{c.notes}</div>}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.result === 'Pass' ? 'bg-green-100 text-green-700' : c.result === 'Fail' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{c.result}</span>
              </div>
            ))}
            {!permit.compliance_checks?.length && <p className="text-sm text-gray-400">No compliance checks recorded.</p>}
          </div>
        </Card>
      )}

      {tab === 'findings' && (
        <Card>
          <div className="space-y-3">
            {findings.map(f => (
              <div key={f.finding_id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${f.severity === 'Critical' ? 'bg-red-100 text-red-700' : f.severity === 'Major' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{f.severity}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${f.status === 'Open' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{f.status}</span>
                    </div>
                    <div className="text-sm font-medium">{f.description}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Reported by {f.reported_by} · {formatDate(f.reported_at)}</div>
                    {f.resolution_notes && <div className="text-xs text-gray-500 mt-1 italic">{f.resolution_notes}</div>}
                  </div>
                  {canEdit && f.status === 'Open' && (
                    <Button variant="secondary" size="sm" onClick={() => permitService.resolveFinding(f.finding_id, 'Resolved')}>Resolve</Button>
                  )}
                </div>
              </div>
            ))}
            {!findings.length && <p className="text-sm text-gray-400">No findings recorded for this permit.</p>}
          </div>
        </Card>
      )}
    </div>
  )
}
