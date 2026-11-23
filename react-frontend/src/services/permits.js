import client from '../api/client'
import { delay } from '../mocks/delay'
import { mockPermits, mockPermitDocuments, mockComplianceChecks, mockFindings } from '../mocks/permits'
import { documentTypes } from '../mocks/lookups'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

function paginate(arr, page = 1, per = 8) {
  const total = arr.length
  const last_page = Math.ceil(total / per)
  const from = (page - 1) * per
  return { data: arr.slice(from, from + per), meta: { current_page: page, last_page, total, per_page: per } }
}

export const permitService = {
  async list({ search = '', permit_status = '', status = '', building_id = '', page = 1 } = {}) {
    const statusFilter = permit_status || status
    if (USE_MOCK) {
      await delay()
      let items = mockPermits
      if (search) items = items.filter(p => p.permit_number.includes(search) || p.building_name.toLowerCase().includes(search.toLowerCase()))
      if (statusFilter) items = items.filter(p => p.permit_status === statusFilter)
      if (building_id) items = items.filter(p => p.building_id === Number(building_id))
      return paginate(items, page)
    }
    const res = await client.get('/permits', { params: { search, permit_status: statusFilter, building_id, page } })
    return res.data
  },
  async get(id) {
    if (USE_MOCK) {
      await delay()
      const p = mockPermits.find(x => x.permit_id === Number(id))
      if (!p) throw { response: { status: 404 } }
      const docs = documentTypes.map(dt => {
        const uploaded = mockPermitDocuments.find(d => d.permit_id === Number(id) && d.document_type_id === dt.document_type_id)
        const hasFile = uploaded && uploaded.file_path !== null
        return {
          document_type_id: dt.document_type_id,
          document_type: dt.document_name,
          is_present: hasFile,
          file_name: uploaded?.file_path ? uploaded.file_path.split('/').pop() : null,
          document_reference: uploaded?.document_reference || null,
          uploaded_at: uploaded?.uploaded_at || null,
          verification_status: hasFile ? 'Verified' : 'Missing',
        }
      })
      const checks = mockComplianceChecks
        .filter(c => c.permit_id === Number(id))
        .map(c => ({ check_id: c.compliance_check_id, check_type: 'Document Verification', result: c.result, checked_by: c.checked_by, checked_at: c.check_date, notes: c.findings }))
      const findings = mockFindings
        .filter(f => f.permit_id === Number(id))
        .map(f => ({ finding_id: f.finding_id, severity: 'Major', description: f.finding_description, status: f.resolution_status, reported_by: 'Personnel One', reported_at: '2025-01-20T10:00:00Z', resolution_notes: null }))
      return { ...p, documents: docs, compliance_checks: checks, findings }
    }
    const res = await client.get(`/permits/${id}`)
    return res.data
  },
  async create(data) {
    if (USE_MOCK) {
      await delay(800)
      const newP = { ...data, permit_id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      mockPermits.push(newP)
      return newP
    }
    const res = await client.post('/permits', data)
    return res.data
  },
  async update(id, data) {
    if (USE_MOCK) {
      await delay(600)
      const idx = mockPermits.findIndex(x => x.permit_id === Number(id))
      if (idx >= 0) mockPermits[idx] = { ...mockPermits[idx], ...data, updated_at: new Date().toISOString() }
      return mockPermits[idx]
    }
    const res = await client.put(`/permits/${id}`, data)
    return res.data
  },
  async resolveFinding(findingId) {
    if (USE_MOCK) {
      await delay(400)
      const f = mockFindings.find(x => x.finding_id === Number(findingId))
      if (f) { f.resolution_status = 'Resolved'; f.resolved_at = new Date().toISOString() }
      return f
    }
    const res = await client.put(`/findings/${findingId}`, { resolution_status: 'Resolved' })
    return res.data
  },
}
