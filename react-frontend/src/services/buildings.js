import client from '../api/client'
import { delay } from '../mocks/delay'
import { mockBuildings, mockBuildingHazards, mockBuildingActivity, mockLandscape } from '../mocks/buildings'
import { mockPermits } from '../mocks/permits'
import { hazardTypes as mockHazardTypes } from '../mocks/lookups'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

function paginate(arr, page = 1, per = 8) {
  const total = arr.length
  const last_page = Math.ceil(total / per)
  const from = (page - 1) * per
  return { data: arr.slice(from, from + per), meta: { current_page: page, last_page, total, per_page: per } }
}

export const buildingService = {
  async list({ search = '', barangay_id = '', building_type_id = '', page = 1 } = {}) {
    if (USE_MOCK) {
      await delay()
      let items = mockBuildings
      if (search) items = items.filter(b => b.building_name.toLowerCase().includes(search.toLowerCase()) || b.building_code.includes(search))
      if (barangay_id) items = items.filter(b => b.barangay_id === Number(barangay_id))
      if (building_type_id) items = items.filter(b => b.building_type_id === Number(building_type_id))
      return paginate(items, page)
    }
    const res = await client.get('/buildings', { params: { search, barangay_id, building_type_id, page } })
    return res.data
  },
  async get(id) {
    if (USE_MOCK) {
      await delay()
      const b = mockBuildings.find(x => x.building_id === Number(id))
      if (!b) throw { response: { status: 404 } }
      return { ...b, hazards: mockBuildingHazards[id] || [], activity: mockBuildingActivity, landscape: mockLandscape, permits: mockPermits.filter(p => p.building_id === Number(id)) }
    }
    const res = await client.get(`/buildings/${id}`)
    return res.data
  },
  async create(data) {
    if (USE_MOCK) {
      await delay(800)
      const newB = { ...data, building_id: Date.now(), building_code: `GP-${String(mockBuildings.length + 1).padStart(4,'0')}`, building_status: 'Needs review', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      mockBuildings.push(newB)
      return newB
    }
    const res = await client.post('/buildings', data)
    return res.data
  },
  async update(id, data) {
    if (USE_MOCK) {
      await delay(600)
      const { hazards, ...fields } = data
      if (hazards) {
        mockBuildingHazards[id] = hazards.map((h, i) => ({
          ...h,
          hazard_assessment_id: h.hazard_assessment_id ?? Date.now() + i,
          hazard_type: mockHazardTypes.find(t => t.hazard_type_id === Number(h.hazard_type_id))?.hazard_name,
        }))
      }
      const idx = mockBuildings.findIndex(x => x.building_id === Number(id))
      if (idx >= 0) mockBuildings[idx] = { ...mockBuildings[idx], ...fields, updated_at: new Date().toISOString() }
      return mockBuildings[idx]
    }
    const res = await client.put(`/buildings/${id}`, data)
    return res.data
  },
  async geojson() {
    if (USE_MOCK) {
      await delay()
      return {
        type: 'FeatureCollection',
        features: mockBuildings.map(b => ({
          type: 'Feature',
          properties: { id: b.building_id, name: b.building_name, code: b.building_code, barangay: b.barangay_name, risk_level: b.risk_level, status: b.building_status },
          geometry: { type: 'Point', coordinates: [b.longitude, b.latitude] },
        })),
      }
    }
    const res = await client.get('/buildings/geojson')
    return res.data
  },
}
