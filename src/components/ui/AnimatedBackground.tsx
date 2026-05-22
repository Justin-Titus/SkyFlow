'use client'

export function AnimatedBackground({ variant = 'default' }: { variant?: 'default' | 'minimal' | 'hero' }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base dark background */}
      <div className="absolute inset-0 bg-[#050508]" />
      
      {/* Dot grid */}
      <div className="absolute inset-0 bg-dot-grid opacity-100" />

      {/* Radial gradient overlays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-indigo-600/8 blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[500px] rounded-full bg-cyan-500/5 blur-[100px]" />

      {variant === 'hero' && (
        <>
          {/* Hero-specific: extra glow orbs */}
          <div className="hidden md:block absolute top-[20%] left-[15%] w-[300px] h-[300px] rounded-full bg-indigo-600/12 blur-[80px] animate-float pointer-events-none" style={{ animationDelay: '0s' }} />
          <div className="hidden md:block absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full bg-cyan-500/8 blur-[100px] animate-float pointer-events-none" style={{ animationDelay: '3s' }} />
          <div className="hidden md:block absolute bottom-[20%] left-[30%] w-[250px] h-[250px] rounded-full bg-violet-600/10 blur-[70px] animate-float pointer-events-none" style={{ animationDelay: '1.5s' }} />
          
          {/* Subtle noise grain */}
          <div className="hidden md:block absolute inset-0 opacity-[0.015] pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
          }} />
        </>
      )}

      {/* Top edge glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
    </div>
  )
}
