import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ToastHost from './components/ToastHost'
import { AuthProvider, useAuth } from './store/auth.jsx'
import { ThemeProvider } from './store/theme.jsx'
import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './router/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import StudentHome from './pages/student/StudentHome'
import RequestGatepass from './pages/student/RequestGatepass'
import History from './pages/student/History'
import AdminHome from './pages/admin/AdminHome'
import Requests from './pages/admin/Requests'
import Analytics from './pages/admin/Analytics'
import Notifications from './pages/admin/Notifications'
import SecurityHome from './pages/security/SecurityHome'
import Verify from './pages/security/Verify'
import Logs from './pages/security/Logs'
import { useRealtimeNotifications } from './realtime/useRealtimeNotifications'

function AppRoutes() {
  const location = useLocation()
  const { user } = useAuth()
  useRealtimeNotifications()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              user?.role === 'admin' ? (
                <Navigate to="/app/admin" replace />
              ) : user?.role === 'security' ? (
                <Navigate to="/app/security" replace />
              ) : (
                <Navigate to="/app/student" replace />
              )
            }
          />

          <Route
            path="student"
            element={
              <ProtectedRoute allowRoles={['student']}>
                <StudentHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="student/request"
            element={
              <ProtectedRoute allowRoles={['student']}>
                <RequestGatepass />
              </ProtectedRoute>
            }
          />
          <Route
            path="student/history"
            element={
              <ProtectedRoute allowRoles={['student']}>
                <History />
              </ProtectedRoute>
            }
          />

          <Route
            path="admin"
            element={
              <ProtectedRoute allowRoles={['admin']}>
                <AdminHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/requests"
            element={
              <ProtectedRoute allowRoles={['admin']}>
                <Requests />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/analytics"
            element={
              <ProtectedRoute allowRoles={['admin']}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/notifications"
            element={
              <ProtectedRoute allowRoles={['admin']}>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="security"
            element={
              <ProtectedRoute allowRoles={['security']}>
                <SecurityHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="security/verify"
            element={
              <ProtectedRoute allowRoles={['security']}>
                <Verify />
              </ProtectedRoute>
            }
          />
          <Route
            path="security/logs"
            element={
              <ProtectedRoute allowRoles={['security']}>
                <Logs />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ToastHost />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
