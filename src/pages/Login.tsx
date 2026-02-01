import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { hasSupabase } from '../lib/supabase'

export default function Login() {
  const [searchParams] = useSearchParams()
  const isSignUp = searchParams.get('signup') === '1'
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!hasSupabase()) {
    return (
      <div className="max-w-sm mx-auto mt-12">
        <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
          <h1 className="font-recipe text-2xl font-semibold text-ink mb-2">Sign in</h1>
          <p className="text-ink-muted text-sm mb-4">
            Sync is not configured for this deployment. To enable sign-in and sync across devices:
          </p>
          <ul className="list-disc list-inside text-sm text-ink-muted space-y-1 mb-6">
            <li>Add <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> to your deployment (e.g. Vercel → Settings → Environment Variables).</li>
            <li>Redeploy so the new build picks up the variables.</li>
          </ul>
          <Link to="/" className="text-olive font-medium hover:underline">← Back to recipes</Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      if (isSignUp) {
        const { error: err } = await signUp(email, password)
        if (err) setError(err.message)
        else setMessage('Check your email to confirm your account, then sign in.')
      } else {
        const { error: err } = await signIn(email, password)
        if (err) setError(err.message)
        else navigate('/', { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-12">
      <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
        <h1 className="font-recipe text-2xl font-semibold text-ink mb-2">
          {isSignUp ? 'Create account' : 'Sign in'}
        </h1>
        <p className="text-ink-muted text-sm mb-6">
          {isSignUp
            ? 'Sign up to sync recipes across your devices.'
            : 'Sign in to access your recipes on all devices.'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-ink focus:border-sage focus:ring-2 focus:ring-sage/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              minLength={6}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-ink focus:border-sage focus:ring-2 focus:ring-sage/20"
            />
            {isSignUp && (
              <p className="mt-1 text-xs text-ink-muted">At least 6 characters</p>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}
          {message && (
            <p className="text-sm text-ink bg-cream-2 px-3 py-2 rounded-xl">{message}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-terracotta text-white font-medium hover:bg-terracotta-dark disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? 'Please wait…' : isSignUp ? 'Sign up' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-muted">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <Link to="/login" className="text-olive font-medium hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              No account?{' '}
              <Link to="/login?signup=1" className="text-olive font-medium hover:underline">
                Sign up
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
