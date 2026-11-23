import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { permitService } from '../../services/permits'
import { FormSkeleton } from '../../components/ui/Skeleton'
import { lookupService } from '../../services/lookups'
import { buildingService } from '../../services/buildings'

function Field({ label, required, children, error }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function AddPermitPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()

  const [form, setForm] = useState({
    building_id: searchParams.get('building_id') || '',
    permit_type_id: '',
    permit_status_id: '',
    permit_number: '',
    issue_date: '',
    expiry_date: '',
    issuing_authority: '',
    permit_fee_amount: '',
    remarks: '',
  })
  const [errors, setErrors] = useState({})
  const [buildingSearch, setBuildingSearch] = useState('')

  const { data: lookups, isLoading: lookupsLoading } = useQuery({ queryKey: ['lookups'], queryFn: lookupService.all })
  const { data: buildingsData } = useQuery({
    queryKey: ['buildings', { search: buildingSearch }],
    queryFn: () => buildingService.list({ search: buildingSearch, page: 1 }),
  })

  const buildings = buildingsData?.data || []

  const mutation = useMutation({
    mutationFn: permitService.create,
    onSuccess: (data) => {
      toast({ message: 'Permit record created successfully.' })
      navigate(`/permits/${data.permit_id}`)
    },
    onError: (err) => {
      if (err?.response?.status === 422) setErrors(err.response.data.errors || {})
      else toast({ message: 'Failed to save permit record.', type: 'error' })
    },
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    const errs = {}
    if (!form.building_id) errs.building_id = ['Building is required.']
    if (!form.permit_type_id) errs.permit_type_id = ['Permit type is required.']
    if (!form.issue_date) errs.issue_date = ['Issue date is required.']
    if (form.expiry_date && form.issue_date && form.expiry_date < form.issue_date)
      errs.expiry_date = ['Expiry date must be after issue date.']
    if (Object.keys(errs).length) { setErrors(errs); return }
    mutation.mutate(form)
  }

  if (lookupsLoading) return <FormSkeleton sections={[{ fields: 6, textarea: true }]} />

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
      <Card title="Permit Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Building" required error={errors.building_id?.[0]}>
              <input
                className={inputCls}
                placeholder="Search building name or code…"
                value={buildingSearch}
                onChange={e => setBuildingSearch(e.target.value)}
              />
              {buildings.length > 0 && (
                <div className="border border-gray-200 rounded-lg mt-1 max-h-40 overflow-y-auto">
                  {buildings.map(b => (
                    <button
                      key={b.building_id}
                      type="button"
                      onClick={() => { set('building_id', b.building_id); setBuildingSearch(`${b.building_code} — ${b.building_name}`) }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${form.building_id === b.building_id ? 'bg-blue-50 font-medium' : ''}`}
                    >
                      <span className="font-medium text-blue-600">{b.building_code}</span>
                      <span className="text-gray-600"> — {b.building_name}</span>
                      <span className="text-xs text-gray-400 ml-2">{b.barangay_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </Field>
          </div>

          <Field label="Permit Type" required error={errors.permit_type_id?.[0]}>
            <select className={inputCls} value={form.permit_type_id} onChange={e => set('permit_type_id', e.target.value)}>
              <option value="">Select type…</option>
              {lookups?.permit_types?.map(t => (
                <option key={t.permit_type_id} value={t.permit_type_id}>{t.type_name}</option>
              ))}
            </select>
          </Field>

          <Field label="Permit Status" error={errors.permit_status_id?.[0]}>
            <select className={inputCls} value={form.permit_status_id} onChange={e => set('permit_status_id', e.target.value)}>
              <option value="">Select status…</option>
              {lookups?.permit_statuses?.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          <Field label="Permit Number" error={errors.permit_number?.[0]}>
            <input className={inputCls} value={form.permit_number} onChange={e => set('permit_number', e.target.value)} placeholder="e.g. BP-2026-001" />
          </Field>

          <Field label="Issuing Authority" error={errors.issuing_authority?.[0]}>
            <input className={inputCls} value={form.issuing_authority} onChange={e => set('issuing_authority', e.target.value)} />
          </Field>

          <Field label="Issue Date" required error={errors.issue_date?.[0]}>
            <input className={inputCls} type="date" value={form.issue_date} onChange={e => set('issue_date', e.target.value)} />
          </Field>

          <Field label="Expiry Date" error={errors.expiry_date?.[0]}>
            <input className={inputCls} type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} />
          </Field>

          <Field label="Permit Fee (₱)" error={errors.permit_fee_amount?.[0]}>
            <input className={inputCls} type="number" min="0" step="0.01" value={form.permit_fee_amount} onChange={e => set('permit_fee_amount', e.target.value)} />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Remarks" error={errors.remarks?.[0]}>
              <textarea className={inputCls} rows={3} value={form.remarks} onChange={e => set('remarks', e.target.value)} />
            </Field>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save Permit'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/permits')}>Cancel</Button>
      </div>
    </form>
  )
}
