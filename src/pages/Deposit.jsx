import { useState } from 'react'
import { Copy, Check, AlertCircle, Image, FileText, Clock, HelpCircle } from 'lucide-react'
import { useAuth } from '\.\./contexts/AuthContext'
import { supabase } from '\.\./lib/supabase'
import { formatCurrency, truncateAddress } from '\.\./lib/utils'
import Button from '\.\./components/ui/Button'
import Input from '\.\./components/ui/Input'
import { Card } from '\.\./components/ui/Card'
import Modal from '\.\./components/ui/Modal'
import { QRCodeSVG as QRCode } from 'qrcode.react'

const networks = [
  {
    id: 'usdt-trc20',
    name: 'USDT - TRC20 (Tron)',
    currency: 'USDT',
    address: 'TXYZ1234567890abcdefghijklmnopqrstuv',
    qrPrefix: 'tron:',
    minDeposit: 10,
    icon: '🔶'
  },
  {
    id: 'usdt-bep20',
    name: 'USDT - BEP20 (BSC)',
    currency: 'USDT',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    qrPrefix: 'bep20:',
    minDeposit: 10,
    icon: '🟡'
  },
  {
    id: 'usdt-erc20',
    name: 'USDT - ERC20 (Ethereum)',
    currency: 'USDT',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    qrPrefix: 'ethereum:',
    minDeposit: 20,
    icon: '🔷'
  },
  {
    id: 'btc',
    name: 'Bitcoin (BTC)',
    currency: 'BTC',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    qrPrefix: 'bitcoin:',
    minDeposit: 0.001,
    icon: '₿'
  },
  {
    id: 'bnb',
    name: 'BNB (BSC)',
    currency: 'BNB',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    qrPrefix: 'bsc:',
    minDeposit: 0.01,
    icon: '🟡'
  }
]

const Deposit = () => {
  const { profile, refreshProfile } = useAuth()
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0])
  const [txHash, setTxHash] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState(null)

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!txHash.trim()) {
      setError('Please enter the transaction hash')
      setLoading(false)
      return
    }

    if (!amount || parseFloat(amount) < selectedNetwork.minDeposit) {
      setError(`Minimum deposit is ${selectedNetwork.minDeposit} ${selectedNetwork.currency}`)
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase
        .from('deposits')
        .insert({
          user_id: profile.id,
          amount: parseFloat(amount),
          network: selectedNetwork.id,
          tx_hash: txHash.trim(),
          status: 'pending'
        })

      if (error) throw error

      setSuccess(true)
      setTxHash('')
      setAmount('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to submit deposit request')
    } finally {
      setLoading(false)
    }
  }

  const network = networks.find(n => n.id === selectedNetwork.id) || networks[0]
  const qrData = `${network.qrPrefix}${network.address}?amount=${amount || ''}`

  return (
    <div className="page-container pb-28 space-y-6">
      <h1 className="section-title">Deposit Funds</h1>
      <p className="text-slate-500 text-sm">Send crypto to one of the addresses below</p>

      {/* Network Selector */}
      <Card padding="md">
        <h3 className="font-semibold text-slate-900 mb-4">Select Network</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {networks.map((net) => (
            <button
              key={net.id}
              onClick={() => {
                setSelectedNetwork(net)
                setAmount('')
                setTxHash('')
              }}
              className={`w-full p-3 rounded-xl text-left transition-all duration-200 flex items-center gap-3 ${
                selectedNetwork.id === net.id
                  ? 'bg-primary-50 border-2 border-primary-300'
                  : 'bg-slate-50 border border-slate-200 hover:border-primary-200'
              }`}
            >
              <span className="text-2xl">{net.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{net.name}</p>
                <p className="text-xs text-slate-500">Min: {net.minDeposit} {net.currency}</p>
              </div>
              {selectedNetwork.id === net.id && (
                <Check className="w-5 h-5 text-primary-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Deposit Details */}
      <Card padding="md">
        <div className="space-y-4">
          <div>
            <label className="label">Deposit Address ({network.currency})</label>
            <div className="relative">
              <div className="input-field bg-slate-50 text-slate-900 font-mono text-sm flex items-center gap-2">
                <span className="flex-1 truncate">{truncateAddress(network.address)}</span>
                <button
                  onClick={() => handleCopy(network.address, 'address')}
                  className="text-slate-400 hover:text-primary-600 p-1"
                  aria-label="Copy address"
                >
                  {copied === 'address' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              {copied === 'address' && (
                <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap">
                  Copied!
                </div>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="text-center">
            <label className="label">Or scan QR code</label>
            <div className="inline-block p-4 bg-white rounded-xl border border-slate-200">
              <QRCode
                value={qrData}
                size={180}
                level="M"
                includeMargin={true}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Amount: {amount ? formatCurrency(parseFloat(amount)) + ` ${network.currency}` : 'Not specified'}</p>
          </div>

          {/* Important Notes */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 space-y-1">
                <p className="font-medium">Important:</p>
                <p>Only send {network.currency} via {network.name.split('(')[1]?.replace(')', '') || network.name} network</p>
                <p>Minimum deposit: {network.minDeposit} {network.currency}</p>
                <p>Deposits require network confirmations</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Confirmation Form */}
      <Card padding="md">
        <h3 className="font-semibold text-slate-900 mb-4">Confirm Deposit</h3>
        <p className="text-sm text-slate-500 mb-4">
          After sending, enter the transaction hash below for verification
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Amount Deposited"
            type="number"
            step="0.01"
            min={network.minDeposit}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setError('')
            }}
            placeholder={`e.g. ${network.minDeposit}`}
            required
            error={error}
          />

          <Input
            label="Transaction Hash (TXID)"
            value={txHash}
            onChange={(e) => {
              setTxHash(e.target.value)
              setError('')
            }}
            placeholder="Paste transaction hash here"
            required
            error={error}
            helperText="Find this in your wallet or block explorer"
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth>
            Submit for Review
          </Button>
        </form>

        <div className="mt-4 p-3 bg-slate-50 rounded-xl">
          <div className="flex items-start gap-2">
            <Clock className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-600">
              <p className="font-medium">Processing Time</p>
              <p>Deposits are reviewed manually within 1-24 hours. You'll receive a notification once confirmed.</p>
            </div>
          </div>
        </div>
      </Card>

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
          <h3 className="text-lg font-semibold text-slate-900">Deposit request sent</h3>
          <p className="text-slate-500 text-sm mt-1">Our team will review and credit your account</p>
        </div>
      </Modal>
    </div>
  )
}

export default Deposit
