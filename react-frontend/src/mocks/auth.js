export const mockUsers = [
  { user_id: 1, role_id: 1, role_name: 'System Administrator', first_name: 'Admin', last_name: 'User', email: 'admin@geopermit.test', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { user_id: 2, role_id: 2, role_name: 'MEO Personnel', first_name: 'Personnel', last_name: 'One', email: 'personnel@geopermit.test', is_active: true, created_at: '2024-01-05T00:00:00Z', updated_at: '2024-01-05T00:00:00Z' },
  { user_id: 3, role_id: 3, role_name: 'MEO Management', first_name: 'Management', last_name: 'User', email: 'management@geopermit.test', is_active: true, created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { user_id: 4, role_id: 2, role_name: 'MEO Personnel', first_name: 'Maria', last_name: 'Santos', email: 'msantos@geopermit.test', is_active: true, created_at: '2024-02-01T00:00:00Z', updated_at: '2024-02-01T00:00:00Z' },
  { user_id: 5, role_id: 2, role_name: 'MEO Personnel', first_name: 'Juan', last_name: 'Dela Cruz', email: 'jdelacruz@geopermit.test', is_active: false, created_at: '2024-03-01T00:00:00Z', updated_at: '2024-06-01T00:00:00Z' },
]

export const MOCK_CREDENTIALS = {
  'admin@geopermit.test': { password: 'password', user_id: 1 },
  'personnel@geopermit.test': { password: 'password', user_id: 2 },
  'management@geopermit.test': { password: 'password', user_id: 3 },
}
