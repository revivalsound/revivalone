import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { canRenderShader, usePrefersReducedMotion, useSeen } from '../../lib/shader-support'

/**
 * The Revival One flame in liquid metal — Spyda's BrandMark, pointed at the
 * flame. The paper-design shader stays in its own chunk and only loads once a
 * mark is on screen.
 */
const LiquidMetal = lazy(async () => {
  const { LiquidMetal: Shader } = await import('@paper-design/shaders-react')
  return { default: Shader }
})

const LOGO_SRC = '/assets/revival-flame-mark.png'
const MIN_SHADER_SIZE = 72

type BrandMarkProps = {
  size?: number
  tint?: string
  label?: string
  className?: string
  /** Run the shader below MIN_SHADER_SIZE too. Each holds a WebGL context. */
  animated?: boolean
  fallback?: 'image' | 'none'
}

export default function BrandMark({ size, tint = '#ff8fb0', label, className = '', animated = false, fallback = 'image' }: BrandMarkProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const [eligible, setEligible] = useState(false)

  useEffect(() => { setEligible(canRenderShader()) }, [])

  const seen = useSeen(hostRef, eligible)
  const small = size !== undefined && size < MIN_SHADER_SIZE
  const showShader = eligible && seen && (!small || animated)

  return (
    <div
      ref={hostRef}
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      {fallback === 'image' && <img
        src={LOGO_SRC}
        alt={label ?? ''}
        aria-hidden={label ? undefined : true}
        draggable={false}
        className="h-full w-full object-contain drop-shadow-[0_0_20px_rgba(255,92,138,0.3)]"
      />}

      {showShader && (
        <Suspense fallback={null}>
          <LiquidMetal
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            image={LOGO_SRC}
            colorBack="#00000000"
            colorTint={tint}
            repetition={small ? 1.5 : 2.4}
            softness={small ? 0.3 : 0.16}
            distortion={0.08}
            contour={small ? 0.25 : 0.45}
            shiftRed={0.32}
            shiftBlue={0.36}
            angle={70}
            scale={0.94}
            speed={reducedMotion ? 0 : 0.6}
            frame={1400}
            minPixelRatio={small ? 3 : 2}
            maxPixelCount={362000}
          />
        </Suspense>
      )}
    </div>
  )
}
