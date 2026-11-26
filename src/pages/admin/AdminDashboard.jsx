import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, DollarSign, TrendingUp, FileText, Settings, LogOut,
  CheckCircle, XCircle, Clock, AlertCircle, Plus, Edit, Trash2,
  Eye, Download, Filter, ChevronDown, ChevronUp
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate, formatDateTime, truncateAddress } from '../../lib/utils'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'

const AdminDashboard = () => {
  const { profile, signOut, user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInvestments: 0,
    totalEarnings: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0
  })
  const [withdrawals, setWithdrawals] = useState([])
  const [deposits, setDeposits] = useState([])
  const [plans, setPlans] = useState([])
  const [ad, setAd] = useState(null)
  const [withdrawalFilter, setWithdrawalFilter] = useState('pending')
  const [depositFilter, setDepositFilter] = useState('pending')

  // Modals
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [planForm, setPlanForm] = useState({ name: '', min_amount: '', daily_rate: '', duration_days: '', is_active: true })
  const [showAdModal, setShowAdModal] = useState(false)
  const [adForm, setAdForm] = useState({ title: '', description: '', image_url: '', link_url: '', is_active: true })

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/')
      return
    }
    fetchAllData()
  }, [profile, navigate])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [
        usersRes,
        investmentsRes,
        earningsRes,
        depositsRes,
        withdrawalsRes,
        plansRes,
        adRes
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('investments').select('*', { count: 'exact', head: true }),
        supabase.from('earnings').select('amount'),
        supabase.from('deposits').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('plans').select('*').order('min_amount'),
        supabase.from('ads').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1)
      ])

      setStats({
        totalUsers: usersRes.count || 0,
        totalInvestments: investmentsRes.count || 0,
        totalEarnings: (earningsRes.data || []).reduce((sum, e) => sum + (e.amount || 0), 0),
        pendingDeposits: depositsRes.count || 0,
        pendingWithdrawals: withdrawalsRes.count || 0
      })

      if (plansRes.data) setPlans(plansRes.data)
      if (adRes.data?.[0]) setAd(adRes.data[0])

      // Fetch detailed withdrawals and deposits
      fetchWithdrawals()
      fetchDeposits()
    } catch (err) {
      console.error('Error fetching admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchWithdrawals = async () => {
    const { data } = await supabase
      .from('withdrawals')
      .select(`
        *,
        profiles!inner(email, full_name)
      `)
      .eq('status', withdrawalFilter)
      .order('created_at', { ascending: false })
    if (data) setWithdrawals(data)
  }

  const fetchDeposits = async () => {
    const { data } = await supabase
      .from('deposits')
      .select(`
        *,
        profiles!inner(email, full_name)
      `)
      .eq('status', depositFilter)
      .order('created_at', { ascending: false })
    if (data) setDeposits(data)
  }

  const handleWithdrawalAction = async (id, action) => {
    try {
      const withdrawal = withdrawals.find(w => w.id === id)
      if (!withdrawal) return

      if (action === 'approve') {
        const { error } = await supabase
          .from('withdrawals')
          .update({ status: 'approved', processed_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
      } else if (action === 'reject') {
        // Refund the amount to user balance
        const { error: refundError } = await supabase.rpc('refund_withdrawal', {
          p_withdrawal_id: id,
          p_amount: withdrawal.amount
        })
        if (refundError) throw refundError

        const { error } = await supabase
          .from('withdrawals')
          .update({ status: 'rejected', processed_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
      }

      fetchWithdrawals()
      fetchAllData()
    } catch (err) {
      console.error('Error processing withdrawal:', err)
      alert('Failed to process withdrawal')
    }
  }

  const handleDepositAction = async (id, action) => {
    try {
      const deposit = deposits.find(d => d.id === id)
      if (!deposit) return

      if (action === 'confirm') {
        const { error } = await supabase.rpc('confirm_deposit', {
          p_deposit_id: id,
          p_amount: deposit.amount
        })
        if (error) throw error
      } else if (action === 'reject') {
        const { error } = await supabase
          .from('deposits')
          .update({ status: 'rejected', processed_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
      }

      fetchDeposits()
      fetchAllData()
    } catch (err) {
      console.error('Error processing deposit:', err)
      alert('Failed to process deposit')
    }
  }

  const handlePlanSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingPlan) {
        const { error } = await supabase
          .from('plans')
          .update({
            name: planForm.name,
            min_amount: parseFloat(planForm.min_amount),
            daily_rate: parseFloat(planForm.daily_rate),
            duration_days: parseInt(planForm.duration_days),
            is_active: planForm.is_active
          })
          .eq('id', editingPlan.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('plans')
          .insert({
            name: planForm.name,
            min_amount: parseFloat(planForm.min_amount),
            daily_rate: parseFloat(planForm.daily_rate),
            duration_days: parseInt(planForm.duration_days),
            is_active: planForm.is_active
          })
        if (error) throw error
      }
      setShowPlanModal(false)
      setEditingPlan(null)
      setPlanForm({ name: '', min_amount: '', daily_rate: '', duration_days: '', is_active: true })
      fetchAllData()
    } catch (err) {
      console.error('Error saving plan:', err)
      alert('Failed to save plan')
    }
  }

  const handleAdSubmit = async (e) => {
    e.preventDefault()
    try {
      // Deactivate all other ads
      await supabase.from('ads').update({ is_active: false }).neq('id', '0')

      if (ad) {
        const { error } = await supabase
          .from('ads')
          .update({
            title: adForm.title,
            description: adForm.description,
            image_url: adForm.image_url,
            link_url: adForm.link_url,
            is_active: adForm.is_active
          })
          .eq('id', ad.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('ads')
          .insert({
            title: adForm.title,
            description: adForm.description,
            image_url: adForm.image_url,
            link_url: adForm.link_url,
            is_active: adForm.is_active
          })
        if (error) throw error
      }
      setShowAdModal(false)
      setAdForm({ title: '', description: '', image_url: '', link_url: '', is_active: true })
      fetchAllData()
    } catch (err) {
      console.error('Error saving ad:', err)
      alert('Failed to save ad')
    }
  }

  const togglePlanStatus = async (plan) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id)
      if (error) throw error
      fetchAllData()
    } catch (err) {
      console.error('Error toggling plan:', err)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign },
    { id: 'deposits', label: 'Deposits', icon: DollarSign },
    { id: 'plans', label: 'Plans', icon: Settings },
    { id: 'ad', label: 'Neero Card', icon: FileText }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate('/login'))}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200">
          <nav className="max-w-7xl mx-auto px-4" aria-label="Admin tabs">
            <ul className="flex overflow-x-auto gap-1 pb-4" role="tablist">
              {tabs.map((tab) => (
                <li key={tab.id} role="presentation">
                  <button
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-6 animate-pulse-soft">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200" />
              ))}
            </div>
            <div className="h-64 bg-white rounded-2xl border border-slate-200" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card padding="lg" className="text-center">
                    <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-slate-900">{stats.totalUsers.toLocaleString()}</p>
                    <p className="text-sm text-slate-500">Total Users</p>
                  </Card>
                  <Card padding="lg" className="text-center">
                    <TrendingUp className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-slate-900">{stats.totalInvestments.toLocaleString()}</p>
                    <p className="text-sm text-slate-500">Total Investments</p>
                  </Card>
                  <Card padding="lg" className="text-center">
                    <DollarSign className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-slate-900">{formatCurrency(stats.totalEarnings)}</p>
                    <p className="text-sm text-slate-500">Total Earnings Paid</p>
                  </Card>
                  <Card padding="lg" className="text-center">
                    <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-slate-900">{stats.pendingDeposits}</p>
                    <p className="text-sm text-slate-500">Pending Deposits</p>
                  </Card>
                  <Card padding="lg" className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-slate-900">{stats.pendingWithdrawals}</p>
                    <p className="text-sm text-slate-500">Pending Withdrawals</p>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card padding="lg">
                    <h3 className="font-semibold text-slate-900 mb-4">Recent Withdrawals</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {withdrawals.slice(0, 5).map((w) => (
                        <div key={w.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-sm">{w.profiles?.full_name || w.profiles?.email}</p>
                            <p className="text-xs text-slate-500">{formatCurrency(w.amount)} • {w.network}</p>
                          </div>
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">Pending</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card padding="lg">
                    <h3 className="font-semibold text-slate-900 mb-4">Recent Deposits</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {deposits.slice(0, 5).map((d) => (
                        <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <div>
                            <p className="font-medium text-sm">{d.profiles?.full_name || d.profiles?.email}</p>
                            <p className="text-xs text-slate-500">{formatCurrency(d.amount)} • {d.network}</p>
                          </div>
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">Pending</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Withdrawals Tab */}
            {activeTab === 'withdrawals' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {['pending', 'approved', 'rejected'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setWithdrawalFilter(status)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        withdrawalFilter === status
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-white text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
                <Card padding="none">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">User</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Amount</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Fee</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Net</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Address</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Network</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Date</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Status</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.map((w) => (
                          <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-4">
                              <p className="font-medium">{w.profiles?.full_name || 'User'}</p>
                              <p className="text-sm text-slate-500">{w.profiles?.email}</p>
                            </td>
                            <td className="p-4 font-medium">{formatCurrency(w.amount)}</td>
                            <td className="p-4 text-red-600">-{formatCurrency(w.fee)}</td>
                            <td className="p-4 font-medium text-primary-600">{formatCurrency(w.net_amount)}</td>
                            <td className="p-4">
                              <span className="font-mono text-sm">{truncateAddress(w.address)}</span>
                            </td>
                            <td className="p-4 text-sm">{w.network}</td>
                            <td className="p-4 text-sm text-slate-500">{formatDateTime(w.created_at)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                w.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                w.status === 'approved' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {w.status}
                              </span>
                            </td>
                            <td className="p-4">
                              {w.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleWithdrawalAction(w.id, 'approve')}
                                    className="py-1.5 px-3"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleWithdrawalAction(w.id, 'reject')}
                                    className="py-1.5 px-3"
                                  >
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {withdrawals.length === 0 && (
                          <tr>
                            <td colSpan={9} className="p-8 text-center text-slate-500">
                              No {withdrawalFilter} withdrawals found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* Deposits Tab */}
            {activeTab === 'deposits' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {['pending', 'confirmed', 'rejected'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setDepositFilter(status)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        depositFilter === status
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-white text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
                <Card padding="none">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">User</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Amount</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Network</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">TX Hash</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Date</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Status</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deposits.map((d) => (
                          <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-4">
                              <p className="font-medium">{d.profiles?.full_name || 'User'}</p>
                              <p className="text-sm text-slate-500">{d.profiles?.email}</p>
                            </td>
                            <td className="p-4 font-medium">{formatCurrency(d.amount)}</td>
                            <td className="p-4 text-sm">{d.network}</td>
                            <td className="p-4">
                              <span className="font-mono text-sm truncate max-w-[200px] block">{d.tx_hash}</span>
                            </td>
                            <td className="p-4 text-sm text-slate-500">{formatDateTime(d.created_at)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                d.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                d.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {d.status}
                              </span>
                            </td>
                            <td className="p-4">
                              {d.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleDepositAction(d.id, 'confirm')}
                                    className="py-1.5 px-3"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDepositAction(d.id, 'reject')}
                                    className="py-1.5 px-3"
                                  >
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {deposits.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-500">
                              No {depositFilter} deposits found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* Plans Tab */}
            {activeTab === 'plans' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Mining Plans</h2>
                  <Button onClick={() => { setEditingPlan(null); setPlanForm({ name: '', min_amount: '', daily_rate: '', duration_days: '', is_active: true }); setShowPlanModal(true) }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Plan
                  </Button>
                </div>
                <Card padding="none">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Name</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Min Amount</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Daily Rate</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Duration</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Status</th>
                          <th className="text-left p-4 font-medium text-slate-500 text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plans.map((plan) => (
                          <tr key={plan.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-4 font-medium">{plan.name}</td>
                            <td className="p-4">{formatCurrency(plan.min_amount)}</td>
                            <td className="p-4">{plan.daily_rate}%</td>
                            <td className="p-4">{plan.duration_days} days</td>
                            <td className="p-4">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={plan.is_active}
                                  onChange={() => togglePlanStatus(plan)}
                                  className="sr-only peer"
                                />
                                <div className={`w-11 h-6 rounded-full peer-focus:ring-2 peer-focus:ring-primary-500 transition-colors ${
                                  plan.is_active ? 'bg-primary-600' : 'bg-slate-300'
                                }`}></div>
                                <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                  plan.is_active ? 'translate-x-5' : 'translate-x-0'
                                }`}></div>
                              </label>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => {
                                  setEditingPlan(plan)
                                  setPlanForm({
                                    name: plan.name,
                                    min_amount: plan.min_amount,
                                    daily_rate: plan.daily_rate,
                                    duration_days: plan.duration_days,
                                    is_active: plan.is_active
                                  })
                                  setShowPlanModal(true)
                                }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* Ad/Neero Card Tab */}
            {activeTab === 'ad' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Neero Advertisement Card</h2>
                  <Button onClick={() => { setAdForm({ title: '', description: '', image_url: '', link_url: '', is_active: true }); setShowAdModal(true) }}>
                    <Plus className="w-4 h-4 mr-2" />
                    {ad ? 'Edit' : 'Create'} Card
                  </Button>
                </div>

                {ad ? (
                  <Card padding="lg">
                    <div className="border rounded-xl overflow-hidden bg-white">
                      <div className="aspect-video bg-slate-100 relative">
                        {ad.image_url && (
                          <img src={ad.image_url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-900">{ad.title}</h3>
                        <p className="text-slate-500 text-sm mt-1">{ad.description}</p>
                        <p className="text-xs text-slate-400 mt-2">Link: {ad.link_url}</p>
                        <div className="flex items-center gap-2 mt-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            ad.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {ad.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card padding="lg" className="text-center">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No Neero Card configured</h3>
                    <p className="text-slate-500 mt-1">Create a card to display promotions on the home screen</p>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {/* Plan Modal */}
        <Modal
          isOpen={showPlanModal}
          onClose={() => { setShowPlanModal(false); setEditingPlan(null); setPlanForm({ name: '', min_amount: '', daily_rate: '', duration_days: '', is_active: true }) }}
          title={editingPlan ? 'Edit Plan' : 'Add New Plan'}
          size="md"
        >
          <form onSubmit={handlePlanSubmit} className="space-y-4">
            <Input label="Plan Name" value={planForm.name} onChange={(e) => setPlanForm({...planForm, name: e.target.value})} placeholder="e.g. Gold Plan" required />
            <Input label="Min Amount (USDT)" type="number" step="0.01" value={planForm.min_amount} onChange={(e) => setPlanForm({...planForm, min_amount: e.target.value})} placeholder="100" required />
            <Input label="Daily Rate (%)" type="number" step="0.01" value={planForm.daily_rate} onChange={(e) => setPlanForm({...planForm, daily_rate: e.target.value})} placeholder="2.5" required />
            <Input label="Duration (Days)" type="number" value={planForm.duration_days} onChange={(e) => setPlanForm({...planForm, duration_days: e.target.value})} placeholder="30" required />
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={planForm.is_active} onChange={(e) => setPlanForm({...planForm, is_active: e.target.checked})} className="w-4 h-4 text-primary-600 rounded border-slate-300" />
              <label htmlFor="is_active" className="text-sm text-slate-700">Active</label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setShowPlanModal(false)} fullWidth>Cancel</Button>
              <Button type="submit" fullWidth>{editingPlan ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </Modal>

        {/* Ad Modal */}
        <Modal
          isOpen={showAdModal}
          onClose={() => { setShowAdModal(false); setAdForm({ title: '', description: '', image_url: '', link_url: '', is_active: true }) }}
          title={ad ? 'Edit Neero Card' : 'Create Neero Card'}
          size="md"
        >
          <form onSubmit={handleAdSubmit} className="space-y-4">
            <Input label="Title" value={adForm.title} onChange={(e) => setAdForm({...adForm, title: e.target.value})} placeholder="Special Offer" required />
            <Input label="Description" value={adForm.description} onChange={(e) => setAdForm({...adForm, description: e.target.value})} placeholder="Limited time mining bonus" required />
            <Input label="Image URL" value={adForm.image_url} onChange={(e) => setAdForm({...adForm, image_url: e.target.value})} placeholder="https://example.com/image.jpg" required />
            <Input label="Link URL" value={adForm.link_url} onChange={(e) => setAdForm({...adForm, link_url: e.target.value})} placeholder="https://example.com/offer" required />
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ad_is_active" checked={adForm.is_active} onChange={(e) => setAdForm({...adForm, is_active: e.target.checked})} className="w-4 h-4 text-primary-600 rounded border-slate-300" />
              <label htmlFor="ad_is_active" className="text-sm text-slate-700">Active</label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setShowAdModal(false)} fullWidth>Cancel</Button>
              <Button type="submit" fullWidth>{ad ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  )
}

export default AdminDashboard
