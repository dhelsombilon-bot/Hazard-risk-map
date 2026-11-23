import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../layouts/AppLayout'

// Each page is its own chunk, downloaded only when first visited (smaller initial load)
const LoginPage = lazy(() => import('../pages/Login'))
const OverviewPage = lazy(() => import('../pages/Overview'))
const BuildingsPage = lazy(() => import('../pages/Buildings'))
const BuildingDetailPage = lazy(() => import('../pages/BuildingDetail'))
const AddBuildingPage = lazy(() => import('../pages/AddBuilding'))
const EditBuildingPage = lazy(() => import('../pages/EditBuilding'))
const PermitsPage = lazy(() => import('../pages/Permits'))
const PermitDetailPage = lazy(() => import('../pages/PermitDetail'))
const MapPage = lazy(() => import('../pages/Map'))
const ReportsPage = lazy(() => import('../pages/Reports'))
const UsersPage = lazy(() => import('../pages/Users'))
const ProfilePage = lazy(() => import('../pages/Profile'))
const NotFoundPage = lazy(() => import('../pages/NotFound'))
const ForbiddenPage = lazy(() => import('../pages/Forbidden'))

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RoleGuard({ roles, children }) {
  const { user } = useAuth()
  if (!roles.includes(user?.role_name)) return <Navigate to="/403" replace />
  return children
}

export default function AppRoutes() {
  return (
    <Suspense fallback={null}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/buildings" element={<BuildingsPage />} />
        <Route path="/buildings/new" element={<AddBuildingPage />} />
        <Route path="/buildings/:id" element={<BuildingDetailPage />} />
        <Route path="/buildings/:id/edit" element={<EditBuildingPage />} />
        <Route path="/permits" element={<PermitsPage />} />
        <Route path="/permits/:id" element={<PermitDetailPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/users" element={
          <RoleGuard roles={['System Administrator']}><UsersPage /></RoleGuard>
        } />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
    </Suspense>
  )
}
