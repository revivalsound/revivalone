"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const appDestinations = [
  { href: "/home", number: "01", title: "Home", copy: "Your daily word, prayer pulse, gatherings, and next Kingdom step." },
  { href: "/community", number: "02", title: "Community", copy: "Find revival cells, share prayer requests, and connect in your city." },
  { href: "/events", number: "03", title: "Events", copy: "Discover worship nights, outreaches, bootcamps, and conferences." },
  { href: "/academy", number: "04", title: "Academy", copy: "Grow through biblical courses, leadership paths, and formation tracks." },
];

const pillars = [
  {
    number: "01",
    title: "Lives for Christ",
    copy: "A daily rhythm of prayer, scripture, worship, and wholehearted devotion.",
  },
  {
    number: "02",
    title: "Builds Kingdom",
    copy: "Ideas become ventures through mentorship, community, and practical support.",
  },
  {
    number: "03",
    title: "Funds the Gospel",
    copy: "Generosity moves with clarity toward missionaries, people, and projects.",
  },
  {
    number: "04",
    title: "Disciples nations",
    copy: "Local communities grow into a connected movement, city by city.",
  },
];

const ecosystem = [
  { mark: "⌖", title: "Revival Cells", copy: "Find your people. Gather weekly. Carry revival into your city." },
  { mark: "◌", title: "Prayer Network", copy: "Share a burden, stand in agreement, and celebrate answered prayer." },
  { mark: "△", title: "Rev Academy", copy: "Grow through focused courses, biblical learning, and leadership tracks." },
  { mark: "↗", title: "Kingdom Enterprise", copy: "Pitch bold ideas, meet mentors, and build businesses that serve." },
  { mark: "◇", title: "Kingdom Finance", copy: "Fund trusted assignments and follow the impact of every gift." },
  { mark: "✦", title: "Revival Events", copy: "Step into worship nights, outreaches, conferences, and tent meetings." },
];

const events = [
  {
    month: "AUG",
    day: "16",
    type: "WORSHIP NIGHT",
    title: "The Upper Room",
    place: "The Civic Centre · Lagos",
    time: "6:00 PM WAT",
    tone: "rose",
  },
  {
    month: "SEP",
    day: "05",
    type: "CITY OUTREACH",
    title: "Light Up Abuja",
    place: "Millennium Park · Abuja",
    time: "3:00 PM WAT",
    tone: "amber",
  },
  {
    month: "OCT",
    day: "24",
    type: "TENT MEETING",
    title: "Revival Sound 2026",
    place: "Tafawa Balewa Square · Lagos",
    time: "4:00 PM WAT",
    tone: "violet",
  },
];

const cells = [
  { id: 0, city: "Victoria Island", distance: "1.8 km away", lead: "Led by Kemi & Tobi", members: 48, day: "Thursdays · 6:30 PM" },
  { id: 1, city: "Lekki Phase 1", distance: "4.2 km away", lead: "Led by David A.", members: 36, day: "Saturdays · 5:00 PM" },
  { id: 2, city: "Yaba Central", distance: "8.7 km away", lead: "Led by Dara & Feyi", members: 62, day: "Fridays · 6:00 PM" },
];

