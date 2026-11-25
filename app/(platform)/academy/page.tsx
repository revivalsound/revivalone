import Link from "next/link";
import { BookOpen, ChevronDown } from "lucide-react";
import { AcademyArtwork } from "@/app/components/AcademyArtwork";

const courses = [
  { category: "Spiritual formation", title: "Built in the Secret Place", teacher: "Pastor Nath Ade", lessons: 8 },
  { category: "Leadership", title: "Leading with Fire", teacher: "Sarah Kalu", lessons: 12 },
  { category: "Kingdom business", title: "Enterprise for Impact", teacher: "Femi Adebayo", lessons: 10 },
  { category: "Evangelism", title: "The Gospel in Your City", teacher: "David Ojo", lessons: 7 },
  { category: "Bible", title: "Walking Through Acts", teacher: "Dr. Ada James", lessons: 14 },
  { category: "Prayer", title: "Watchmen on the Wall", teacher: "Kemi Alabi", lessons: 9 },
];

export default function AcademyPage() {
  return (
    <div className="ro-page ro-academy-page">
      <header className="ro-page-heading">
        <div><h1>Formed in truth.<br /><em>Ready for impact.</em></h1><p>Study Scripture, build habits of prayer, and grow in practical leadership.</p></div>
      </header>

      <section className="rev-academy-feature" aria-labelledby="rev-academy-feature-title">
        <AcademyArtwork />
        <div>
          <h2 id="rev-academy-feature-title">Built in the <em>Secret Place</em></h2>
          <p>Explore the practices that keep you rooted in God’s presence when life gets noisy.</p>
          <Link className="rev-button" href="/word/isaiah-40-31">Read today’s devotional</Link>
        </div>
      </section>

      <section className="rev-app-section" aria-labelledby="rev-academy-library">
        <div className="ro-section-title"><div><h2 id="rev-academy-library">Course library</h2><p>Preview the Rev Academy curriculum.</p></div></div>
        <div className="rev-course-list">
          {courses.map((course) => (
            <details key={course.title}>
              <summary>
                <span className="rev-row-mark"><BookOpen size={20} aria-hidden="true" /></span>
                <span><strong>{course.title}</strong><small>{course.category} · {course.lessons} lessons</small></span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <p>Instructor: {course.teacher}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
