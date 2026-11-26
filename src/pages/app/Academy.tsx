import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap, Headphones, Play, User } from '../../components/ui/icons'
import BrandMark from '../../components/brand/BrandMark'
import EpisodeDots from '../../components/academy/EpisodeDots'
import { Deck } from '../../components/ui/kit'
import { PageHeader } from '../../components/app/AppShell'
import { COURSES, type Course } from '../../lib/content'
import { courseSeconds, nextEpisode, runtime, useCourseProgress } from '../../lib/academy'

export default function Academy() {
  const categories = [...new Set(COURSES.map(course => course.category))]
  const featured = COURSES[0]
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Rev Academy"
        title={<>Formed in truth. <span className="text-primary">Ready for impact.</span></>}
        lede="Audio courses in Scripture, prayer and leadership. Listen episode by episode, wherever you are."
      />

      <section className="mt-8 grid overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0b0607] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(176,32,79,0.45),transparent_75%)]" />
          <div className="absolute inset-[14%] rounded-full border border-white/10 [animation:spin_16s_linear_infinite] [border-style:dashed]" />
          <BrandMark size={150} />
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-10">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary"><Headphones className="h-4 w-4" /> Featured course</p>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{featured.title}</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{featured.summary}</p>
          <Link to={`/academy/${featured.slug}`} className="mt-6 inline-flex h-11 w-fit items-center gap-2 rounded-full bg-primary px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all hover:-translate-y-0.5"><Play className="h-4 w-4" /> Start listening</Link>
        </div>
      </section>

      <Deck className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map(category => (
          <div key={category} className="rounded-[18px] border border-white/[0.07] bg-surface p-4 text-center">
            <GraduationCap className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-2 text-xs font-semibold">{category}</p>
          </div>
        ))}
      </Deck>

      <section className="mt-12" aria-labelledby="library-heading">
        <h2 id="library-heading" className="font-heading text-2xl font-semibold">Course library</h2>
        <p className="mt-1 text-sm text-muted-foreground">Open a course to see its episodes. Finished episodes light up on the card.</p>
        <Deck className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {COURSES.map(course => <CourseCard key={course.slug} course={course} />)}
        </Deck>
      </section>
    </div>
  )
}

function CourseCard({ course }: { course: Course }) {
  const { progress } = useCourseProgress(course.slug)
  const count = course.episodes.length
  const done = progress.done.length
  const started = done > 0 || progress.position > 0
  return (
    <Link to={`/academy/${course.slug}`} className={`bolt-card group flex flex-col rounded-[26px] border p-6 transition-[transform,background-color] duration-300 hover:-translate-y-0.5 ${started ? 'bolt-card--hover border-primary/20 bg-surface-raised' : 'bolt-card--hover border-white/[0.07] bg-surface hover:bg-surface-raised'}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><Headphones className="h-5 w-5" /></span>
        <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{runtime(courseSeconds(course.slug))}</span>
      </div>
      <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{course.category}</p>
      <h3 className="mt-1.5 font-heading text-xl font-semibold leading-tight">{course.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{course.summary}</p>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><User className="h-3.5 w-3.5 text-primary" /> {course.teacher}</p>

      <div className="mt-5 border-t border-white/[0.07] pt-5">
        <div className="mb-3 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-foreground/85">Episodes</span>
          <span className={done ? 'font-semibold text-primary' : 'text-muted-foreground'}>{done === count ? 'Completed' : done ? `${done} of ${count} done` : `${count} episodes`}</span>
        </div>
        <EpisodeDots count={count} progress={progress} />
      </div>

      <span className="mt-6 inline-flex items-center justify-between rounded-full border border-white/[0.08] bg-white/[0.03] py-1.5 pl-4 pr-1.5 text-xs font-semibold transition-colors group-hover:border-primary/30 group-hover:bg-primary/10">
        {done === count ? 'Listen again' : started ? `Continue · episode ${nextEpisode(course, progress)}` : 'Start listening'}
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"><ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
      </span>
    </Link>
  )
}
