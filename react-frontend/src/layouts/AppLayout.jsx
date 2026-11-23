import { Suspense, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { initials } from '../utils/formatters'
import Modal from '../components/ui/Modal'
import NotificationBell from '../components/NotificationBell'
import {
  LayoutDashboard, Building2, FileText, Map, BarChart2, Users,
  ChevronDown, Menu, X, LogOut, User,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/buildings', label: 'Building Inventory', icon: Building2 },
  { to: '/permits', label: 'Permit Monitoring', icon: FileText },
  { to: '/map', label: 'Hazard Risk Map', icon: Map },
  { to: '/reports', label: 'Reports', icon: BarChart2 },
]

function LogoutModal({ open, onClose }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await logout()
      navigate('/login')
    } finally {
      setLoading(false)
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title="Confirm Logout" size="sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
          <LogOut size={18} className="text-red-600" />
        </div>
        <p className="text-sm text-gray-600 pt-2">
          Are you sure you want to log out of GeoPermit?
        </p>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Logging out…' : 'Logout'}
        </button>
      </div>
    </Modal>
  )
}

function Sidebar({ collapsed, onClose, onLogout }) {
  const { user, isAdmin } = useAuth()

  return (
    <aside
      style={{ backgroundColor: '#14254A' }}
      className={`flex flex-col h-full ${collapsed ? 'w-16' : 'w-56'} transition-all duration-200`}
    >
      <div className="flex items-center gap-2 px-4 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">G</div>
        {!collapsed && (
          <div>
            <div className="text-white font-bold text-sm leading-tight">GeoPermit</div>
            <div className="text-blue-300 text-[9px] uppercase tracking-wider leading-tight">Building & Permit Monitoring</div>
          </div>
        )}
        {onClose && (
          <button onClick={onClose} className="ml-auto text-white/60 hover:text-white lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-[#1E3A6B] text-white'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/users"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                isActive ? 'bg-[#1E3A6B] text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Users size={18} className="flex-shrink-0" />
            {!collapsed && <span>User Management</span>}
          </NavLink>
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        {!collapsed && (
          <div className="text-blue-300 text-[9px] uppercase tracking-wider px-1 mb-3">
            Municipal Engineering Office<br />Bongabong, Oriental Mindoro
          </div>
        )}
        <div className="flex items-center gap-2 px-1">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials(`${user?.first_name} ${user?.last_name}`)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{user?.first_name} {user?.last_name}</div>
              <div className="text-blue-300 text-[10px] truncate">{user?.role_name}</div>
              <div className="text-blue-400 text-[9px]">Authorized account</div>
            </div>
          )}
          <button onClick={onLogout} className="text-white/50 hover:text-white ml-auto" title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function PageHeader({ onLogout }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const breadcrumb = () => {
    const parts = location.pathname.split('/').filter(Boolean)
    if (!parts.length) return 'Overview'
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ')
  }

  const pageTitle = () => {
    const map = {
      '/': 'Overview',
      '/buildings': 'Building Inventory',
      '/permits': 'Permit Monitoring',
      '/map': 'Hazard Risk Map',
      '/reports': 'Reports',
      '/users': 'User Management',
      '/profile': 'My Profile',
    }
    return map[location.pathname] || breadcrumb()
  }

  const pageDesc = () => {
    const map = {
      '/': 'Summary of public buildings, permit records, and hazard exposure across Bongabong.',
      '/buildings': 'Public buildings owned or managed by the government, grouped by barangay.',
      '/permits': 'Building permit records on file. GeoPermit monitors records only; it does not issue permits.',
      '/map': 'Geospatial view of public buildings and natural hazard areas in Bongabong.',
      '/reports': 'Generate and download inventory, compliance, and hazard exposure reports.',
      '/users': 'Manage system user accounts and roles.',
      '/profile': 'Your account details and password.',
    }
    return map[location.pathname] || ''
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-400 mb-0.5">GeoPermit / {breadcrumb()}</div>
          <h1 className="text-xl font-bold text-[#0F1E3D]">{pageTitle()}</h1>
          {pageDesc() && <p className="text-xs text-gray-500 mt-0.5">{pageDesc()}</p>}
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {initials(`${user?.first_name} ${user?.last_name}`)}
              </div>
              <ChevronDown size={14} className="text-gray-500" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => { navigate('/profile'); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User size={14} /> Profile
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => { setMenuOpen(false); onLogout() }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  const openLogout = () => {
    setSidebarOpen(false)
    setLogoutOpen(true)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar onLogout={openLogout} />
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-56 flex">
            <Sidebar onClose={() => setSidebarOpen(false)} onLogout={openLogout} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header bar */}
        <div className="flex items-center px-4 py-3 bg-white border-b border-gray-200 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-500 hover:text-gray-700">
            <Menu size={20} />
          </button>
          <span className="ml-2 font-bold text-[#14254A] text-sm">GeoPermit</span>
        </div>

        <PageHeader onLogout={openLogout} />

        <main className="flex-1 overflow-y-auto p-6 bg-[#F3F6FA] isolate">
          {/* Pages are lazy-loaded; keep the layout on screen while a page's code downloads */}
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <LogoutModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </div>
  )
}
