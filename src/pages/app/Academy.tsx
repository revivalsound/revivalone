import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, GraduationCap, User } from '../../components/ui/icons'
import BrandMark from '../../components/brand/BrandMark'
import { BoltDisclosure, Deck } from '../../components/ui/kit'
import { PageHeader } from '../../components/app/AppShell'
import { COURSES, TODAYS_WORD } from '../../lib/content'

export default function Academy() {
  const categories = [...new Set(COURSES.map(course => course.category))]
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Rev Academy"
        title={<>Formed in truth. <span className="text-primary">Ready for impact.</span></>}
        lede="Study Scripture, build habits of prayer and grow in practical leadership."
      />

      <section className="mt-8 grid overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0b0607] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(176,32,79,0.45),transparent_75%)]" />
          <div className="absolute inset-[14%] rounded-full border border-white/10 [animation:spin_16s_linear_infinite] [border-style:dashed]" />
          <BrandMark size={150} />
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Featured course</p>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">Built in the <span className="text-primary">Secret Place</span></h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Explore the practices that keep you rooted in God’s presence when life gets noisy.</p>
          <Link to={`/word/${TODAYS_WORD.slug}`} className="mt-6 inline-flex h-11 w-fit items-center gap-2 rounded-full bg-primary px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all hover:-translate-y-0.5">Read today’s devotional <ArrowRight className="h-4 w-4" /></Link>
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
        <p className="mt-1 text-sm text-muted-foreground">Preview the Rev Academy curriculum. Open a course to see what it covers.</p>
        <div className="mt-5 space-y-3">
          {COURSES.map((course, index) => (
            <BoltDisclosure key={course.title} icon={BookOpen} title={course.title} meta={`${course.category} · ${course.lessons} lessons`} defaultOpen={index === 0}>
              <p>{course.summary}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs"><User className="h-3.5 w-3.5 text-primary" /> Taught by {course.teacher}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {Array.from({ length: course.lessons }, (_, lesson) => (
                  <span key={lesson} className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-[10px] font-semibold text-foreground/70">{lesson + 1}</span>
                ))}
              </div>
            </BoltDisclosure>
          ))}
        </div>
      </section>
    </div>
  )
}
