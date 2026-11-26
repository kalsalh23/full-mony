import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Home from './pages/Home'
import Invest from './pages/Invest'
import Earnings from './pages/Earnings'
import Deposit from './pages/Deposit'
import Withdraw from './pages/Withdraw'
import Account from './pages/Account'
import Policies from './pages/Policies'
import PolicyDetail from './pages/PolicyDetail'
import AdminDashboard from './pages/admin/AdminDashboard'
import SupabaseSetup from './pages/SupabaseSetup'
import { isSupabaseConfigured } from './lib/supabase'

function AppRoutes() {
  const { supabaseReady, initialized } = useAuth()

  if (!initialized) {
    return null
  }

  if (!isSupabaseConfigured || !supabaseReady) {
    return <Route path="*" element={<SupabaseSetup />} />
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Home />} />
        <Route path="/invest" element={<Invest />} />
        <Route path="/invest/:id" element={<Invest />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/account" element={<Account />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/policies/:slug" element={<PolicyDetail />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}