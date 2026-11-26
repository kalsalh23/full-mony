import { useState, useEffect } from 'react'
import { DollarSign, Calendar, TrendingUp, Download } from 'lucide-react'
import { useAuth } from '\.\./contexts/AuthContext'
import { supabase } from '\.\./lib/supabase'
import { formatCurrency, formatDate, formatNumber } from '\.\./lib/utils'
import { Card } from '\.\./components/ui/Card'

const Earnings = () => {
  const { profile, refreshProfile } = useAuth()
  const [earnings, setEarnings] = useState([])
  const [stats, setStats] = useState({
    today: 0,
    total: 0,
    activeInvestments: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, today, week, month

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!profile) return

      try {
        // Fetch earnings
        const { data: earningsData, error: earningsError } = await supabase
          .from('earnings')
          .select(`
            *,
            investments!inner(plan_id, plans(name))
          `)
          .eq('user_id', profile.id)
          .order('date', { ascending: false })

        if (earningsError) throw earningsError

        setEarnings(earningsData || [])

        // Calculate stats
        const today = new Date().toISOString().split('T')[0]
        const todayEarnings = (earningsData || [])
          .filter(e => e.date === today)
          .reduce((sum, e) => sum + (e.amount || 0), 0)

        const totalEarnings = (earningsData || [])
          .reduce((sum, e) => sum + (e.amount || 0), 0)

        // Fetch active investments count
        const { count } = await supabase
          .from('investments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('status', 'active')

        setStats({
          today: todayEarnings,
          total: totalEarnings,
          activeInvestments: count || 0
        })
      } catch (err) {
        console.error('Error fetching earnings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEarnings()
  }, [profile])

  useEffect(() => {
    if (profile) {
      refreshProfile()
    }
  }, [profile, refreshProfile])

  const filteredEarnings = earnings.filter(e => {
    if (filter === 'all') return true
    const date = new Date(e.date)
    const now = new Date()
    if (filter === 'today') return e.date === now.toISOString().split('T')[0]
    if (filter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return date >= weekAgo
    }
    if (filter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return date >= monthAgo
    }
    return true
  })

  if (loading) {
    return (
      <div className="page-container">
        <div className="space-y-4 animate-pulse-soft">
          <div className="grid grid-cols-3 gap-3">
            <div className="h-24 bg-slate-100 rounded-2xl" />
            <div className="h-24 bg-slate-100 rounded-2xl" />
            <div className="h-24 bg-slate-100 rounded-2xl" />
          </div>
          <div className="h-40 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="page-container pb-28 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="section-title">Earnings</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="md" className="text-center">
          <DollarSign className="w-6 h-6 text-primary-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.today)}</p>
          <p className="text-xs text-slate-500">Today</p>
        </Card>
        <Card padding="md" className="text-center">
          <TrendingUp className="w-6 h-6 text-primary-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.total)}</p>
          <p className="text-xs text-slate-500">Total Earned</p>
        </Card>
        <Card padding="md" className="text-center">
          <Calendar className="w-6 h-6 text-primary-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900">{stats.activeInvestments}</p>
          <p className="text-xs text-slate-500">Active Plans</p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
        {['all', 'today', 'week', 'month'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Earnings History */}
      <Card padding="none">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Earnings History</h3>
        </div>

        {filteredEarnings.length === 0 ? (
          <div className="card-body text-center py-12">
            <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No earnings recorded yet</p>
            <p className="text-sm text-slate-400 mt-1">Start investing to earn daily returns</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEarnings.map((earning) => (
              <div key={earning.id} className="card-body flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {earning.investments?.plans?.name || 'Investment'}
                    </p>
                    <p className="text-sm text-slate-500">{formatDate(earning.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary-600">+{formatCurrency(earning.amount)}</p>
                  <p className="text-xs text-slate-500">USDT</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default Earnings
