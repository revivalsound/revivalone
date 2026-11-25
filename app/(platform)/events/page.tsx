"use client";

import { useState } from "react";
import { CalendarDays, MapPin, Video } from "lucide-react";
import { CreateInitiativeButton } from "@/app/components/AppShell";

const eventCards = [
  { category: "Prayer gathering", title: "Tuesday Fire Prayer", place: "Online", date: "Jul 28", time: "8:00 PM WAT", online: true },
  { category: "Worship night", title: "The Upper Room", place: "The Civic Centre · Lagos", date: "Aug 16", time: "6:00 PM WAT", online: false },
  { category: "Gospel bootcamp", title: "Light Up Abuja", place: "Millennium Park · Abuja", date: "Sep 5", time: "3:00 PM WAT", online: false },
  { category: "Tent meeting", title: "Revival Sound 2026", place: "Tafawa Balewa Square · Lagos", date: "Oct 24", time: "4:00 PM WAT", online: false },
  { category: "Bible study", title: "The Book of Acts", place: "Yaba Central Cell · Lagos", date: "Aug 8", time: "5:00 PM WAT", online: false },
  { category: "Outreach", title: "Love Your City", place: "Ajegunle · Lagos", date: "Aug 29", time: "9:00 AM WAT", online: false },
];

const filters = [
  { key: "all", label: "All formats" },
  { key: "in-person", label: "In person" },
  { key: "online", label: "Online" },
] as const;

export default function EventsPage() {
  const [filter, setFilter] = useState<typeof filters[number]["key"]>("all");
  const events = eventCards.filter((event) => filter === "all" || event.online === (filter === "online"));

  return (
    <div className="ro-page ro-events-page">
      <header className="ro-page-heading">
        <div><h1>Step into <em>the room.</em></h1><p>Gather for worship, prayer, training, and local mission.</p></div>
        <CreateInitiativeButton kind="event">Create an event</CreateInitiativeButton>
      </header>

      <section className="rev-event-feature" aria-labelledby="rev-event-feature-title">
        <div>
          <CalendarDays size={27} strokeWidth={1.6} aria-hidden="true" />
          <h2 id="rev-event-feature-title">Gather in person.<br /><em>Reach further together.</em></h2>
          <p>From a local Bible study to a city-wide gathering, make space for people to show up for one another.</p>
          <a className="rev-button rev-button--quiet" href="#event-directory">Browse the directory</a>
        </div>
      </section>

      <section className="rev-app-section" id="event-directory" aria-labelledby="rev-event-heading">
        <div className="ro-section-title">
          <div><h2 id="rev-event-heading">Event directory</h2><p>Example listings. Dates and venues are illustrative.</p></div>
          <div className="rev-filter-group" aria-label="Filter by event format">
            {filters.map(({ key, label }) => <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}
          </div>
        </div>
        <div className="rev-collection-list">
          {events.map((event) => {
            const Icon = event.online ? Video : MapPin;
            return (
              <article className="rev-collection-row rev-event-row" key={event.title}>
                <span className="rev-row-mark">{event.date}</span>
                <div><p>{event.category}</p><h3>{event.title}</h3><p><Icon size={14} aria-hidden="true" />{event.place}</p></div>
                <small>{event.time}</small>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
