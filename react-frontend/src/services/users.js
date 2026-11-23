import client from '../api/client'
import { delay } from '../mocks/delay'
import { mockUsers } from '../mocks/auth'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const userService = {
  async list() {
    if (USE_MOCK) { await delay(); return mockUsers }
    const res = await client.get('/users')
    return res.data
  },
  async create(data) {
    if (USE_MOCK) {
      await delay(600)
      const newU = { ...data, user_id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      mockUsers.push(newU)
      return newU
    }
    const res = await client.post('/users', data)
    return res.data
  },
  async update(id, data) {
    if (USE_MOCK) {
      await delay(600)
      const idx = mockUsers.findIndex(u => u.user_id === Number(id))
      if (idx >= 0) mockUsers[idx] = { ...mockUsers[idx], ...data, updated_at: new Date().toISOString() }
      return mockUsers[idx]
    }
    const res = await client.put(`/users/${id}`, data)
    return res.data
  },
  async deactivate(id) {
    if (USE_MOCK) {
      await delay(400)
      const idx = mockUsers.findIndex(u => u.user_id === Number(id))
      if (idx >= 0) mockUsers[idx].is_active = false
      return mockUsers[idx]
    }
    const res = await client.put(`/users/${id}`, { is_active: false })
    return res.data
  },
}
