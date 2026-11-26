import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, Shield, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useAuth } from '\.\./contexts/AuthContext'
import { supabase } from '\.\./lib/supabase'
import { formatCurrency, formatPercent, validateAmount } from '\.\./lib/utils'
import Button from '\.\./components/ui/Button'
import Input from '\.\./components/ui/Input'
import { Card } from '\.\./components/ui/Card'
import Modal from '\.\./components/ui/Modal'

const Invest = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [investing, setInvesting] = useState(false)

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('min_amount')

      if (data) setPlans(data)
      if (error) console.error('Error fetching plans:', error)
    }
    fetchPlans()
  }, [])

  useEffect(() => {
    if (id) {
      const plan = plans.find(p => p.id === id)
      if (plan) setSelectedPlan(plan)
    }
  }, [id, plans])

  const selected = selectedPlan || plans[0]

  const handleInvest = async () => {
    if (!selected) return

    const amountNum = parseFloat(amount)
    if (!validateAmount(amount, selected.min_amount)) {
      setError(`Minimum investment is ${formatCurrency(selected.min_amount)}`)
      return
    }

    if (!profile || (profile.balance || 0) < amountNum) {
      setError('Insufficient balance')
      return
    }

    setShowConfirm(true)
  }

  const confirmInvest = async () => {
    if (!selected) return

    setInvesting(true)
    setError('')

    const amountNum = parseFloat(amount)

    try {
      const { error } = await supabase.rpc('create_investment', {
        p_user_id: profile.id,
        p_plan_id: selected.id,
        p_amount: amountNum
      })

      if (error) throw error

      setSuccess(true)
      setAmount('')
      await refreshProfile()
      setTimeout(() => {
        setSuccess(false)
        setShowConfirm(false)
        navigate('/earnings')
      }, 2000)
    } catch (err) {
      setError(err.message || 'Investment failed')
    } finally {
      setInvesting(false)
    }
  }

  const dailyEarning = selected ? (parseFloat(amount || 0) * selected.daily_rate) / 100 : 0
  const totalReturn = selected ? dailyEarning * selected.duration_days : 0

  return (
    <div className="page-container pb-28 space-y-6">
      <div>
        <h1 className="section-title">Investment Plans</h1>
        <p className="text-slate-500 text-sm">Choose a plan that fits your goals</p>
      </div>

      {/* Plans List */}
      <div className="space-y-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan)}
            className={`w-full card p-4 text-left transition-all duration-200 ${
              selectedPlan?.id === plan.id
                ? 'border-primary-300 bg-primary-50 shadow-card-hover'
                : 'hover:border-primary-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedPlan?.id === plan.id
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                  <p className="text-sm text-slate-500">
                    {formatPercent(plan.daily_rate)} daily • {plan.duration_days} days
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-slate-900">
                {formatCurrency(plan.min_amount)}+
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Plan Details */}
      {selected && (
        <Card padding="md">
          <h3 className="font-semibold text-slate-900 mb-4">{selected.name} Plan Details</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-slate-900">{formatPercent(selected.daily_rate)}</p>
              <p className="text-xs text-slate-500">Daily Rate</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-slate-900">{selected.duration_days}</p>
              <p className="text-xs text-slate-500">Days</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-slate-900">{formatPercent(selected.daily_rate * selected.duration_days)}</p>
              <p className="text-xs text-slate-500">Total Return</p>
            </div>
          </div>

          <Input
            label="Investment Amount (USDT)"
            type="number"
            step="0.01"
            min={selected.min_amount}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setError('')
            }}
            placeholder={formatCurrency(selected.min_amount)}
            helperText={`Minimum: ${formatCurrency(selected.min_amount)} • Your balance: ${formatCurrency(profile?.balance || 0)}`}
            error={error}
          />

          {amount && (
            <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-primary-700 font-medium">Daily Earning</p>
                  <p className="text-lg font-bold text-primary-900">{formatCurrency(dailyEarning)}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-700 font-medium">Total Return</p>
                  <p className="text-lg font-bold text-primary-900">{formatCurrency(totalReturn)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primary-600 flex-shrink-0" />
              <span>Principal returned after {selected.duration_days} days</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-600 flex-shrink-0" />
              <span>Daily earnings added automatically</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-600 flex-shrink-0" />
              <span>Secure smart contract execution</span>
            </div>
          </div>

          <Button
            onClick={handleInvest}
            disabled={!amount || parseFloat(amount) < selected.min_amount || loading}
            className="mt-4"
          >
            Invest Now
          </Button>
        </Card>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Investment"
        size="sm"
      >
        {selected && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Plan</span>
                <span className="font-medium">{selected.name}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-600">Amount</span>
                <span className="font-medium">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-600">Daily Rate</span>
                <span className="font-medium">{formatPercent(selected.daily_rate)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-600">Duration</span>
                <span className="font-medium">{selected.duration_days} days</span>
              </div>
              <div className="flex justify-between text-sm mt-1 border-t border-slate-200 pt-2">
                <span className="text-slate-600">Est. Total Return</span>
                <span className="font-semibold text-primary-600">{formatCurrency(totalReturn)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowConfirm(false)} fullWidth>
                Cancel
              </Button>
              <Button onClick={confirmInvest} loading={investing} fullWidth>
                Confirm Investment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={success}
        onClose={() => {}}
        title="Investment Successful!"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Your investment is active</h3>
          <p className="text-slate-500 text-sm mt-1">Earnings will be added daily</p>
        </div>
      </Modal>
    </div>
  )
}

export default Invest
