/* eslint-disable */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plane, Mail, Globe, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function Footer() {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/register'

  if (isAuthPage) return null

  return (
    <footer className="w-full bg-[#050508] border-t border-white/5 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-12">
          {/* Brand section */}
          <div className="col-span-1 md:col-span-4 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.3)]">
                <Plane size={14} className="text-white transform group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="font-display font-black text-lg tracking-tight text-white">
                SkyFlow
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Experience the pinnacle of aviation booking. High-performance, real-time ticket purchasing, and seat reservation designed for modern travelers.
            </p>
            <div className="flex gap-3.5 mt-2">
              <a href="#" aria-label="Twitter profile" className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a href="#" aria-label="GitHub profile" className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              <a href="#" aria-label="Company website" className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300">
                <Globe size={14} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="col-span-1 sm:col-span-2 md:col-span-2 flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-white tracking-wider uppercase">Bookings</h4>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-400">
              <li>
                <Link href="/" className="hover:text-indigo-400 transition-colors">Search Flights</Link>
              </li>
              <li>
                <Link href="/my-bookings" className="hover:text-indigo-400 transition-colors">My Trips</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-400 transition-colors">Passenger Log-in</Link>
              </li>
            </ul>
          </div>

          {/* Destinations / Class */}
          <div className="col-span-1 sm:col-span-2 md:col-span-2 flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-white tracking-wider uppercase">Cabin Classes</h4>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-400">
              <li className="hover:text-indigo-400 cursor-pointer transition-colors">First Class</li>
              <li className="hover:text-indigo-400 cursor-pointer transition-colors">Business Class</li>
              <li className="hover:text-indigo-400 cursor-pointer transition-colors">Economy Premium</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-1 md:col-span-4 flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-white tracking-wider uppercase">Stay Updated</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Subscribe to get flight status updates and exclusive seasonal offers.
            </p>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  id="newsletter-email"
                  aria-label="Newsletter email address"
                  placeholder="Enter your email" 
                  className="w-full h-9 bg-white/[0.03] border border-white/5 rounded-xl pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-300"
                />
              </div>
              <Button size="sm" className="h-9 px-3.5 !rounded-xl">
                <Send size={11} className="mr-1.5" />
                Join
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-400">
          <span>&copy; {new Date().getFullYear()} SkyFlow Airlines. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
