"use client";

import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";

const quickActions = [
  { icon: "◌", label: "Share a prayer", copy: "Let the community stand with you" },
  { icon: "⌖", label: "Find a cell", copy: "Meet believers close to home" },
  { icon: "◇", label: "Browse events", copy: "Step into the next gathering" },
];

export default function AppHomePage() {
  const { user } = useAuth();
  const firstName = String(user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Friend").split(/\s+/)[0];
  return (
    <div className="ro-page ro-home-page">
      <header className="ro-page-heading ro-home-heading"><div><p className="ro-overline">YOUR REVIVAL TODAY</p><h1>Good evening, <em>{firstName}.</em></h1><p>Here&apos;s what God is doing around you.</p></div><button className="ro-ghost-button">Customize home <span>✦</span></button></header>

      <section className="ro-home-grid">
        <article className="ro-hero-panel">
          <div className="ro-hero-copy"><p className="ro-overline bright">TODAY&apos;S WORD</p><blockquote>“Those who hope in the Lord will renew their strength. They will soar on wings like eagles.”</blockquote><span>ISAIAH 40:31</span><div><button>Read the chapter</button><button className="icon-only" aria-label="Save scripture">♡</button></div></div>
          <img src="/revival-flame.png" alt="" />
          <div className="ro-scripture-orbit" />
        </article>
        <article className="ro-live-panel">
          <div className="ro-live-art"><span>● LIVE NOW</span><i>◌</i></div>
          <div className="ro-live-details"><p>TUESDAY FIRE PRAYER</p><h2>One hour in His presence.</h2><div><span className="ro-avatar-stack"><i>AO</i><i>MK</i><i>+</i></span><small>1,284 praying now</small></div><button>Enter the room <span>→</span></button></div>
        </article>
      </section>

      <section className="ro-quick-grid">{quickActions.map((action) => <article key={action.label}><span>{action.icon}</span><div><h3>{action.label}</h3><p>{action.copy}</p></div><button aria-label={action.label}>↗</button></article>)}</section>

      <section className="ro-dashboard-grid">
        <div className="ro-dashboard-main">
          <div className="ro-section-title"><div><p className="ro-overline">UPCOMING</p><h2>Your next gatherings</h2></div><Link href="/events">View all <span>→</span></Link></div>
          <div className="ro-home-events">
            <article><div className="ro-event-thumb rose"><span>WORSHIP NIGHT</span><b>UPPER<br />ROOM</b></div><div className="ro-home-event-copy"><span>AUG <b>16</b></span><div><p>THE CIVIC CENTRE · LAGOS</p><h3>The Upper Room</h3><small>Sunday · 6:00 PM WAT</small></div><button>Registered ✓</button></div></article>
            <article><div className="ro-event-thumb gold"><span>GOSPEL BOOTCAMP</span><b>LIGHT<br />UP</b></div><div className="ro-home-event-copy"><span>SEP <b>05</b></span><div><p>MILLENNIUM PARK · ABUJA</p><h3>Light Up Abuja</h3><small>Saturday · 3:00 PM WAT</small></div><button className="outline">Register →</button></div></article>
          </div>
        </div>
        <aside className="ro-nearby-card">
          <div className="ro-section-title compact"><div><p className="ro-overline">NEAR YOU</p><h2>Your revival cell</h2></div><button>•••</button></div>
          <div className="ro-mini-map"><i className="road a" /><i className="road b" /><span className="ro-map-dot one">⌖</span><span className="ro-map-dot two" /></div>
          <div className="ro-cell-summary"><span className="ro-avatar medium">VI</span><div><h3>Victoria Island Cell</h3><p>Led by Kemi & Tobi · 48 members</p></div></div>
          <div className="ro-cell-next"><span>⌁</span><div><small>NEXT MEETING</small><b>Thursday · 6:30 PM</b></div><button>View cell</button></div>
        </aside>
      </section>

      <section className="ro-progress-grid">
        <article className="ro-course-progress-card"><div className="ro-course-cover"><span>CONTINUE LEARNING</span><b>01</b></div><div><p className="ro-overline">SPIRITUAL FORMATION</p><h2>Built in the Secret Place</h2><p>Lesson 6 of 8 · The discipline of abiding</p><div className="ro-progress-line"><span style={{ width: "64%" }} /></div><small>64% complete</small><Link href="/academy">Continue course →</Link></div></article>
        <article className="ro-prayer-pulse"><div><p className="ro-overline">PRAYER PULSE</p><h2>People are praying with you.</h2></div><span className="ro-pulse-ring"><i>27</i><small>PRAYERS</small></span><p>“Clarity and courage for the new assignment.”</p><div><span className="ro-avatar-stack"><i>NS</i><i>EA</i><i>TK</i></span><button>View request →</button></div></article>
      </section>
    </div>
  );
}
