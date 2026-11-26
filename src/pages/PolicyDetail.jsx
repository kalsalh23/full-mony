import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Shield, FileText, AlertTriangle } from 'lucide-react'
import { supabase } from '\.\./lib/supabase'
import { Card } from '\.\./components/ui/Card'
import Button from '\.\./components/ui/Button'

const policyIcons = {
  privacy: Shield,
  terms: FileText,
  withdrawal: AlertTriangle,
  risk: AlertTriangle
}

const PolicyDetail = () => {
  const { slug } = useParams()
  const [policy, setPolicy] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPolicy = async () => {
      const { data } = await supabase
        .from('policies')
        .select('*')
        .eq('slug', slug)
        .single()

      if (data) {
        setPolicy(data)
      } else {
        // Default content
        const defaults = {
          privacy: { title: 'Privacy Policy', content: '<p>Privacy policy content...</p>' },
          terms: { title: 'Terms of Service', content: '<p>Terms content...</p>' },
          withdrawal: { title: 'Withdrawal & Fee Policy', content: '<p>Withdrawal policy content...</p>' },
          risk: { title: 'Risk Disclaimer', content: '<p>Risk disclaimer content...</p>' }
        }
        setPolicy(defaults[slug] || { title: 'Policy', content: '<p>Policy not found</p>' })
      }
      setLoading(false)
    }
    fetchPolicy()
  }, [slug])

  const Icon = policyIcons[slug] || FileText

  if (loading) {
    return (
      <div className="page-container">
        <div className="animate-pulse-soft space-y-4">
          <div className="h-8 bg-slate-100 rounded w-1/4" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="page-container pb-28">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">{policy.title}</h1>
      </div>

      <Card padding="lg">
        <div 
          className="prose prose-slate max-w-none text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: policy.content }}
        />
      </Card>

      <div className="mt-6 text-center">
        <Link to="/policies" className="text-primary-600 hover:underline text-sm">
          ← Back to all policies
        </Link>
      </div>
    </div>
  )
}

export default PolicyDetail
