import { HandHeart, MapPin, UsersRound } from "lucide-react";
import { CreateInitiativeButton } from "@/app/components/AppShell";

const cells = [
  { initials: "VI", name: "Victoria Island Cell", city: "Lagos", schedule: "Thursdays · 6:30 PM" },
  { initials: "LP", name: "Lekki Phase 1", city: "Lagos", schedule: "Saturdays · 5:00 PM" },
  { initials: "YC", name: "Yaba Central", city: "Lagos", schedule: "Fridays · 6:00 PM" },
];

const prayerPrompts = [
  { title: "Courage to share the Gospel", text: "Pray for people sharing their faith with family and friends this week." },
  { title: "Wisdom for outreach teams", text: "Ask God for provision, unity, and wisdom for teams preparing to serve their cities." },
];

export default function CommunityPage() {
  return (
    <div className="ro-page ro-community-page">
      <header className="ro-page-heading">
        <div><h1>We carry the flame <em>together.</em></h1><p>Find a local cell and make room to pray with other believers.</p></div>
        <CreateInitiativeButton kind="cell">Start a community</CreateInitiativeButton>
      </header>

      <nav className="rev-section-nav" aria-label="Community sections">
        <a href="#revival-cells">Revival cells</a><a href="#prayer-wall">Prayer wall</a>
      </nav>

      <section className="rev-community-feature" aria-labelledby="rev-community-feature-title">
        <div>
          <UsersRound size={29} strokeWidth={1.5} aria-hidden="true" />
          <h2 id="rev-community-feature-title">Faith has an address.</h2>
          <p>Revival cells are small groups for prayer, Scripture, and serving the place you call home.</p>
          <a className="rev-button rev-button--quiet" href="#revival-cells">Explore local cells</a>
        </div>
        <img src="/revival-flame.png" width="260" height="260" alt="" />
      </section>

      <section className="rev-app-section" id="revival-cells" aria-labelledby="revival-cells-heading">
        <div className="ro-section-title"><div><h2 id="revival-cells-heading">Revival cells</h2><p>Example communities and meeting times.</p></div></div>
        <div className="rev-collection-list">
          {cells.map((cell) => (
            <article className="rev-collection-row" key={cell.name}>
              <span className="rev-row-mark">{cell.initials}</span>
              <div><h3>{cell.name}</h3><p><MapPin size={14} aria-hidden="true" />{cell.city}</p></div>
              <small>{cell.schedule}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="rev-app-section" id="prayer-wall" aria-labelledby="rev-prayer-heading">
        <div className="ro-section-title"><div><h2 id="rev-prayer-heading">Prayer wall</h2><p>Bring these prompts into your time of prayer.</p></div></div>
        <div className="rev-prayer-grid">
          {prayerPrompts.map((prayer) => (
            <article key={prayer.title}>
              <HandHeart size={22} strokeWidth={1.6} aria-hidden="true" />
              <h3>{prayer.title}</h3><p>{prayer.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
