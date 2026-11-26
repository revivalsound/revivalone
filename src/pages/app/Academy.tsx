import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap, Headphones, Play, Plus, User } from '../../components/ui/icons'
import BrandMark from '../../components/brand/BrandMark'
import EpisodeDots from '../../components/academy/EpisodeDots'
import { Deck, Notice } from '../../components/ui/kit'
import { PageHeader } from '../../components/app/AppShell'
import { useAuth } from '../../lib/AuthContext'
import { courseSeconds, fetchCourses, fetchProgress, nextEpisode, runtime, useCourseProgress, type Course } from '../../lib/academy'

export default function Academy() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[] | null>(null)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    fetchCourses().then(setCourses).catch(caught => { setCourses([]); setError(caught instanceof Error ? caught.message : 'We couldn’t load courses.') })
  }, [])
  useEffect(() => { if (user) void fetchProgress(user.id).catch(() => undefined) }, [user])

  const categories = ['All', ...new Set((courses ?? []).map(course => course.category))]
  const shown = (courses ?? []).filter(course => category === 'All' || course.category === category)
  const featured = courses?.[0]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Rev Academy"
        title={<>Formed in truth. <span className="text-primary">Ready for impact.</span></>}
        lede="Audio courses from teachers in the community. Listen episode by episode, wherever you are."
        action={<Link to="/create/course" className="group inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full bg-primary pl-5 pr-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_12px_32px_rgba(255,92,138,0.24)] transition-all hover:-translate-y-0.5 sm:self-auto">Teach a course <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#070405] text-primary"><Plus className="h-4 w-4" /></span></Link>}
      />

      {error && <div className="mt-6"><Notice tone="error">{error}</Notice></div>}

      {featured && (
        <section className="mt-8 grid overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0b0607] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden">
            {featured.cover_url ? <img src={featured.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" /> : <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(176,32,79,0.45),transparent_75%)]" />}
            <div className="absolute inset-[14%] rounded-full border border-white/10 [animation:spin_16s_linear_infinite] [border-style:dashed]" />
            <BrandMark size={130} />
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-10">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary"><Headphones className="h-4 w-4" /> Newest course · {featured.category}</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{featured.title}</h2>
            <p className="mt-3 line-clamp-3 max-w-md text-sm leading-6 text-muted-foreground">{featured.description}</p>
            {featured.teacher && <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><User className="h-3.5 w-3.5 text-primary" /> {featured.teacher}</p>}
            <Link to={`/academy/${featured.slug}`} className="mt-6 inline-flex h-11 w-fit items-center gap-2 rounded-full bg-primary px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all hover:-translate-y-0.5"><Play className="h-4 w-4" /> Start listening</Link>
          </div>
        </section>
      )}

      <section className="mt-10" aria-labelledby="library-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="library-heading" className="font-heading text-2xl font-semibold">Course library</h2>
            <p className="mt-1 text-sm text-muted-foreground">Finished episodes light up on each card.</p>
          </div>
          {categories.length > 2 && (
            <div className="flex gap-1 overflow-x-auto rounded-full border border-white/[0.08] bg-white/[0.03] p-1">
              {categories.map(name => <button key={name} type="button" aria-pressed={category === name} onClick={() => setCategory(name)} className={`h-9 shrink-0 rounded-full px-3.5 text-xs font-semibold transition-colors ${category === name ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{name}</button>)}
            </div>
          )}
        </div>

        {courses === null ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map(index => <div key={index} className="h-80 animate-pulse rounded-[26px] bg-surface" />)}</div>
        ) : shown.length ? (
          <Deck key={category} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shown.map(course => <CourseCard key={course.id} course={course} userId={user?.id} />)}
          </Deck>
        ) : !error && (
          <div className="mt-5 rounded-[26px] border border-dashed border-white/[0.1] bg-surface/60 px-6 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><GraduationCap className="h-6 w-6" /></span>
            <h3 className="mt-5 font-heading text-xl font-semibold">No courses yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Teach the first one. Record your episodes as audio, upload them, and the community can listen episode by episode.</p>
            <Link to="/create/course" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">Teach a course <ArrowRight className="h-4 w-4" /></Link>
          </div>
        )}
      </section>
    </div>
  )
}

function CourseCard({ course, userId }: { course: Course; userId?: string }) {
  const { progress } = useCourseProgress(course.id, userId)
  const count = course.episodes.length
  const done = progress.done.length
  const started = done > 0 || progress.position > 0
  return (
    <Link to={`/academy/${course.slug}`} className={`bolt-card bolt-card--hover group flex flex-col rounded-[26px] border p-6 transition-[transform,background-color] duration-300 hover:-translate-y-0.5 ${started ? 'border-primary/20 bg-surface-raised' : 'border-white/[0.07] bg-surface hover:bg-surface-raised'}`}>
      <div className="flex items-start justify-between gap-3">
        {course.cover_url
          ? <img src={course.cover_url} alt="" className="h-12 w-12 rounded-2xl object-cover" />
          : <span className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><Headphones className="h-5 w-5" /></span>}
        <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{runtime(courseSeconds(course))}</span>
      </div>
      <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{course.category}</p>
      <h3 className="mt-1.5 font-heading text-xl font-semibold leading-tight">{course.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{course.description}</p>
      {course.teacher && <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><User className="h-3.5 w-3.5 text-primary" /> {course.teacher}</p>}

      <div className="mt-5 border-t border-white/[0.07] pt-5">
        <div className="mb-3 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-foreground/85">Episodes</span>
          <span className={done ? 'font-semibold text-primary' : 'text-muted-foreground'}>{done === count ? 'Completed' : done ? `${done} of ${count} done` : `${count} episode${count > 1 ? 's' : ''}`}</span>
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
