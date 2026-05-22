/* eslint-disable */
'use client'

import { useEffect, useState } from 'react'

export function RegisterPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const isDismissed = localStorage.getItem('skyflow_pwa_prompt_dismissed') === 'true'
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone
    
    if (isDismissed || isStandalone) return
 
    // Show the banner
    setShowInstall(true)

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleLater = () => {
    localStorage.setItem('skyflow_pwa_prompt_dismissed', 'true')
    setShowInstall(false)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that do not support beforeinstallprompt
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
      if (isIOS) {
        alert("To install Skyflow, tap your browser's share icon and select 'Add to Home Screen'.")
      } else {
        alert("To install Skyflow, please open your browser menu (e.g., click the three dots/lines or install icon in address bar) and select 'Install Skyflow' or 'Add to Home Screen'.")
      }
      localStorage.setItem('skyflow_pwa_prompt_dismissed', 'true')
      setShowInstall(false)
      return
    }
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem('skyflow_pwa_prompt_dismissed', 'true')
      setShowInstall(false)
    }
    setDeferredPrompt(null)
  }

  if (!showInstall) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-[#0a0a14] border border-white/10 shadow-2xl rounded-2xl p-4 flex items-center justify-between animate-fade-in-up">
      <div className="flex flex-col">
        <span className="text-white font-semibold text-sm">Install Skyflow</span>
        <span className="text-slate-400 text-xs">Book faster on the go</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleLater} className="text-slate-500 hover:text-white px-2 py-1 text-xs transition-colors">Later</button>
        <button onClick={handleInstall} className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg px-3 py-1.5 text-xs font-semibold shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all">Install</button>
      </div>
    </div>
  )
}
