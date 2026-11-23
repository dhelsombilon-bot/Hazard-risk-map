import client from '../api/client'
import { delay } from '../mocks/delay'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const notificationService = {
  async list() {
    if (USE_MOCK) { await delay(200); return { data: [], unread_count: 0 } }
    const res = await client.get('/notifications')
    return res.data
  },
  async markRead(ids) {
    if (USE_MOCK) return { ok: true }
    const res = await client.post('/notifications/read', { ids })
    return res.data
  },
  async markAllRead() {
    if (USE_MOCK) return { ok: true }
    const res = await client.post('/notifications/read-all')
    return res.data
  },
}
