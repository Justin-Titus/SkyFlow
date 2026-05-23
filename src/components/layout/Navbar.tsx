'use client'

import Link from 'next/link'
import { useUserStore } from '@/store/userStore'
import { useFlightStore } from '@/store/flightStore'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
const supabase = createClient()


export function Navbar() {
  const { user, setSession, logout } = useUserStore()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    useUserStore.persist.rehydrate()
    useFlightStore.persist.rehydrate()
    setMounted(true)
    let subscription: { unsubscribe: () => void } | null = null
    try {
      const res = supabase.auth.onAuthStateChange(
        (event, session) => {
          const currentUser = useUserStore.getState().user
          const isMock = currentUser && (currentUser.id?.startsWith('mock-') || currentUser.id === 'mock-user-123')
          if (isMock && !session) {
            return
          }
          setSession(session)
        }
      )
      subscription = res.data.subscription
    } catch (e) {
      console.warn('Supabase auth state change subscription failed:', e)
    }
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (e) {
          // ignore
        }
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [supabase.auth, setSession])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Signout failed from Supabase, logging out locally:', err)
    }
    logout()
    router.push('/')
  }

  const navLinks = [
    { href: '/', label: 'Search Flights' },
    { href: '/my-bookings', label: 'My Bookings' },
  ]

  const getDisplayName = () => {
    if (!user) return ''
    if (user.user_metadata?.full_name) return user.user_metadata.full_name
    if (user.user_metadata?.name) return user.user_metadata.name
    if (user.email) {
      const part = user.email.split('@')[0]
      return part
        .split(/[._-]/)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
    return 'Passenger'
  }

  const isAuthPage = pathname === '/login' || pathname === '/register'

  if (isAuthPage) return null

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled 
        ? "bg-[#050508]/85 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
        : "bg-transparent border-b border-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <div className="flex items-center flex-shrink-0">
          <Link href="/" className="flex items-center gap-3 group" aria-label="SkyFlow logo and homepage link">
            <div className="relative w-8.5 h-8.5">
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-xl bg-indigo-500/25 blur-md group-hover:bg-indigo-500/35 transition-all duration-300" />
              <div className="relative w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_24px_rgba(0,210,255,0.4)] transition-all duration-300 border border-white/10">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-white transform group-hover:rotate-12 transition-transform duration-300">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
                </svg>
              </div>
            </div>
            <span className="font-display font-black text-lg tracking-tight text-white group-hover:text-gradient-cyan transition-all duration-300">
              SkyFlow
            </span>
          </Link>
        </div>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-1.5 bg-white/[0.02] border border-white/5 rounded-full px-2 py-1.5">
          {navLinks.map(link => {
            const isActive = pathname === link.href
            return (
              <Link 
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300",
                  isActive 
                    ? "bg-indigo-500/15 text-white border border-indigo-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] text-glow"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {!mounted ? (
            <div className="w-24 h-8 bg-white/5 rounded-md animate-pulse" />
          ) : user ? (
            <>
              {/* User Menu Toggle */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 text-xs text-slate-300 bg-white/[0.03] px-3.5 py-1.5 rounded-full border border-white/5 hover:bg-white/[0.08] transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  aria-haspopup="true"
                  aria-expanded={showUserMenu}
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-[9px] font-black text-white flex-shrink-0 border border-white/10 shadow-[0_0_8px_rgba(99,102,241,0.3)]">
                    {getDisplayName().charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate font-semibold tracking-tight text-[11px]">
                    {getDisplayName()}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-[#0a0a14] border border-white/10 shadow-xl rounded-xl p-2 animate-fade-in-up origin-top-right z-50">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleLogout} 
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-xs h-9"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">Log in</Button>
              </Link>
              <Link href="/register">
                <Button variant="default" size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
