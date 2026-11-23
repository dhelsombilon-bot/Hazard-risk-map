import { Plus, Trash2 } from 'lucide-react'
import Card from './ui/Card'
import Button from './ui/Button'

const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"

function Field({ label, required, children, error }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

export const emptyHazardRow = () => ({ hazard_assessment_id: null, hazard_type_id: '', hazard_level: '', dataset_name: '', assessment_date: '', assessment_notes: '' })

/** Client-side check; returns Laravel-style errors keyed `hazards.{i}.field` */
export function validateHazards(hazards) {
  const errs = {}
  hazards.forEach((h, i) => {
    if (!h.hazard_type_id) errs[`hazards.${i}.hazard_type_id`] = ['Hazard type is required.']
    if (!h.hazard_level) errs[`hazards.${i}.hazard_level`] = ['Risk level is required.']
  })
  return errs
}

/** Shape rows for the API */
export const hazardsPayload = (hazards) => hazards.map(h => ({
  ...h,
  hazard_type_id: Number(h.hazard_type_id),
  dataset_name: h.dataset_name || null,
  assessment_date: h.assessment_date || null,
  assessment_notes: h.assessment_notes || null,
}))

/** Editable list of a building's hazard assessments (Add + Edit Building forms) */
export default function HazardRiskFields({ hazards, onChange, lookups, errors = {}, children }) {
  const setRow = (idx, key, val) => onChange(hazards.map((h, i) => (i === idx ? { ...h, [key]: val } : h)))
  const add = () => onChange([...hazards, emptyHazardRow()])
  const remove = (idx) => onChange(hazards.filter((_, i) => i !== idx))

  return (
    <Card title="Hazard Risk" actions={<Button type="button" variant="secondary" size="sm" onClick={add}><Plus size={14} /> Add Hazard</Button>}>
      <p className="text-xs text-gray-400 mb-3">Based on available mapped data. This is not a structural safety assessment.</p>
      {children}
      {hazards.length === 0 ? (
        <p className="text-sm text-gray-400">No hazard assessments recorded. Click “Add Hazard” to add one.</p>
      ) : (
        <div className="space-y-3">
          {hazards.map((h, i) => (
            <div key={h.hazard_assessment_id ?? `new-${i}`} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Hazard Type" required error={errors[`hazards.${i}.hazard_type_id`]?.[0]}>
                  <select className={inputCls} value={h.hazard_type_id} onChange={e => setRow(i, 'hazard_type_id', e.target.value)}>
                    <option value="">Select hazard…</option>
                    {lookups?.hazard_types?.map(t => <option key={t.hazard_type_id} value={String(t.hazard_type_id)}>{t.hazard_name}</option>)}
                  </select>
                </Field>
                <Field label="Risk Level" required error={errors[`hazards.${i}.hazard_level`]?.[0]}>
                  <select className={inputCls} value={h.hazard_level} onChange={e => setRow(i, 'hazard_level', e.target.value)}>
                    <option value="">Select level…</option>
                    {lookups?.hazard_levels?.map(l => <option key={l.hazard_level_id} value={l.level_name}>{l.level_name}</option>)}
                  </select>
                </Field>
                <Field label="Dataset / Source" error={errors[`hazards.${i}.dataset_name`]?.[0]}>
                  <input className={inputCls} value={h.dataset_name} onChange={e => setRow(i, 'dataset_name', e.target.value)} placeholder="e.g. PAGASA Flood Map 2022" />
                </Field>
                <Field label="Assessment Date" error={errors[`hazards.${i}.assessment_date`]?.[0]}>
                  <input className={inputCls} type="date" value={h.assessment_date} onChange={e => setRow(i, 'assessment_date', e.target.value)} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Notes">
                    <textarea className={inputCls} rows={2} value={h.assessment_notes} onChange={e => setRow(i, 'assessment_notes', e.target.value)} />
                  </Field>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button type="button" onClick={() => remove(i)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
