"use client";

import Link from "next/link";
import { BookOpen, CalendarDays, ChevronRight, GraduationCap, HandHeart, UsersRound } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";

const paths = [
  { href: "/community#prayer-wall", label: "Prayer wall", copy: "Pray alongside the community", Icon: HandHeart },
  { href: "/community#revival-cells", label: "Revival cells", copy: "Find a community near you", Icon: UsersRound },
  { href: "/events", label: "Events", copy: "Explore the next gatherings", Icon: CalendarDays },
  { href: "/academy", label: "Rev Academy", copy: "Browse courses and learning paths", Icon: GraduationCap },
] as const;

export default function AppHomePage() {
  const { user } = useAuth();
  const firstName = String(user?.user_metadata?.full_name || user?.email?.split("@")[0] || "").trim().split(/\s+/)[0];

  return (
    <div className="ro-page ro-home-page">
      <header className="ro-page-heading ro-home-heading">
        <div>
          <h1>{firstName ? <>Welcome back, <em>{firstName}.</em></> : <>Welcome to <em>Revival One.</em></>}</h1>
          <p>Make time for the Word, prayer, and the people you’re walking with.</p>
        </div>
      </header>

      <div className="rev-home-feature">
        <article className="rev-home-word">
          <div>
            <p className="rev-home-reference"><BookOpen size={17} aria-hidden="true" /> Today’s Word · Isaiah 40:31</p>
            <h2>Strength for <em>the waiting.</em></h2>
            <p>Find renewed strength when the road ahead feels long.</p>
            <Link href="/word/isaiah-40-31" className="rev-button">Read the chapter</Link>
          </div>
        </article>
        <aside className="rev-home-reflection">
          <HandHeart size={27} strokeWidth={1.5} aria-hidden="true" />
          <h2>Pray with someone today.</h2>
          <p>Take a moment to lift up a request from the community.</p>
          <Link href="/community#prayer-wall">Visit the prayer wall <ChevronRight size={16} aria-hidden="true" /></Link>
        </aside>
      </div>

      <section className="rev-home-paths" aria-labelledby="rev-home-paths-heading">
        <div className="ro-section-title"><h2 id="rev-home-paths-heading">Your next step</h2></div>
        <div className="rev-home-path-grid">
          {paths.map(({ href, label, copy, Icon }) => (
            <Link href={href} key={href} className="rev-home-path">
              <Icon size={23} strokeWidth={1.65} aria-hidden="true" />
              <div><h3>{label}</h3><p>{copy}</p></div>
              <ChevronRight size={17} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
