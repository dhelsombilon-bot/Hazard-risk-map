import client from '../api/client'
import { delay } from '../mocks/delay'
import * as mockLookups from '../mocks/lookups'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const lookupService = {
  async all() {
    if (USE_MOCK) {
      await delay(200)
      return {
        barangays: mockLookups.barangays,
        building_types: mockLookups.buildingTypes,
        building_statuses: mockLookups.buildingStatuses,
        permit_types: mockLookups.permitTypes,
        permit_statuses: mockLookups.permitStatuses.map(s => s.status_name),
        document_types: mockLookups.documentTypes,
        hazard_types: mockLookups.hazardTypes,
        hazard_levels: mockLookups.hazardLevels,
        roles: mockLookups.roles,
      }
    }
    const res = await client.get('/lookups')
    return res.data
  },
}
