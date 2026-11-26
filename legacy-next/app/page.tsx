import Link from "next/link";
import { ArrowUpRight, AudioLines, BookOpen, CalendarDays, ChevronRight, HeartHandshake, UsersRound } from "lucide-react";
import { FlameMark } from "./components/FlameMark";
import "./landing.css";

const destinations = [
  { href: "/home", title: "Home", description: "Begin with Scripture and find your next step.", Icon: BookOpen },
  { href: "/community", title: "Community", description: "Find a local cell and pray with other believers.", Icon: UsersRound },
  { href: "/events", title: "Events", description: "Explore worship nights, outreach, and gospel bootcamps.", Icon: CalendarDays },
  { href: "/academy", title: "Rev Academy", description: "Study Scripture and grow in practical leadership.", Icon: AudioLines },
] as const;

export default function LandingPage() {
  return (
    <div className="rev-landing">
      <a className="rev-skip" href="#main-content">Skip to content</a>
      <header className="rev-header">
        <div className="rev-wrap rev-nav">
          <Link className="rev-brand" href="/" aria-label="Revival One home">
            <img src="/revival-flame.png" width="42" height="42" alt="" />
            <span>Revival <strong>One</strong></span>
          </Link>
          <nav aria-label="Main navigation" className="rev-nav-links">
            {destinations.slice(1).map(({ href, title }) => <Link key={href} href={href}>{title}</Link>)}
          </nav>
          <div className="rev-nav-actions">
            <Link href="/sign-in">Sign in</Link>
            <Link className="rev-button rev-button--small" href="/sign-up">Join Revival One</Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="rev-hero rev-wrap" aria-labelledby="revival-hero">
          <div className="rev-hero-copy" data-enter>
            <h1 id="revival-hero">Faith is meant<br className="rev-desktop-break" /> to be <em>lived together.</em></h1>
            <p>Find people to pray with, gatherings worth showing up for, and biblical teaching you can carry into everyday life.</p>
            <div className="rev-hero-actions">
              <Link className="rev-button" href="/sign-up">Join the movement</Link>
              <Link className="rev-button rev-button--quiet" href="/home">Explore the app</Link>
            </div>
            <p className="rev-motto">One movement. One revival. One generation.</p>
          </div>
          <div className="rev-hero-art">
            <Link className="rev-devotional" href="/word/isaiah-40-31">
              <span className="rev-devotional-icon"><BookOpen size={20} aria-hidden="true" /></span>
              <div><small>Today’s Word · Isaiah 40:31</small><strong>Strength for the waiting</strong></div>
              <ArrowUpRight size={19} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="rev-gateway" aria-labelledby="revival-explore">
          <div className="rev-wrap rev-gateway-inner">
            <div className="rev-section-intro">
              <h2 id="revival-explore">Make room for <em>what matters.</em></h2>
              <p>Take your next step in Scripture, prayer, discipleship, or life in community.</p>
            </div>
            <div className="rev-destination-list">
              {destinations.map(({ href, title, description, Icon }) => (
                <Link key={href} href={href} className="rev-destination">
                  <span className="rev-destination-icon"><Icon size={23} aria-hidden="true" /></span>
                  <span><strong>{title}</strong><small>{description}</small></span>
                  <ChevronRight size={20} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="rev-cell-section rev-wrap" aria-labelledby="revival-cells">
          <div className="rev-cell-art" aria-hidden="true"><FlameMark /></div>
          <div className="rev-cell-copy">
            <h2 id="revival-cells">Revival Cells</h2>
            <p>A place to be known. Find believers in your city who meet to pray, study Scripture, and serve their neighbours.</p>
            <Link className="rev-button rev-button--quiet" href="/community">Find a community</Link>
          </div>
        </section>

        <section className="rev-invitation">
          <div className="rev-wrap rev-invitation-inner">
            <HeartHandshake size={30} strokeWidth={1.5} aria-hidden="true" />
            <h2>There’s a place <em>for you here.</em></h2>
            <Link className="rev-button" href="/sign-up">Create your account</Link>
          </div>
        </section>
      </main>

      <footer className="rev-footer">
        <div className="rev-wrap rev-footer-inner">
          <Link className="rev-brand" href="/"><img src="/revival-flame.png" width="42" height="42" alt="" /><span>Revival <strong>One</strong></span></Link>
          <nav aria-label="Footer navigation">{destinations.map(({ href, title }) => <Link key={href} href={href}>{title}</Link>)}</nav>
          <a href="mailto:hello@revival.one">Contact</a>
          <small>© 2026 Revival One</small>
        </div>
      </footer>
    </div>
  );
}
