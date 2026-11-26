import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Shield, LogOut, Settings, Bell, FileText, HelpCircle, ChevronRight } from 'lucide-react'
import { useAuth } from '\.\./contexts/AuthContext'
import { supabase } from '\.\./lib/supabase'
import { formatCurrency, formatDate } from '\.\./lib/utils'
import Button from '\.\./components/ui/Button'
import { Card } from '\.\./components/ui/Card'
import Modal from '\.\./components/ui/Modal'

const Account = () => {
  const { user, profile, signOut, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showLogout, setShowLogout] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    const { error } = await signOut()
    if (!error) {
      navigate('/login', { replace: true })
    }
    setLoading(false)
    setShowLogout(false)
  }

  const menuItems = [
    { icon: User, label: 'Profile', path: '/account/profile' },
    { icon: Bell, label: 'Notifications', path: '/account/notifications' },
    { icon: Shield, label: 'Security', path: '/account/security' },
    { icon: FileText, label: 'Policies', path: '/account/policies' },
    { icon: HelpCircle, label: 'Help & Support', path: '/account/help' },
  ]

  return (
    <div className="page-container pb-28 space-y-6">
      <h1 className="section-title">Account</h1>

      {/* Profile Header */}
      <Card padding="md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-slate-900 truncate">
              {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            <p className="text-xs text-slate-400 mt-1">
              Member since {formatDate(profile?.created_at || user?.created_at, { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </Card>

      {/* Balance Card */}
      <Card padding="md" className="bg-gradient-to-r from-slate-900 to-slate-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full blur-2xl -translate-x-1/4 translate-y-1/4" />
        <div className="relative">
          <p className="text-slate-300 text-sm font-medium">Total Balance</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(profile?.balance || 0)}</p>
          <p className="text-slate-400 text-sm mt-1">USDT</p>
          <div className="flex gap-3 mt-4">
            <Link to="/deposit" className="flex-1 py-2 px-4 bg-white/10 rounded-xl text-center text-sm font-medium hover:bg-white/20 transition-colors">
              Deposit
            </Link>
            <Link to="/withdraw" className="flex-1 py-2 px-4 bg-primary-600 rounded-xl text-center text-sm font-medium hover:bg-primary-700 transition-colors">
              Withdraw
            </Link>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/invest" className="card p-4 text-center hover:shadow-card-hover transition-shadow block">
          <p className="text-2xl font-bold text-slate-900">--</p>
          <p className="text-xs text-slate-500">Active Investments</p>
        </Link>
        <Link to="/earnings" className="card p-4 text-center hover:shadow-card-hover transition-shadow block">
          <p className="text-2xl font-bold text-primary-600">{formatCurrency(0)}</p>
          <p className="text-xs text-slate-500">Total Earnings</p>
        </Link>
        <Link to="/earnings" className="card p-4 text-center hover:shadow-card-hover transition-shadow block">
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(0)}</p>
          <p className="text-xs text-slate-500">Today's Earnings</p>
        </Link>
      </div>

      {/* Menu Items */}
      <Card padding="none">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <item.icon className="w-5 h-5 text-slate-600" />
            </div>
            <span className="font-medium text-slate-900 flex-1">{item.label}</span>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>
        ))}
      </Card>

      {/* Danger Zone */}
      <Card padding="md" className="border-red-100">
        <h3 className="font-semibold text-red-600 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Danger Zone
        </h3>
        <Button
          variant="danger"
          onClick={() => setShowLogout(true)}
          loading={loading}
          fullWidth
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </Card>

      {/* App Info */}
      <div className="text-center text-xs text-slate-400">
        <p>Monus v1.0.0</p>
        <p>Secure Cloud Mining Platform</p>
      </div>

      {/* Logout Modal */}
      <Modal
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        title="Log Out"
        size="sm"
      >
        <p className="text-slate-600 mb-6">Are you sure you want to log out?</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowLogout(false)} fullWidth>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLogout} loading={loading} fullWidth>
            Log Out
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default Account
