const cells = [
  { initials: "VI", name: "Victoria Island Cell", city: "Lagos", members: 48, schedule: "Thursdays · 6:30 PM", tone: "rose" },
  { initials: "LP", name: "Lekki Phase 1", city: "Lagos", members: 36, schedule: "Saturdays · 5:00 PM", tone: "violet" },
  { initials: "YC", name: "Yaba Central", city: "Lagos", members: 62, schedule: "Fridays · 6:00 PM", tone: "emerald" },
];

const prayers = [
  { person: "Tomi A.", time: "12 min ago", request: "Please pray for courage as I share the Gospel with my family this week.", prayers: 84, initials: "TA" },
  { person: "Anonymous", time: "36 min ago", request: "Trusting God for provision and wisdom as our outreach team prepares for August.", prayers: 51, initials: "A" },
];

export default function CommunityPage() {
  return (
    <div className="ro-page ro-community-page">
      <header className="ro-page-heading"><div><p className="ro-overline">COMMUNITY</p><h1>We carry the flame<br /><em>together.</em></h1><p>Find your people, share the journey, and build revival where you live.</p></div><button className="ro-primary-action">＋ Start a community</button></header>
      <div className="ro-tab-row"><button className="active">Discover</button><button>My communities <span>3</span></button><button>Prayer wall</button><button>People</button></div>

      <section className="ro-community-feature">
        <div className="ro-community-map"><div className="ro-map-lines" /><span className="ro-map-pin main">⌖</span><span className="ro-map-pin p2">⌖</span><span className="ro-map-pin p3">⌖</span><span className="ro-you-dot">YOU</span><div className="ro-map-location"><small>YOUR LOCATION</small><b>Victoria Island, Lagos</b></div></div>
        <div className="ro-community-callout"><p className="ro-overline bright">REVIVAL IS LOCAL</p><h2>There are <em>12 cells</em><br />within 15 km of you.</h2><p>Every cell is a home for prayer, scripture, friendship, and local mission.</p><button>Explore the map <span>↗</span></button><div><span><b>264</b><small>PEOPLE NEARBY</small></span><span><b>4</b><small>MEETING THIS WEEK</small></span></div></div>
      </section>

      <section className="ro-community-section">
        <div className="ro-section-title"><div><p className="ro-overline">NEARBY CELLS</p><h2>Find a community close to home</h2></div><button className="ro-filter-button">⌖ Lagos <span>⌄</span></button></div>
        <div className="ro-cell-grid">{cells.map((cell) => <article key={cell.name}><div className={`ro-cell-art ${cell.tone}`}><span className="ro-cell-monogram">{cell.initials}</span><div className="ro-member-faces"><i>AO</i><i>KM</i><i>+</i></div></div><div className="ro-cell-card-copy"><span>{cell.city.toUpperCase()} · {cell.members} MEMBERS</span><h3>{cell.name}</h3><p>{cell.schedule}</p><div><button>View community</button><button className="join">Join</button></div></div></article>)}</div>
      </section>

      <section className="ro-community-lower">
        <div className="ro-prayer-wall">
          <div className="ro-section-title compact"><div><p className="ro-overline">PRAYER WALL</p><h2>Stand in agreement</h2></div><button>Share a request ＋</button></div>
          {prayers.map((prayer) => <article className="ro-prayer-post" key={prayer.request}><div className="ro-prayer-person"><span className="ro-avatar medium">{prayer.initials}</span><div><b>{prayer.person}</b><small>{prayer.time}</small></div><button>•••</button></div><p>{prayer.request}</p><div><button className="pray-button">◌ I&apos;m praying</button><span>{prayer.prayers} people are praying</span><button>♡</button></div></article>)}
        </div>
        <aside className="ro-people-card"><p className="ro-overline">PEOPLE TO KNOW</p><h2>Build Kingdom relationships</h2>{["Ada Okafor|AO|Worship · Lagos","Michael Kalu|MK|Entrepreneur · Abuja","Eniola James|EJ|Missionary · Ibadan","Tolu Benson|TB|Student · Lagos"].map((person) => { const [name,initials,role] = person.split("|"); return <div key={name}><span className="ro-avatar medium">{initials}</span><p><b>{name}</b><small>{role}</small></p><button>Connect</button></div>; })}<button className="ro-view-all">Discover people →</button></aside>
      </section>
    </div>
  );
}
