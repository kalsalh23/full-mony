import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, FileText, Shield, AlertTriangle } from 'lucide-react'
import { supabase } from '\.\./lib/supabase'
import { Card } from '\.\./components/ui/Card'
import Button from '\.\./components/ui/Button'

const policies = [
  { slug: 'privacy', title: 'Privacy Policy', icon: Shield },
  { slug: 'terms', title: 'Terms of Service', icon: FileText },
  { slug: 'withdrawal', title: 'Withdrawal & Fee Policy', icon: AlertTriangle },
  { slug: 'risk', title: 'Risk Disclaimer', icon: AlertTriangle }
]

const Policies = () => {
  const [policyContent, setPolicyContent] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPolicies = async () => {
      const { data } = await supabase.from('policies').select('*')
      if (data) {
        const content = {}
        data.forEach(p => content[p.slug] = p)
        setPolicyContent(content)
      }
      setLoading(false)
    }
    fetchPolicies()
  }, [])

  const defaultContent = {
    privacy: {
      title: 'Privacy Policy',
      content: `
        <h2>Privacy Policy</h2>
        <p><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>
        
        <h3>1. Information We Collect</h3>
        <p>We collect information you provide directly to us, including:</p>
        <ul>
          <li>Account information (name, email address)</li>
          <li>Transaction data (deposits, withdrawals, investments)</li>
          <li>Communication preferences</li>
        </ul>

        <h3>2. How We Use Your Information</h3>
        <p>We use your information to:</p>
        <ul>
          <li>Provide and maintain our services</li>
          <li>Process transactions and manage investments</li>
          <li>Send important account notifications</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h3>3. Data Security</h3>
        <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

        <h3>4. Data Sharing</h3>
        <p>We do not sell your personal information. We may share data with:</p>
        <ul>
          <li>Payment processors for transaction processing</li>
          <li>Legal authorities when required by law</li>
          <li>Service providers who assist in operating our platform</li>
        </ul>

        <h3>5. Your Rights</h3>
        <p>You have the right to access, correct, or delete your personal data. Contact us to exercise these rights.</p>

        <h3>6. Contact Us</h3>
        <p>For privacy concerns, contact our support team through the app.</p>
      `
    },
    terms: {
      title: 'Terms of Service',
      content: `
        <h2>Terms of Service</h2>
        <p><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>

        <h3>1. Acceptance of Terms</h3>
        <p>By accessing and using Monus, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>

        <h3>2. Eligibility</h3>
        <p>You must be at least 18 years old and legally capable of entering into contracts to use our services.</p>

        <h3>3. Account Registration</h3>
        <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>

        <h3>4. Mining Plans & Investments</h3>
        <p>Mining plans are subject to change. Returns are not guaranteed. Past performance does not indicate future results.</p>

        <h3>5. Deposits & Withdrawals</h3>
        <p>Deposits are credited after network confirmations. Withdrawals are subject to a 5% fee and manual review. Minimum amounts apply.</p>

        <h3>6. Prohibited Activities</h3>
        <p>You may not use our services for illegal activities, fraud, money laundering, or any activity that violates these terms.</p>

        <h3>7. Termination</h3>
        <p>We may suspend or terminate your account for violations of these terms.</p>

        <h3>8. Limitation of Liability</h3>
        <p>We are not liable for any indirect, incidental, or consequential damages arising from your use of our services.</p>

        <h3>9. Governing Law</h3>
        <p>These terms are governed by applicable international law.</p>

        <h3>10. Changes to Terms</h3>
        <p>We may update these terms at any time. Continued use constitutes acceptance of changes.</p>
      `
    },
    withdrawal: {
      title: 'Withdrawal & Fee Policy',
      content: `
        <h2>Withdrawal & Fee Policy</h2>
        <p><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>

        <h3>1. Withdrawal Fee</h3>
        <p>All withdrawals are subject to a <strong>5% fee</strong> deducted from the requested amount. The net amount you receive is: <strong>Requested Amount - 5% Fee</strong>.</p>

        <h3>2. Minimum Withdrawal Amounts</h3>
        <ul>
          <li>USDT (TRC20/BEP20): 10 USDT</li>
          <li>USDT (ERC20): 20 USDT</li>
          <li>BTC: 0.001 BTC</li>
          <li>BNB: 0.01 BNB</li>
        </ul>

        <h3>3. Processing Time</h3>
        <p>Withdrawal requests are reviewed manually and processed within <strong>24-48 hours</strong> during business days.</p>

        <h3>4. Verification</h3>
        <p>We may require additional verification for large withdrawals or suspicious activity.</p>

        <h3>5. Rejected Withdrawals</h3>
        <p>If a withdrawal is rejected, the full amount (including fee) is returned to your account balance.</p>

        <h3>6. Network Fees</h3>
        <p>Blockchain network fees are included in the 5% fee. No additional network fees are charged.</p>

        <h3>7. Policy Changes</h3>
        <p>Fee structures and minimums may be updated with notice to users.</p>
      `
    },
    risk: {
      title: 'Risk Disclaimer',
      content: `
        <h2>Risk Disclaimer</h2>
        <p><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>

        <h3>1. Investment Risk</h3>
        <p><strong>Cloud mining and cryptocurrency investments carry significant financial risk.</strong> You may lose some or all of your invested capital.</p>

        <h3>2. No Guaranteed Returns</h3>
        <p>Daily returns and total returns are estimates based on current mining conditions. Actual returns may vary significantly and are not guaranteed.</p>

        <h3>3. Market Volatility</h3>
        <p>Cryptocurrency prices are highly volatile. The value of your investments and earnings can fluctuate dramatically.</p>

        <h3>4. Technical Risks</h3>
        <p>Mining operations may be affected by hardware failures, network issues, regulatory changes, or other technical problems.</p>

        <h3>5. Regulatory Risk</h3>
        <p>Cryptocurrency regulations vary by jurisdiction and may change. This could affect the legality or viability of mining operations.</p>

        <h3>6. Liquidity Risk</h3>
        <p>Funds invested in mining plans are locked for the duration of the plan. Early withdrawal may not be possible.</p>

        <h3>7. Platform Risk</h3>
        <p>As with any online platform, there are risks including but not limited to: cybersecurity threats, operational failures, and business continuity issues.</p>

        <h3>8. Not Financial Advice</h3>
        <p>Information provided on this platform is for informational purposes only and does not constitute financial, investment, or legal advice.</p>

        <h3>9. Your Responsibility</h3>
        <p>You are solely responsible for evaluating the risks and making investment decisions. Only invest what you can afford to lose.</p>

        <h3>10. Seek Professional Advice</h3>
        <p>We strongly recommend consulting with a qualified financial advisor before making any investment decisions.</p>
      `
    }
  }

  return (
    <div className="page-container pb-28">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h1 className="section-title">Policies</h1>
      </div>

      <div className="space-y-3">
        {policies.map((policy) => {
          const content = policyContent[policy.slug] || defaultContent[policy.slug]
          return (
            <Link key={policy.slug} to={`/policies/${policy.slug}`} className="block">
              <Card className="hover:shadow-card-hover transition-shadow" padding="md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <policy.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{content.title}</h3>
                    <p className="text-sm text-slate-500">Review our {content.title.toLowerCase()}</p>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default Policies
