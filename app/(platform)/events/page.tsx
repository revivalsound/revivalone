const eventCards = [
  { tag: "PRAYER GATHERING", title: "Tuesday Fire Prayer", place: "Online · Revival One Live", date: "JUL 28", time: "8:00 PM", tone: "fire", status: "Join live" },
  { tag: "WORSHIP NIGHT", title: "The Upper Room", place: "The Civic Centre · Lagos", date: "AUG 16", time: "6:00 PM", tone: "rose", status: "Registered" },
  { tag: "GOSPEL BOOTCAMP", title: "Light Up Abuja", place: "Millennium Park · Abuja", date: "SEP 05", time: "3:00 PM", tone: "gold", status: "Register" },
  { tag: "TENT MEETING", title: "Revival Sound 2026", place: "Tafawa Balewa Square · Lagos", date: "OCT 24", time: "4:00 PM", tone: "violet", status: "Register" },
  { tag: "BIBLE STUDY", title: "The Book of Acts", place: "Yaba Central Cell · Lagos", date: "AUG 08", time: "5:00 PM", tone: "blue", status: "Join cell" },
  { tag: "OUTREACH", title: "Love Your City", place: "Ajegunle · Lagos", date: "AUG 29", time: "9:00 AM", tone: "green", status: "Volunteer" },
];

export default function EventsPage() {
  return (
    <div className="ro-page ro-events-page">
      <header className="ro-page-heading"><div><p className="ro-overline">GATHERINGS</p><h1>Step into<br /><em>the room.</em></h1><p>Prayer, worship, training, and mission—every gathering is an invitation.</p></div><button className="ro-primary-action">＋ Create an event</button></header>
      <section className="ro-featured-event"><div className="ro-featured-copy"><span className="ro-live-chip">FEATURED GATHERING</span><p>24–26 OCTOBER · LAGOS</p><h2>Revival Sound<br /><em>2026</em></h2><p>Three days under the tent. One generation marked by the presence of God and sent back into the nations.</p><div><button>Reserve your place <span>↗</span></button><span><b>3,842</b><small>already registered</small></span></div></div><div className="ro-featured-visual"><img src="/revival-flame.png" alt="" /><span className="ro-big-year">26</span><div className="ro-countdown"><span><b>87</b>DAYS</span><i /><span><b>14</b>HOURS</span><i /><span><b>32</b>MINS</span></div></div></section>

      <div className="ro-event-toolbar"><div className="ro-tab-row inline"><button className="active">All events</button><button>Near me</button><button>Online</button><button>My events</button></div><div><button className="ro-filter-button">Any date <span>⌄</span></button><button className="ro-filter-button">All types <span>⌄</span></button></div></div>
      <section className="ro-event-listing"><div className="ro-section-title"><div><p className="ro-overline">UPCOMING</p><h2>What&apos;s happening next</h2></div><span className="ro-view-switch"><button className="active">▦</button><button>☷</button></span></div><div className="ro-events-grid">{eventCards.map((event) => <article key={event.title}><div className={`ro-event-poster ${event.tone}`}><span>{event.tag}</span><b>{event.title.split(" ").slice(0,2).join(" ")}<br />{event.title.split(" ").slice(2).join(" ")}</b><i>{event.date}</i></div><div className="ro-event-card-body"><span>{event.date}<b>{event.time}</b></span><div><p>{event.tag}</p><h3>{event.title}</h3><small>⌖ {event.place}</small></div><button className={event.status === "Registered" ? "registered" : ""}>{event.status} {event.status !== "Registered" && "→"}</button></div></article>)}</div></section>
    </div>
  );
}
