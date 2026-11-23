import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, BarChart2, Map, Users, Download, Eye } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Table } from '../../components/ui/Table'
import { Skeleton, SkeletonGroup, ChartSkeleton, TableSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { reportService } from '../../services/reports'
import { lookupService } from '../../services/lookups'
import { formatDate, formatDateTime } from '../../utils/formatters'

const REPORT_TYPES = [
  { key: 'permit_compliance', label: 'Permit Compliance Summary', icon: FileText, desc: 'Overview of permit statuses across all public buildings.', color: 'bg-blue-50 border-blue-200', iconColor: 'text-blue-600' },
  { key: 'hazard_exposure', label: 'Hazard Exposure Report', icon: Map, desc: 'Buildings grouped by flood and landslide risk levels.', color: 'bg-orange-50 border-orange-200', iconColor: 'text-orange-600' },
  { key: 'inventory_summary', label: 'Building Inventory Summary', icon: BarChart2, desc: 'Breakdown of public buildings by type and barangay.', color: 'bg-green-50 border-green-200', iconColor: 'text-green-600' },
  { key: 'inspection_findings', label: 'Inspection Findings Log', icon: Users, desc: 'Summary of compliance findings and their resolution status.', color: 'bg-purple-50 border-purple-200', iconColor: 'text-purple-600' },
]

const COLORS = ['#2563EB', '#16A34A', '#CA8A04', '#DC2626', '#7C3AED', '#0891B2']

function PreviewModal({ open, onClose, report, loading }) {
  if (!open) return null
  const chartData = report?.chart_data || []
  const tableData = report?.table_data || []
  const tableColumns = Object.keys(tableData[0] || {}).map(k => ({
    key: k,
    label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  }))

  return (
    <Modal open title={report?.title || 'Report Preview'} onClose={onClose} size="xl">
      {loading ? (
        <SkeletonGroup label="Loading preview…" className="space-y-6">
          {/* Same shape as the chart panel + records table below */}
          <div className="bg-gray-50 rounded-xl p-4">
            <Skeleton className="h-2.5 w-20 mb-4" />
            <ChartSkeleton height={220} />
          </div>
          <div>
            <Skeleton className="h-2.5 w-16 mb-3" />
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <TableSkeleton rows={5} cols={4} />
            </div>
          </div>
        </SkeletonGroup>
      ) : (
        <div className="space-y-6">
          {chartData.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                {report?.chart_type === 'pie' ? 'Distribution' : 'Summary'}
              </p>
              <ResponsiveContainer width="100%" height={220}>
                {report?.chart_type === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={40}
                      paddingAngle={2}
                    >
                      {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                ) : (
                  <BarChart data={chartData} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#F3F4F6' }} />
                    <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {tableData.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Records</p>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {tableColumns.map(c => (
                        <th key={c.key} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tableData.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        {tableColumns.map(c => (
                          <td key={c.key} className="px-4 py-2.5 text-gray-700">{row[c.key] ?? '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button><Download size={14} /> Download Report</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default function ReportsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ barangay_id: '', date_from: '', date_to: '' })
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  const { data: reports, isLoading: reportsLoading } = useQuery({ queryKey: ['reports'], queryFn: reportService.list })
  const { data: lookups } = useQuery({ queryKey: ['lookups'], queryFn: lookupService.all })

  const generateMutation = useMutation({
    mutationFn: ({ report_type }) => reportService.generate({ report_type, ...filters }),
    onSuccess: () => { toast({ message: 'Report generated successfully.' }); queryClient.invalidateQueries({ queryKey: ['reports'] }) },
    onError: () => toast({ message: 'Failed to generate report.', type: 'error' }),
  })

  const handlePreview = async (reportType) => {
    setPreview(null)
    setPreviewLoading(true)
    try {
      const data = await reportService.preview({ report_type: reportType, ...filters })
      setPreview(data)
    } catch {
      toast({ message: 'Failed to load preview.', type: 'error' })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleDownload = async (report) => {
    setDownloadingId(report.report_id)
    try {
      await reportService.download(report)
    } catch {
      toast({ message: 'Failed to download report.', type: 'error' })
    } finally {
      setDownloadingId(null)
    }
  }

  const historyColumns = [
    { key: 'report_title', label: 'Report Title', render: r => r.report_title || r.report_type?.replace(/_/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) },
    { key: 'generated_by', label: 'Generated By' },
    { key: 'generated_at', label: 'Generated At', render: r => formatDateTime(r.generated_at) },
    {
      key: 'actions', label: '',
      render: r => (
        <button
          type="button"
          disabled={downloadingId === r.report_id}
          onClick={() => handleDownload(r)}
          className="text-blue-600 hover:underline text-xs flex items-center gap-1 disabled:opacity-50"
        >
          <Download size={12} /> {downloadingId === r.report_id ? 'Downloading…' : 'Download'}
        </button>
      )
    },
  ]

  return (
    <div className="space-y-4">
      <Card title="Report Filters">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Barangay</label>
            <select
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.barangay_id}
              onChange={e => setFilters(f => ({ ...f, barangay_id: e.target.value }))}
            >
              <option value="">All barangays</option>
              {lookups?.barangays?.map(b => <option key={b.barangay_id} value={b.barangay_id}>{b.barangay_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date From</label>
            <input type="date" className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date To</label>
            <input type="date" className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORT_TYPES.map(rt => {
          const Icon = rt.icon
          return (
            <div key={rt.key} className={`bg-white rounded-xl border p-5 ${rt.color}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-white border ${rt.color}`}><Icon size={18} className={rt.iconColor} /></div>
                <div>
                  <div className="text-sm font-semibold text-[#0F1E3D]">{rt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{rt.desc}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handlePreview(rt.key)}>
                  <Eye size={13} /> Preview
                </Button>
                <Button size="sm" disabled={generateMutation.isPending} onClick={() => generateMutation.mutate({ report_type: rt.key })}>
                  <Download size={13} /> Generate
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <Card title="Generated Reports History">
        <Table columns={historyColumns} data={reports || []} loading={reportsLoading} emptyMessage="No reports have been generated yet." />
      </Card>

      <PreviewModal open={!!preview || previewLoading} onClose={() => { setPreview(null); setPreviewLoading(false) }} report={preview} loading={previewLoading && !preview} />
    </div>
  )
}
