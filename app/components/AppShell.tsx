"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";

const navigation = [
  { href: "/home", label: "Home", icon: "⌂" },
  { href: "/community", label: "Community", icon: "◎" },
  { href: "/events", label: "Events", icon: "◇" },
  { href: "/academy", label: "Academy", icon: "△" },
];

const creationTypes = [
  { title: "Event", copy: "A worship night, outreach, conference, or gathering.", icon: "◇" },
  { title: "Gospel bootcamp", copy: "An intensive track for evangelism, prayer, or leadership.", icon: "△" },
  { title: "Revival cell", copy: "Start a local community that meets, grows, and serves together.", icon: "⌖" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { session, user, signOut } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [creationType, setCreationType] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const displayName = String(user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Guest");
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "RO";

  function openCreate() {
    if (!session) { window.location.assign("/sign-in"); return; }
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreationType(null);
    setCreated(false);
    setCreateError("");
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !creationType) { window.location.assign("/sign-in"); return; }
    setCreating(true); setCreateError("");
    const form = new FormData(event.currentTarget);
    const kind = creationType === "Event" ? "event" : creationType === "Gospel bootcamp" ? "bootcamp" : "cell";
    const response = await fetch("/api/initiatives", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ kind, title: form.get("title"), city: form.get("city"), startsAt: form.get("startsAt"), description: form.get("description") }),
    });
    const result = await response.json().catch(() => ({}));
    setCreating(false);
    if (!response.ok) { setCreateError(result.error ?? "We could not save this yet. Please try again."); return; }
    setCreated(true);
  }

  return (
    <div className="ro-shell">
      <aside className="ro-sidebar">
        <Link className="ro-logo" href="/" aria-label="Revival One landing page">
          <img src="/revival-one-logo.png" alt="Revival One" />
        </Link>
        <nav className="ro-side-nav" aria-label="App navigation">
          <span className="ro-nav-label">YOUR REVIVAL</span>
          {navigation.map((item) => (
            <Link className={pathname === item.href ? "active" : ""} href={item.href} key={item.href}>
              <i>{item.icon}</i><span>{item.label}</span>{pathname === item.href && <b />}
            </Link>
          ))}
        </nav>
        <div className="ro-sidebar-spacer" />
        <button className="ro-create-side" onClick={openCreate}><span>＋</span>Create</button>
        {user ? <div className="ro-user-card"><span className="ro-avatar">{initials}</span><div><b>{displayName}</b><small>{user.email}</small></div><button aria-label="Sign out" title="Sign out" onClick={signOut}>↗</button></div> : <Link className="ro-user-card" href="/sign-in"><span className="ro-avatar">RO</span><div><b>Sign in</b><small>Create and join the movement</small></div><span>→</span></Link>}
      </aside>

      <div className="ro-workspace">
        <header className="ro-appbar">
          <Link className="ro-mobile-logo" href="/" aria-label="Revival One landing page"><img src="/revival-one-logo.png" alt="Revival One" /></Link>
          <div className="ro-search"><span>⌕</span><input aria-label="Search Revival One" placeholder="Search people, cells, events, courses…" /><kbd>⌘ K</kbd></div>
          <div className="ro-app-actions"><button aria-label="Prayer activity">◌</button><button aria-label="Notifications" className="has-alert">♢</button>{user ? <span className="ro-avatar small" title={displayName}>{initials}</span> : <Link className="ro-app-signin" href="/sign-in">Sign in</Link>}</div>
        </header>
        <main className="ro-main">{children}</main>
      </div>

      <nav className="ro-bottom-nav" aria-label="Mobile app navigation">
        <Link className={pathname === "/home" ? "active" : ""} href="/home"><i>⌂</i><span>Home</span></Link>
        <Link className={pathname === "/community" ? "active" : ""} href="/community"><i>◎</i><span>Community</span></Link>
        <button className="ro-bottom-create" onClick={openCreate} aria-label="Create">＋</button>
        <Link className={pathname === "/events" ? "active" : ""} href="/events"><i>◇</i><span>Events</span></Link>
        <Link className={pathname === "/academy" ? "active" : ""} href="/academy"><i>△</i><span>Academy</span></Link>
      </nav>

      {createOpen && (
        <div className="ro-modal-backdrop" role="presentation" onMouseDown={closeCreate}>
          <section className="ro-create-modal" role="dialog" aria-modal="true" aria-labelledby="ro-create-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="ro-modal-close" onClick={closeCreate} aria-label="Close">×</button>
            {created ? (
              <div className="ro-created-state"><span>✓</span><p>CREATION RECEIVED</p><h2>Your {creationType?.toLowerCase()} is taking shape.</h2><p>We saved the details and will guide you through the remaining setup.</p><button onClick={closeCreate}>Back to Revival One</button></div>
            ) : creationType ? (
              <form className="ro-create-form" onSubmit={submitCreate}>
                <button type="button" className="ro-back-button" onClick={() => setCreationType(null)}>← Choose another</button>
                <p className="ro-overline">CREATE · {creationType.toUpperCase()}</p>
                <h2>Give it a name.<br /><em>We&apos;ll help with the rest.</em></h2>
                <label>NAME<input name="title" required minLength={3} placeholder={creationType === "Revival cell" ? "Lekki Revival Cell" : `Name your ${creationType.toLowerCase()}`} /></label>
                <div className="ro-form-row"><label>CITY<input name="city" required placeholder="Lagos, Nigeria" /></label><label>START DATE<input name="startsAt" required type="date" /></label></div>
                <label>SHORT DESCRIPTION<textarea name="description" required minLength={10} placeholder="What is God placing on your heart?" rows={3} /></label>
                {createError && <p className="ro-create-error" role="alert">{createError}</p>}
                <button className="ro-submit-create" disabled={creating} type="submit">{creating ? "Saving…" : "Save & continue"} <span>↗</span></button>
              </form>
            ) : (
              <>
                <p className="ro-overline">CREATE WITH REVIVAL ONE</p>
                <h2 id="ro-create-title">What are you<br /><em>starting?</em></h2>
                <p className="ro-modal-lede">Turn the burden into a gathering, a training ground, or a community.</p>
                <div className="ro-create-options">
                  {creationTypes.map((item) => <button onClick={() => setCreationType(item.title)} key={item.title}><span>{item.icon}</span><div><b>{item.title}</b><small>{item.copy}</small></div><i>→</i></button>)}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
