import { useEffect, useState } from 'react'

/**
 * A profile photo that never leaves an empty circle: if the image fails to load
 * (a slow storage edge, a stale cached miss), it retries once with a fresh link,
 * then falls back to the initials.
 */
export default function PhotoImg({ src, fallback, className = 'h-full w-full object-cover', lazy = false }: { src: string; fallback: string; className?: string; lazy?: boolean }) {
  const [attempt, setAttempt] = useState(0)
  useEffect(() => { setAttempt(0) }, [src])
  if (attempt > 1) return <>{fallback}</>
  const url = attempt === 1 ? `${src}${src.includes('?') ? '&' : '?'}retry=${Date.now()}` : src
  return <img key={url} src={url} alt="" decoding="async" loading={lazy ? 'lazy' : 'eager'} onError={() => setAttempt(value => value + 1)} className={className} />
}
