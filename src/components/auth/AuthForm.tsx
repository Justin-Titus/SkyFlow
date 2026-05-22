'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/userStore'
import { Eye, EyeOff } from 'lucide-react'

interface AuthFormProps {
  type: 'login' | 'register'
}

function AuthFormContent({ type }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [errorParam])
  
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const getAuthErrorText = (dbErr: unknown) => {
      const err = dbErr as any
      return String(err?.message || err?.error_description || '').trim()
    }

    const isClientAuthError = (dbErr: unknown) => {
      const status = (dbErr as any)?.status
      return typeof status === 'number' && status >= 400 && status < 500
    }

    const shouldUseDemoMode = (dbErr: unknown) => {
      const err = dbErr as any
      const status = err?.status
      const message = getAuthErrorText(dbErr)

      if (typeof status === 'number') {
        return status >= 500
      }

      return err?.name === 'TypeError' || /(failed|network)/i.test(message)
    }

    if (type === 'register' && password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Add password strength validation for registration
    if (type === 'register') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long')
        setLoading(false)
        return
      }
      const hasUpperCase = /[A-Z]/.test(password)
      const hasLowerCase = /[a-z]/.test(password)
      const hasDigit = /\d/.test(password)
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

      if (!hasUpperCase || !hasLowerCase || !hasDigit || !hasSpecialChar) {
        setError('Password must contain uppercase, lowercase, digit, and special character')
        setLoading(false)
        return
      }
    }

    try {
      if (type === 'register') {
        try {
          const { error } = await supabase.auth.signUp({
            email, password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: {
                full_name: fullName,
              }
            },
          })
          if (error) throw error
          setSuccess('Account created! Check your email to confirm.')
        } catch (dbErr) {
          // Distinguish validation/client errors from network/server errors
          const isClientError = isClientAuthError(dbErr)

          if (isClientError) {
            // This is a validation/client error, show it to the user
            setError(getAuthErrorText(dbErr) || 'Registration failed')
          } else if (shouldUseDemoMode(dbErr)) {
            // This is a network/server error, enable demo mode
            console.warn('Supabase Auth signup failed, enabling demo login mode:', dbErr)
            // Mock signup & auto-login with unique ID
            const uniqueId = `mock-user-${Math.random().toString(36).substring(2, 10)}`
            const mockUser = {
              id: uniqueId,
            email,
            user_metadata: { full_name: fullName || 'Guest Passenger' },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
            }
            useUserStore.getState().setUser(mockUser as any)
            setSuccess('Account created (Demo Mode)! Redirecting...')
            setTimeout(() => {
              router.push('/')
              router.refresh()
            }, 1500)
          } else {
            setError(getAuthErrorText(dbErr) || 'Registration failed')
          }
        }
      } else {
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error
          router.push('/')
          router.refresh()
        } catch (dbErr) {
          // Distinguish validation/client errors from network/server errors
          const isClientError = isClientAuthError(dbErr)

          if (isClientError) {
            // This is a validation/client error (e.g., invalid credentials), show it
            setError(getAuthErrorText(dbErr) || 'Login failed')
          } else if (shouldUseDemoMode(dbErr)) {
            // This is a network/server error, enable demo mode
            console.warn('Supabase Auth signin failed, enabling demo login mode:', dbErr)
            // Mock login with unique ID
            const uniqueId = `mock-user-${Math.random().toString(36).substring(2, 10)}`
            const mockUser = {
              id: uniqueId,
            email,
            user_metadata: { full_name: 'Guest Passenger' },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
            }
            useUserStore.getState().setUser(mockUser as any)
            router.push('/')
            router.refresh()
          } else {
            setError(getAuthErrorText(dbErr) || 'Login failed')
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-16">
      <AnimatedBackground variant="hero" />

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-xl bg-indigo-500/20 blur-md group-hover:bg-indigo-500/30 transition-all" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
              </div>
            </div>
            <span className="font-display font-bold text-xl text-white">SkyFlow</span>
          </Link>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl border border-white/6 bg-gradient-to-b from-[#0c0c1a] to-[#080812] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
          {/* Top bar */}
          <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-display font-bold text-white">
                {type === 'login' ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">
                {type === 'login' 
                  ? 'Sign in to access your bookings and trips.' 
                  : 'Join SkyFlow and start booking instantly.'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {type === 'register' && (
                <Input
                  label="Full name"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
                    </svg>
                  }
                />
              )}
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                }
              />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                }
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-500 hover:text-slate-350 active:text-indigo-400 focus:outline-none transition-colors cursor-pointer mr-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              {type === 'register' && (
                <Input
                  label="Confirm password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  }
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-500 hover:text-slate-355 active:text-indigo-400 focus:outline-none transition-colors cursor-pointer mr-0.5"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/15 text-red-400 text-xs">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                  </svg>
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 text-xs">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {success}
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" variant="glow" className="w-full h-11" isLoading={loading}>
                  {type === 'login' ? 'Sign in' : 'Create account'}
                </Button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-white/4 bg-white/[0.01] text-center">
            <p className="text-xs text-slate-600">
              {type === 'login' ? "New to SkyFlow? " : "Already have an account? "}
              <Link
                href={type === 'login' ? '/register' : '/login'}
                className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
              >
                {type === 'login' ? 'Create account' : 'Sign in'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuthForm(props: AuthFormProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="text-slate-500 font-display text-sm animate-pulse">Loading form...</div>
      </div>
    }>
      <AuthFormContent {...props} />
    </Suspense>
  )
}
