import { useState } from 'react'
import { ArrowRight, AlertCircle, Calculator, Info, Copy, Check } from 'lucide-react'
import { useAuth } from '\.\./contexts/AuthContext'
import { supabase } from '\.\./lib/supabase'
import { formatCurrency, calculateWithdrawal, validateAmount, truncateAddress } from '\.\./lib/utils'
import Button from '\.\./components/ui/Button'
import Input from '\.\./components/ui/Input'
import { Card } from '\.\./components/ui/Card'
import Modal from '\.\./components/ui/Modal'

const withdrawNetworks = [
  { id: 'usdt-trc20', name: 'USDT - TRC20 (Tron)', currency: 'USDT', minWithdraw: 10 },
  { id: 'usdt-bep20', name: 'USDT - BEP20 (BSC)', currency: 'USDT', minWithdraw: 10 },
  { id: 'usdt-erc20', name: 'USDT - ERC20 (Ethereum)', currency: 'USDT', minWithdraw: 20 },
  { id: 'btc', name: 'Bitcoin (BTC)', currency: 'BTC', minWithdraw: 0.001 },
  { id: 'bnb', name: 'BNB (BSC)', currency: 'BNB', minWithdraw: 0.01 }
]

const WITHDRAWAL_FEE_PERCENT = 5

const Withdraw = () => {
  const { profile, refreshProfile } = useAuth()
  const [selectedNetwork, setSelectedNetwork] = useState(withdrawNetworks[0])
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [copied, setCopied] = useState(null)

  const calculation = amount ? calculateWithdrawal(parseFloat(amount), WITHDRAWAL_FEE_PERCENT) : { fee: 0, net: 0 }
  const minWithdraw = selectedNetwork.minWithdraw

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const amountNum = parseFloat(amount)
    if (!validateAmount(amount, minWithdraw)) {
      setError(`Minimum withdrawal is ${minWithdraw} ${selectedNetwork.currency}`)
      return
    }

    if (!address.trim()) {
      setError('Please enter a withdrawal address')
      return
    }

    if (!profile || (profile.balance || 0) < amountNum) {
      setError('Insufficient balance')
      return
    }

    setShowConfirm(true)
  }

  const confirmWithdraw = async () => {
    setWithdrawing(true)
    setError('')

    try {
      const amountNum = parseFloat(amount)
      const { fee, net } = calculateWithdrawal(amountNum, WITHDRAWAL_FEE_PERCENT)

      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: profile.id,
          amount: amountNum,
          fee,
          net_amount: net,
          address: address.trim(),
          network: selectedNetwork.id,
          status: 'pending'
        })

      if (error) throw error

      setSuccess(true)
      setAmount('')
      setAddress('')
      await refreshProfile()
      setTimeout(() => {
        setSuccess(false)
        setShowConfirm(false)
      }, 3000)
    } catch (err) {
      setError(err.message || 'Withdrawal request failed')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="page-container pb-28 space-y-6">
      <h1 className="section-title">Withdraw Funds</h1>
      <p className="text-slate-500 text-sm">Send funds to your external wallet</p>

      {/* Balance Info */}
      <Card padding="md" className="bg-primary-50 border-primary-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-700">Available Balance</p>
            <p className="text-2xl font-bold text-primary-900">{formatCurrency(profile?.balance || 0)} USDT</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-primary-700">Fee</p>
            <p className="text-lg font-bold text-primary-900">{WITHDRAWAL_FEE_PERCENT}%</p>
          </div>
        </div>
      </Card>

      {/* Network Selector */}
      <Card padding="md">
        <h3 className="font-semibold text-slate-900 mb-4">Select Network</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {withdrawNetworks.map((net) => (
            <button
              key={net.id}
              onClick={() => {
                setSelectedNetwork(net)
                setAmount('')
                setAddress('')
              }}
              className={`w-full p-3 rounded-xl text-left transition-all duration-200 flex items-center gap-3 ${
                selectedNetwork.id === net.id
                  ? 'bg-primary-50 border-2 border-primary-300'
                  : 'bg-slate-50 border border-slate-200 hover:border-primary-200'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <span className="font-bold text-slate-600">{net.currency.slice(0, 3)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">{net.name}</p>
                <p className="text-xs text-slate-500">Min: {net.minWithdraw} {net.currency}</p>
              </div>
              {selectedNetwork.id === net.id && (
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Withdrawal Form */}
      <Card padding="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={`Amount (${selectedNetwork.currency})`}
            type="number"
            step="0.01"
            min={minWithdraw}
            max={profile?.balance || 0}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setError('')
            }}
            placeholder={`e.g. ${minWithdraw}`}
            required
            error={error}
            helperText={`Available: ${formatCurrency(profile?.balance || 0)} ${selectedNetwork.currency}`}
          />

          <Input
            label="Destination Address"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value)
              setError('')
            }}
            placeholder="Enter wallet address"
            required
            error={error}
          />

          {/* Fee Calculation Preview */}
          {amount && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary-600" />
                Withdrawal Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Requested Amount</span>
                  <span className="font-medium">{formatCurrency(parseFloat(amount))} {selectedNetwork.currency}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Fee ({WITHDRAWAL_FEE_PERCENT}%)</span>
                  <span className="font-medium">-{formatCurrency(calculation.fee)} {selectedNetwork.currency}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-900 font-semibold">You Will Receive</span>
                  <span className="text-primary-600 font-bold">{formatCurrency(calculation.net)} {selectedNetwork.currency}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth disabled={!amount || parseFloat(amount) < minWithdraw}>
            Continue
          </Button>
        </form>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Withdrawal Policy</p>
              <p className="mt-1">All withdrawals are subject to a {WITHDRAWAL_FEE_PERCENT}% fee. Requests are processed manually within 24-48 hours. Minimum withdrawal amounts apply per network.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Withdrawal"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Network</span>
              <span className="font-medium">{selectedNetwork.name}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Address</span>
              <span className="font-mono text-xs truncate max-w-[150px]">{truncateAddress(address)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2 border-t border-slate-200 pt-2">
              <span className="text-slate-600">Requested</span>
              <span className="font-medium">{formatCurrency(parseFloat(amount))} {selectedNetwork.currency}</span>
            </div>
            <div className="flex justify-between text-sm text-red-600 mb-2">
              <span>Fee ({WITHDRAWAL_FEE_PERCENT}%)</span>
              <span className="font-medium">-{formatCurrency(calculation.fee)} {selectedNetwork.currency}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-primary-600 border-t border-slate-200 pt-2">
              <span>Net Amount</span>
              <span>{formatCurrency(calculation.net)} {selectedNetwork.currency}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowConfirm(false)} fullWidth>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmWithdraw} loading={withdrawing} fullWidth>
              Confirm Withdrawal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={success}
        onClose={() => setSuccess(false)}
        title="Request Submitted"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Withdrawal requested</h3>
          <p className="text-slate-500 text-sm mt-1">Your request is pending review</p>
        </div>
      </Modal>
    </div>
  )
}

export default Withdraw
