import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { canRenderShader, usePrefersReducedMotion, useSeen } from '../lib/shader-support'

/** Spyda's hero mesh-gradient field, in Revival One's rose, ember and plum. */
const MeshGradient = lazy(async () => {
  const { MeshGradient: Shader } = await import('@paper-design/shaders-react')
  return { default: Shader }
})

/** Low-luminance: sits behind white text on in-app headers. */
const DEEP_COLORS = ['#1a0610', '#4a0b28', '#3a1408', '#1d0a24', '#5a1430']

/** The landing hero panel: a warm sky the pink button still stands out against. */
const VIVID_COLORS = ['#8a1b4a', '#b0204f', '#a2441a', '#c8325f', '#5a1a5e']

type HeroFieldProps = { className?: string; variant?: 'deep' | 'vivid'; strike?: boolean }

export default function HeroField({ className = '', variant = 'deep', strike = false }: HeroFieldProps) {
  const vivid = variant === 'vivid'
  const hostRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const [eligible, setEligible] = useState(false)

  useEffect(() => { setEligible(canRenderShader()) }, [])

  const seen = useSeen(hostRef, eligible)

  return (
    <div ref={hostRef} aria-hidden="true" className={`pointer-events-none absolute overflow-hidden ${className}`}>
      <div className={`${vivid ? 'hero-field-fallback--vivid' : 'hero-field-fallback'} absolute inset-0`} />

      {seen && (
        <Suspense fallback={null}>
          <MeshGradient
            className="hero-field-canvas absolute inset-0 h-full w-full"
            colors={vivid ? VIVID_COLORS : DEEP_COLORS}
            distortion={0.62}
            swirl={0.28}
            grainMixer={0.14}
            grainOverlay={0.05}
            speed={reducedMotion ? 0 : 0.16}
            frame={8200}
            minPixelRatio={1}
            maxPixelCount={900000}
          />
        </Suspense>
      )}

      {strike && <div className="hero-strike" />}
      <div className={`${vivid ? 'hero-field-scrim--vivid' : 'hero-field-scrim'} absolute inset-0`} />
    </div>
  )
}
