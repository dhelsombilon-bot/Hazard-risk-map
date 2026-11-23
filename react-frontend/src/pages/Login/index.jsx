import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import loginBg from '../../assets/login-bg.jpg'

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid email or password.')
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 bg-navy bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-text-dark/70 via-text-dark/50 to-text-dark/80" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur border border-white/30 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">G</div>
          <h1 className="text-2xl font-bold text-white drop-shadow">GeoPermit</h1>
          <p className="text-xs text-white/80 mt-1 uppercase tracking-wider">Building & Permit Monitoring</p>
          <p className="text-xs text-white/70 mt-0.5">Municipal Engineering Office — Bongabong, Oriental Mindoro</p>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-xl border border-white/40 shadow-2xl p-6">
          <h2 className="text-base font-semibold text-[#0F1E3D] mb-4">Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in…' : 'Log in'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            No public sign-up. Accounts are created by the system administrator.
          </p>
        </div>

        <div className="text-center mt-4 text-xs text-white/75">
          Demo: admin@geopermit.test / personnel@geopermit.test / management@geopermit.test — password: <strong>password</strong>
        </div>
      </div>
    </div>
  )
}
