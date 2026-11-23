import client from '../api/client'
import { delay } from '../mocks/delay'
import { mockGeneratedReports } from '../mocks/reports'
import { mockBuildings } from '../mocks/buildings'
import { mockPermits } from '../mocks/permits'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const reportService = {
  async list() {
    if (USE_MOCK) { await delay(); return mockGeneratedReports }
    const res = await client.get('/reports')
    return res.data
  },
  async preview({ report_type, type, barangay_id, date_from, date_to }) {
    const rt = report_type || type
    if (USE_MOCK) {
      await delay(600)
      if (rt === 'inventory_summary' || rt === 'building_inventory') {
        const chartData = [
          { name: 'Municipal Hall', value: 4 }, { name: 'Barangay Hall', value: 10 },
          { name: 'School', value: 6 }, { name: 'Health Center', value: 5 },
        ]
        return { title: 'Building Inventory Summary', chart_type: 'bar', chart_data: chartData, table_data: mockBuildings.slice(0, 8).map(b => ({ building_code: b.building_code, building_name: b.building_name, barangay: b.barangay_name, type: b.building_type })) }
      }
      if (rt === 'hazard_exposure') {
        const chartData = [{ name: 'High', value: 3 }, { name: 'Moderate-to-High', value: 5 }, { name: 'Moderate', value: 4 }, { name: 'Low', value: 3 }]
        return { title: 'Hazard Exposure Report', chart_type: 'pie', chart_data: chartData, table_data: mockBuildings.slice(0, 8).map(b => ({ building_name: b.building_name, barangay: b.barangay_name, risk_level: b.risk_level })) }
      }
      if (rt === 'inspection_findings') {
        return { title: 'Inspection Findings Log', chart_type: 'bar', chart_data: [{ name: 'Open', value: 8 }, { name: 'Resolved', value: 14 }], table_data: mockPermits.slice(0, 6).map(p => ({ permit_number: p.permit_number, building: p.building_name, status: p.permit_status })) }
      }
      const chartData = [{ name: 'Compliant', value: 12 }, { name: 'For review', value: 4 }, { name: 'Incomplete', value: 2 }, { name: 'No record', value: 2 }]
      return { title: 'Permit Compliance Summary', chart_type: 'pie', chart_data: chartData, table_data: mockPermits.slice(0, 8).map(p => ({ permit_number: p.permit_number, building: p.building_name, type: p.permit_type, status: p.permit_status })) }
    }
    const res = await client.get('/reports/preview', { params: { report_type: rt, barangay_id, date_from, date_to } })
    return res.data
  },
  async download(report) {
    if (USE_MOCK) { await delay(); return }
    const res = await client.get(`/reports/${report.report_id}/download`, { responseType: 'blob' })
    const disposition = res.headers['content-disposition'] || ''
    const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
    const filename = match ? decodeURIComponent(match[1]) : `report-${report.report_id}.xlsx`
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
  async generate(data) {
    if (USE_MOCK) {
      await delay(800)
      return { report_id: Date.now(), ...data, generated_at: new Date().toISOString(), file_path: 'reports/generated.pdf' }
    }
    const res = await client.post('/reports', data)
    return res.data
  },
}
