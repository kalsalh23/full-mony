import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, TrendingUp, Clock, Shield, ExternalLink, ChevronRight } from 'lucide-react'
import { useAuth } from '\.\./contexts/AuthContext'
import { supabase } from '\.\./lib/supabase'
import { formatCurrency, formatPercent } from '\.\./lib/utils'
import Button from '\.\./components/ui/Button'
import { Card } from '\.\./components/ui/Card'

const Home = () => {
  const { profile, refreshProfile } = useAuth()
  const [plans, setPlans] = useState([])
  const [ad, setAd] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, adRes] = await Promise.all([
          supabase.from('plans').select('*').eq('is_active', true).order('min_amount'),
          supabase.from('ads').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1)
        ])

        if (plansRes.data) setPlans(plansRes.data)
        if (adRes.data?.[0]) setAd(adRes.data[0])
      } catch (err) {
        console.error('Error fetching home data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (profile) {
      refreshProfile()
    }
  }, [profile, refreshProfile])

  const formatPlanDuration = (days) => {
    if (days >= 365) return `${days / 365} year${days > 365 ? 's' : ''}`
    if (days >= 30) return `${days / 30} month${days > 30 ? 's' : ''}`
    return `${days} day${days > 1 ? 's' : ''}`
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="space-y-4 animate-pulse-soft">
          <div className="h-40 bg-slate-100 rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-slate-100 rounded-2xl" />
            <div className="h-32 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container pb-28 space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary-600 to-primary-700 text-white overflow-hidden relative" padding="none">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-primary-100 text-sm font-medium">Total Balance</span>
            <span className="text-primary-200 text-xs">Available</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold">{formatCurrency(profile?.balance || 0)}</span>
            <span className="text-primary-200">USDT</span>
          </div>
          <div className="flex items-center gap-4 text-primary-200 text-sm">
            <Link to="/deposit" className="flex items-center gap-1 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Deposit
            </Link>
            <Link to="/withdraw" className="flex items-center gap-1 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a2 2 0 002-2V6a2 2 0 00-2-2H3a2 2 0 00-2 2v2a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10V6a2 2 0 00-2-2v0a2 2 0 002 2m4 0V6a2 2 0 002-2v0a2 2 0 00-2 2" /></svg>
              Withdraw
            </Link>
          </div>
        </div>
      </Card>

      {/* Neero Ad Card */}
      {ad && (
        <Link to={ad.link_url} target={ad.link_url.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="block">
          <Card className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:shadow-lg transition-shadow" padding="none">
            <div className="absolute inset-0 bg-[url({ad.image_url})] bg-cover bg-center opacity-10" />
            <div className="relative p-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-600/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{ad.title}</h3>
                <p className="text-slate-300 text-sm mt-1 line-clamp-2">{ad.description}</p>
              </div>
              <ExternalLink className="w-5 h-5 text-slate-400" />
            </div>
          </Card>
        </Link>
      )}

      {/* Mining Plans Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Mining Plans</h2>
          <Link to="/invest" className="text-sm text-primary-600 font-medium flex items-center gap-1 hover:underline">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {plans.length === 0 ? (
          <Card className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No mining plans available at the moment</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {plans.slice(0, 4).map((plan) => (
              <Link key={plan.id} to={`/invest/${plan.id}`} className="block">
                <Card className="hover:shadow-card-hover transition-shadow h-full" padding="md">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{formatPlanDuration(plan.duration_days)}</p>
                    </div>
                    <span className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                      {formatPercent(plan.daily_rate)}/day
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-bold text-slate-900">{formatCurrency(plan.min_amount)}</span>
                    <span className="text-slate-500 text-sm">min deposit</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {plan.duration_days} days
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Principal returned
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-4" padding="none">
          <Shield className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-900">Secure</p>
          <p className="text-xs text-slate-500">Bank-level security</p>
        </Card>
        <Card className="text-center py-4" padding="none">
          <Clock className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-900">Daily Payouts</p>
          <p className="text-xs text-slate-500">Automatic earnings</p>
        </Card>
        <Card className="text-center py-4" padding="none">
          <TrendingUp className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-900">Growing</p>
          <p className="text-xs text-slate-500">Compound returns</p>
        </Card>
      </div>
    </div>
  )
}

export default Home
