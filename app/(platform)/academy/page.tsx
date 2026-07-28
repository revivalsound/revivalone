const courses = [
  { number: "01", category: "SPIRITUAL FORMATION", title: "Built in the Secret Place", teacher: "Pastor Nath Ade", lessons: 8, tone: "rose", progress: 64 },
  { number: "02", category: "LEADERSHIP", title: "Leading with Fire", teacher: "Sarah Kalu", lessons: 12, tone: "gold", progress: 0 },
  { number: "03", category: "KINGDOM BUSINESS", title: "Enterprise for Impact", teacher: "Femi Adebayo", lessons: 10, tone: "blue", progress: 0 },
  { number: "04", category: "EVANGELISM", title: "The Gospel in Your City", teacher: "David Ojo", lessons: 7, tone: "green", progress: 0 },
  { number: "05", category: "BIBLE", title: "Walking Through Acts", teacher: "Dr. Ada James", lessons: 14, tone: "violet", progress: 0 },
  { number: "06", category: "PRAYER", title: "Watchmen on the Wall", teacher: "Kemi Alabi", lessons: 9, tone: "amber", progress: 0 },
];

export default function AcademyPage() {
  return (
    <div className="ro-page ro-academy-page">
      <header className="ro-page-heading"><div><p className="ro-overline">REV ACADEMY</p><h1>Formed in truth.<br /><em>Ready for impact.</em></h1><p>Biblical depth, practical leadership, and the tools to build what God has placed in your hands.</p></div><div className="ro-academy-level"><span>LEVEL 04</span><b>Kingdom Builder</b><div><i style={{ width: "72%" }} /></div><small>1,440 / 2,000 XP</small></div></header>

      <section className="ro-academy-continue"><div className="ro-learning-visual"><span>CONTINUE LEARNING</span><b>01</b><img src="/revival-flame.png" alt="" /></div><div className="ro-learning-copy"><p className="ro-overline bright">SPIRITUAL FORMATION · COURSE 01</p><h2>Built in the<br /><em>Secret Place</em></h2><p>Build a life that stays rooted in God&apos;s presence when the room is quiet and no one is watching.</p><div className="ro-current-lesson"><span>06</span><div><small>UP NEXT</small><b>The discipline of abiding</b><p>18 min · Video lesson</p></div><button>▶</button></div><div className="ro-learning-progress"><span><i style={{ width: "64%" }} /></span><small>64% COMPLETE</small></div><button className="ro-light-action">Continue learning <span>→</span></button></div></section>

      <section className="ro-path-section"><div className="ro-section-title"><div><p className="ro-overline">YOUR PATH</p><h2>Foundations of a Kingdom Builder</h2></div><button className="ro-filter-button">View learning path →</button></div><div className="ro-path-row"><article className="done"><span>✓</span><p><small>STEP 01</small><b>Life in Christ</b></p></article><i /><article className="current"><span>02</span><p><small>STEP 02</small><b>Spiritual Formation</b></p></article><i /><article><span>03</span><p><small>STEP 03</small><b>Kingdom Leadership</b></p></article><i /><article><span>04</span><p><small>STEP 04</small><b>Sent to Build</b></p></article></div></section>

      <section className="ro-course-library"><div className="ro-section-title"><div><p className="ro-overline">COURSE LIBRARY</p><h2>Keep growing</h2></div><div className="ro-tab-row inline"><button className="active">Featured</button><button>New</button><button>Saved</button></div></div><div className="ro-course-grid">{courses.map((course) => <article key={course.number}><div className={`ro-course-art ${course.tone}`}><span>{course.category}</span><b>{course.number}</b>{course.progress > 0 && <i>IN PROGRESS</i>}</div><div className="ro-course-card-copy"><p>{course.category}</p><h3>{course.title}</h3><span>{course.teacher}</span><div><small>{course.lessons} lessons · 4.8 ★</small><button>→</button></div>{course.progress > 0 && <div className="ro-course-mini-progress"><i style={{ width: `${course.progress}%` }} /></div>}</div></article>)}</div></section>

      <section className="ro-certificate-banner"><div><span>✦</span><p className="ro-overline bright">YOUR MILESTONE</p><h2>One course away from your<br /><em>Spiritual Formation certificate.</em></h2><p>Complete “Built in the Secret Place” to unlock your first verified Revival One certificate.</p><button>View progress →</button></div><div className="ro-certificate"><img src="/revival-flame.png" alt="" /><small>REVIVAL ONE · REV ACADEMY</small><b>CERTIFICATE<br />OF FORMATION</b><span>Joshua Adeyemi</span><i>01</i></div></section>
    </div>
  );
}