export default function Home() {
  const [joinOpen, setJoinOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const [selectedCell, setSelectedCell] = useState(0);

  function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJoined(true);
  }

  function scrollToEvents() {
    document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Revival One home">
          <span className="brand-crop"><img src="/revival-one-logo.png" alt="Revival One" /></span>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/home">Home</Link>
          <Link href="/community">Community</Link>
          <Link href="/events">Events</Link>
          <Link href="/academy">Academy</Link>
        </nav>
        <div className="landing-account-actions"><Link className="nav-sign-in" href="/sign-in">Sign in</Link><Link className="nav-cta" href="/sign-up">Join Revival One <span>→</span></Link></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-aurora aurora-one" />
        <div className="hero-aurora aurora-two" />
        <div className="hero-grain" />
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> A movement in every city</p>
          <h1>One movement.<br />One revival.<br /><em>One generation.</em></h1>
          <p className="hero-lede">A digital home for believers to gather, grow, build, and fund Kingdom impact—wherever you are.</p>
          <div className="hero-actions">
            <Link className="primary-button" href="/sign-up">Join the movement <span>→</span></Link>
            <button className="text-button" onClick={scrollToEvents}>Explore events <span>↓</span></button>
          </div>
          <div className="social-proof">
            <div className="avatar-stack" aria-hidden="true"><span>JM</span><span>EA</span><span>TK</span><span>+</span></div>
            <p><strong>12,400+</strong><br />believers gathering globally</p>
          </div>
        </div>

        <div className="hero-visual" aria-label="Revival One application preview">
          <img className="hero-flame" src="/revival-flame.png" alt="" />
          <div className="app-card">
            <div className="app-card-top">
              <span className="mini-brand"><img src="/revival-flame.png" alt="" /></span>
              <span className="location-pill">⌖ Lagos, NG</span>
              <button aria-label="Notifications">◌</button>
            </div>
            <p className="app-kicker">GOOD EVENING, JOSHUA</p>
            <h2>Revival is closer<br />than you think.</h2>
            <div className="live-event-card">
              <div className="event-image-glow"><span className="live-badge">● LIVE</span></div>
              <div className="live-event-copy">
                <p>HAPPENING NOW</p>
                <h3>Tuesday Fire Prayer</h3>
                <span>1,284 are praying</span>
                <button onClick={() => setJoinOpen(true)}>Join prayer <b>→</b></button>
              </div>
            </div>
            <div className="app-quick-row">
              <Link href="/community"><b>＋</b><span>Prayer</span></Link>
              <Link href="/events"><b>◇</b><span>Events</span></Link>
              <Link href="/academy"><b>△</b><span>Learn</span></Link>
            </div>
          </div>
          <div className="floating-note note-top"><span>✦</span><p><b>Prayer answered</b><small>2 minutes ago</small></p></div>
          <div className="floating-note note-bottom"><span>↗</span><p><b>New cell nearby</b><small>1.8 km from you</small></p></div>
        </div>
      </section>

      <section className="ticker" aria-label="Revival One focus areas">
        <div><span>PRAYER</span><i>✦</i><span>COMMUNITY</span><i>✦</i><span>DISCIPLESHIP</span><i>✦</i><span>KINGDOM ENTERPRISE</span><i>✦</i><span>GENEROSITY</span><i>✦</i><span>REVIVAL</span></div>
      </section>

      <section className="app-gateway" aria-labelledby="app-gateway-title">
        <div className="app-gateway-heading"><div><p className="eyebrow muted">ENTER THE DIGITAL HOME</p><h2 id="app-gateway-title">Your revival journey,<br /><em>all in one place.</em></h2></div><p>Every core space is now one tap away. Explore freely, then create an account when you are ready to participate.</p></div>
        <div className="app-gateway-grid">{appDestinations.map((item) => <Link href={item.href} key={item.href}><span>{item.number}</span><div><h3>{item.title}</h3><p>{item.copy}</p></div><b>↗</b></Link>)}</div>
      </section>

      <section className="section movement" id="movement">
        <div className="section-heading split-heading">
          <div><p className="eyebrow muted">THE MANDATE</p><h2>Revival is not an event.<br /><em>It is a people.</em></h2></div>
          <p>We are raising a generation that carries the presence of God into every sphere of culture—and builds what the Kingdom needs next.</p>
        </div>
        <div className="pillar-grid">
          {pillars.map((pillar) => (
            <article className="pillar-card" key={pillar.number}>
              <span>{pillar.number}</span><div className="pillar-line" /><h3>{pillar.title}</h3><p>{pillar.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section ecosystem">
        <div className="section-heading centered">
          <p className="eyebrow muted">ONE CONNECTED ECOSYSTEM</p>
          <h2>Everything you need to<br /><em>carry the flame.</em></h2>
          <p>From your first prayer request to your first funded venture, Revival One brings your Kingdom journey into one beautiful space.</p>
        </div>
        <div className="ecosystem-grid">
          {ecosystem.map((item, index) => (
            <article className={`feature-card feature-${index + 1}`} key={item.title}>
              <span className="feature-mark">{item.mark}</span><h3>{item.title}</h3><p>{item.copy}</p><button aria-label={`Explore ${item.title}`}>↗</button>
            </article>
          ))}
        </div>
      </section>

      <section className="section events" id="events">
        <div className="section-heading events-heading">
          <div><p className="eyebrow muted">STEP INTO THE ROOM</p><h2>Gatherings that<br /><em>mark generations.</em></h2></div>
          <Link className="outline-button" href="/events">View all events <span>→</span></Link>
        </div>
        <div className="event-grid">
          {events.map((event) => (
            <article className={`event-card ${event.tone}`} key={event.title}>
              <div className="event-art"><span className="event-type">{event.type}</span><div className="event-orb" /><p>REVIVAL<br />ONE</p></div>
              <div className="event-details">
                <div className="event-date"><b>{event.day}</b><span>{event.month}</span></div>
                <div><h3>{event.title}</h3><p>{event.place}<br />{event.time}</p></div>
                <button aria-label={`Register for ${event.title}`} onClick={() => setJoinOpen(true)}>→</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section cells-section">
        <div className="cells-copy">
          <p className="eyebrow muted">FIND YOUR PEOPLE</p>
          <h2>Revival lives<br /><em>around the corner.</em></h2>
          <p>Meet believers in your city. Pray together, study together, and turn ordinary homes into places of encounter.</p>
          <div className="cell-list">
            {cells.map((cell) => (
              <button className={selectedCell === cell.id ? "cell-row active" : "cell-row"} key={cell.city} onClick={() => setSelectedCell(cell.id)}>
                <span className="cell-avatar">{cell.city.slice(0, 2).toUpperCase()}</span>
                <span><b>{cell.city}</b><small>{cell.day}</small></span>
                <em>{cell.distance}</em>
              </button>
            ))}
          </div>
          <button className="primary-button" onClick={() => setJoinOpen(true)}>Find a cell near me <span>⌖</span></button>
        </div>
        <div className="map-card" aria-label="Map of nearby revival cells">
          <div className="map-grid" />
          <span className="map-road road-one" /><span className="map-road road-two" /><span className="map-road road-three" />
          <button className="map-pin pin-one" onClick={() => setSelectedCell(0)} aria-label="Victoria Island cell"><i /></button>
          <button className="map-pin pin-two" onClick={() => setSelectedCell(1)} aria-label="Lekki Phase 1 cell"><i /></button>
          <button className="map-pin pin-three" onClick={() => setSelectedCell(2)} aria-label="Yaba Central cell"><i /></button>
          <div className="map-info">
            <span className="cell-avatar large">{cells[selectedCell].city.slice(0, 2).toUpperCase()}</span>
            <div><p>NEAREST REVIVAL CELL</p><h3>{cells[selectedCell].city}</h3><span>{cells[selectedCell].lead} · {cells[selectedCell].members} members</span></div>
            <button onClick={() => setJoinOpen(true)}>Join cell →</button>
          </div>
        </div>
      </section>

      <section className="section academy" id="academy">
        <div className="academy-panel">
          <div className="academy-copy">
            <p className="eyebrow">REV ACADEMY</p>
            <h2>Formed in truth.<br /><em>Ready for impact.</em></h2>
            <p>Go deeper with biblical courses, practical leadership tracks, and learning paths designed for the life you are called to build.</p>
            <div className="academy-stats"><span><b>42</b>COURSES</span><span><b>18</b>TEACHERS</span><span><b>6.8K</b>LEARNERS</span></div>
            <Link className="light-button" href="/academy">Start learning <span>→</span></Link>
          </div>
          <div className="course-stack">
            <article className="course-card course-main"><div className="course-art"><span>FEATURED PATH</span><b>01</b></div><p>SPIRITUAL FORMATION</p><h3>Built in the Secret Place</h3><div className="course-progress"><span style={{ width: "64%" }} /></div><small>8 lessons · 64% complete</small></article>
            <article className="course-card course-back-one"><span>LEADERSHIP</span><h3>Leading with Fire</h3></article>
            <article className="course-card course-back-two"><span>BUSINESS</span><h3>Kingdom Enterprise</h3></article>
          </div>
        </div>
      </section>

      <section className="section impact" id="impact">
        <div className="impact-card">
          <div className="impact-copy"><p className="eyebrow muted">KINGDOM IMPACT</p><h2>Fund what<br /><em>heaven is building.</em></h2><p>Back verified missionaries, revival projects, and Kingdom businesses—with clear updates from commitment to impact.</p><button className="primary-button" onClick={() => setJoinOpen(true)}>Become a financier <span>↗</span></button></div>
          <div className="impact-dashboard">
            <div className="impact-top"><span>IMPACT THIS MONTH</span><b>₦18.4M</b><small>deployed across 24 assignments</small></div>
            <div className="impact-bars"><span style={{ height: "38%" }} /><span style={{ height: "55%" }} /><span style={{ height: "44%" }} /><span style={{ height: "74%" }} /><span style={{ height: "62%" }} /><span style={{ height: "88%" }} /><span style={{ height: "100%" }} /></div>
            <div className="impact-legend"><span><i className="pink" /> Businesses <b>42%</b></span><span><i className="white" /> Missions <b>34%</b></span><span><i className="gray" /> Revival <b>24%</b></span></div>
          </div>
        </div>
        <div className="impact-numbers"><span><b>84</b><small>ACTIVE CELLS</small></span><span><b>12.4K</b><small>BELIEVERS</small></span><span><b>₦142M</b><small>KINGDOM IMPACT</small></span><span><b>18</b><small>CITIES</small></span></div>
      </section>

      <section className="final-cta">
        <img src="/revival-flame.png" alt="" />
        <p className="eyebrow">THIS IS YOUR INVITATION</p>
        <h2>The fire is spreading.<br /><em>Come carry it.</em></h2>
        <p>Join a generation building, giving, praying, and living for one name.</p>
        <Link className="light-button" href="/sign-up">Join Revival One <span>→</span></Link>
      </section>

      <footer>
        <div className="footer-brand"><span className="brand-crop footer-logo"><img src="/revival-one-logo.png" alt="Revival One" /></span><p>One movement. One revival. One generation.</p></div>
        <div className="footer-links"><div><b>APP</b><Link href="/home">Home</Link><Link href="/community">Community</Link><Link href="/events">Events</Link><Link href="/academy">Academy</Link></div><div><b>ACCOUNT</b><Link href="/sign-up">Create account</Link><Link href="/sign-in">Sign in</Link><a href="mailto:hello@revival.one">Contact</a></div><div><b>FOLLOW</b><a href="#top">Instagram</a><a href="#top">YouTube</a><a href="#top">X / Twitter</a></div></div>
        <div className="footer-bottom"><span>© 2026 Revival One</span><span>Made for the Kingdom.</span><span><a href="#top">Privacy</a> · <a href="#top">Terms</a></span></div>
      </footer>

      {joinOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setJoinOpen(false)}>
          <div className="join-modal" role="dialog" aria-modal="true" aria-labelledby="join-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close" onClick={() => setJoinOpen(false)}>×</button>
            <img src="/revival-flame.png" alt="" />
            {joined ? <div className="success-state"><span>✓</span><h2>You are in.</h2><p>Welcome to the movement. Watch your inbox for the next step.</p><button className="primary-button" onClick={() => { setJoinOpen(false); setJoined(false); }}>Done</button></div> : <><p className="eyebrow muted">JOIN THE MOVEMENT</p><h2 id="join-title">Find your place<br /><em>in the story.</em></h2><p>Tell us where you are and we will help you discover a nearby cell, gathering, and next step.</p><form onSubmit={submitJoin}><label>EMAIL ADDRESS<input required type="email" placeholder="you@example.com" /></label><label>YOUR CITY<input required type="text" placeholder="Lagos, Nigeria" /></label><button className="primary-button" type="submit">Continue <span>↗</span></button></form></>}
          </div>
        </div>
      )}

    </main>
  );
}
