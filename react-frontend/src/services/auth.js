import client from '../api/client'
import { delay } from '../mocks/delay'
import { mockUsers, MOCK_CREDENTIALS } from '../mocks/auth'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const authService = {
  async login(email, password) {
    if (USE_MOCK) {
      await delay(600)
      const cred = MOCK_CREDENTIALS[email]
      if (!cred || cred.password !== password) throw { response: { data: { message: 'Invalid credentials.' }, status: 401 } }
      const user = mockUsers.find(u => u.user_id === cred.user_id)
      return { token: `mock-token-${user.user_id}`, user }
    }
    const res = await client.post('/login', { email, password })
    return res.data
  },
  async logout() {
    if (USE_MOCK) { await delay(200); return }
    await client.post('/logout')
  },
  async me() {
    if (USE_MOCK) { await delay(200); return null }
    const res = await client.get('/me')
    return res.data
  },
}
