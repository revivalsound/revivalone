import type { CourseProgress } from '../../lib/academy'

/**
 * The episode numbers on a course card. Finished episodes light up in brand
 * pink; the next one to listen to gets a pink ring.
 */
export default function EpisodeDots({ count, progress, size = 'h-8 w-8 text-[11px]' }: { count: number; progress: CourseProgress; size?: string }) {
  const next = Array.from({ length: count }, (_, index) => index + 1).find(episode => !progress.done.includes(episode))
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label={`${progress.done.length} of ${count} episodes finished`}>
      {Array.from({ length: count }, (_, index) => {
        const episode = index + 1
        const done = progress.done.includes(episode)
        const upNext = !done && episode === next && progress.done.length > 0
        return (
          <li
            key={episode}
            aria-label={`Episode ${episode}${done ? ', finished' : upNext ? ', up next' : ''}`}
            className={`flex ${size} items-center justify-center rounded-full font-heading font-semibold transition-colors duration-500 ${done
              ? 'bg-primary text-primary-foreground shadow-[0_0_0_3px_rgba(255,92,138,0.18),0_6px_16px_rgba(255,92,138,0.35)]'
              : upNext ? 'border border-primary text-primary' : 'border border-white/[0.09] bg-white/[0.03] text-foreground/60'}`}
          >
            {episode}
          </li>
        )
      })}
    </ol>
  )
}
