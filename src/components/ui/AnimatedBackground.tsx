
export function AnimatedBackground({ variant = 'default' }: { variant?: 'default' | 'minimal' | 'hero' }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base dark background */}
      <div className="absolute inset-0 bg-[#050508]" />
      
      {/* Dot grid */}
      <div className="absolute inset-0 bg-dot-grid opacity-100" />

      {/* Radial gradient overlays (Optimized: Replaced expensive CSS blurs with native radial gradients for 0ms paint cost) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.15)_0%,transparent_70%)]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)]" />

      {variant === 'hero' && (
        <>
          {/* Hero-specific: extra glow orbs (animations removed and converted to radial gradients to prevent CSS paint thrashing) */}
          <div className="hidden md:block absolute top-[20%] left-[15%] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.2)_0%,transparent_70%)] pointer-events-none" />
          <div className="hidden md:block absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_70%)] pointer-events-none" />
          <div className="hidden md:block absolute bottom-[20%] left-[30%] w-[250px] h-[250px] rounded-full bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.18)_0%,transparent_70%)] pointer-events-none" />
        </>
      )}

      {/* Top edge glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
    </div>
  )
}
