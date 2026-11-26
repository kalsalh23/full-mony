import { useState } from 'react'
import { ExternalLink, Key, Database, CheckCircle, Loader2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'

const SupabaseSetup = () => {
  const [step, setStep] = useState(1)
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [testing, setTesting] = useState(false)
  const [success, setSuccess] = useState(false)

  const testConnection = async () => {
    if (!url || !key) return
    setTesting(true)
    try {
      const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      })
      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          alert('Connection successful! Please add these to Vercel Environment Variables and redeploy.')
        }, 500)
      } else {
        alert('Connection failed. Check your credentials.')
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="page-container flex items-center justify-center min-h-[calc(100vh-80px)]">
      <Card className="w-full max-w-md animate-fade-in" padding="lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Supabase Setup Required</h1>
          <p className="text-slate-500 mt-2">Configure your database connection to continue</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${step >= 1 ? 'bg-primary-100 text-primary-600' : 'bg-slate-200 text-slate-400'}`}>
              {step >= 1 ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm font-bold">1</span>}
            </div>
            <span className="text-sm text-slate-700">Create Supabase Project</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${step >= 2 ? 'bg-primary-100 text-primary-600' : 'bg-slate-200 text-slate-400'}`}>
              {step >= 2 ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm font-bold">2</span>}
            </div>
            <span className="text-sm text-slate-700">Get API Credentials</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${step >= 3 ? 'bg-primary-100 text-primary-600' : 'bg-slate-200 text-slate-400'}`}>
              {step >= 3 ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm font-bold">3</span>}
            </div>
            <span className="text-sm text-slate-700">Run Database Schema</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${step >= 4 ? 'bg-primary-100 text-primary-600' : 'bg-slate-200 text-slate-400'}`}>
              {step >= 4 ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm font-bold">4</span>}
            </div>
            <span className="text-sm text-slate-700">Add to Vercel & Redeploy</span>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="label">Project URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="input-field"
            />
            <p className="text-xs text-slate-500 mt-1">Find in Supabase Dashboard → Settings → API → Project URL</p>
          </div>
          <div>
            <label className="label">Anon/Public Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="input-field"
            />
            <p className="text-xs text-slate-500 mt-1">Find in Supabase Dashboard → Settings → API → anon/public key</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={testConnection} 
            loading={testing}
            disabled={!url || !key}
            className="w-full"
          >
            {testing ? <Loader2 className="w-5 h-5" /> : 'Test Connection'}
          </Button>
          
          <div className="text-center text-sm text-slate-500">
            <p>After testing, add these to Vercel:</p>
            <div className="mt-2 space-y-1 text-xs font-mono bg-slate-100 p-3 rounded-xl text-left">
              <div><span className="font-medium">VITE_SUPABASE_URL</span> = {url || 'your-url'}</div>
              <div><span className="font-medium">VITE_SUPABASE_ANON_KEY</span> = {key ? '****' : 'your-key'}</div>
            </div>
            <p className="mt-2">Then redeploy from Vercel Dashboard</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-xs text-slate-500">
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-600 hover:underline">
            <ExternalLink className="w-4 h-4" />
            Open Supabase Dashboard
          </a>
          <a href="https://vercel.com/kalsalh23s-projects/monus/settings/environment-variables" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-600 hover:underline">
            <Key className="w-4 h-4" />
            Open Vercel Environment Variables
          </a>
        </div>
      </Card>
    </div>
  )
}

export default SupabaseSetup