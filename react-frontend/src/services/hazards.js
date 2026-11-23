import client from '../api/client'
import { delay } from '../mocks/delay'
import { mockHazardLayers, mockBarangayBoundaries } from '../mocks/hazards'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const hazardService = {
  async layers(hazard_type) {
    if (USE_MOCK) {
      await delay(300)
      if (hazard_type === 'flood') return mockHazardLayers.flood
      if (hazard_type === 'landslide') return mockHazardLayers.landslide
      return { type: 'FeatureCollection', features: [] }
    }
    const res = await client.get('/hazards/layers', { params: { hazard_type } })
    return res.data
  },
  /** Hazard exposure of any point inside Bongabong (no building record needed) */
  async assess(latitude, longitude) {
    if (USE_MOCK) {
      await delay(300)
      // Mock mode has no hazard datasets, so report that honestly instead of inventing levels
      const none = { status: 'no_data', level: null, dataset: null }
      return { latitude, longitude, hazards: { Flood: none, Landslide: none }, overall: { status: 'no_data', level: null } }
    }
    const res = await client.get('/hazards/assess', { params: { latitude, longitude } })
    return res.data
  },
  async barangayBoundaries() {
    if (USE_MOCK) { await delay(300); return mockBarangayBoundaries }
    const res = await client.get('/landscape/layers')
    return res.data
  },
}
