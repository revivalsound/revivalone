"use client";

import Link from "next/link";
import { BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, Flame, GraduationCap, House, LogOut, Plus, UsersRound, X } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";

const navigation = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/community", label: "Community", Icon: UsersRound },
  { href: "/events", label: "Events", Icon: CalendarDays },
  { href: "/academy", label: "Academy", Icon: GraduationCap },
] as const;

const creationTypes = [
  { kind: "event", title: "Event", copy: "A worship night, outreach, or conference.", Icon: CalendarDays },
  { kind: "bootcamp", title: "Gospel bootcamp", copy: "An intensive track for evangelism, prayer, or leadership.", Icon: Flame },
  { kind: "cell", title: "Revival cell", copy: "A local group that meets, grows, and serves together.", Icon: UsersRound },
] as const;

type CreationKind = typeof creationTypes[number]["kind"];
const CreationContext = createContext<(kind?: CreationKind) => void>(() => undefined);

export function CreateInitiativeButton({ kind, children }: { kind?: CreationKind; children: ReactNode }) {
  const create = useContext(CreationContext);
  return <button className="rev-button" type="button" onClick={() => create(kind)}><Plus size={17} aria-hidden="true" />{children}</button>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { session, user, signOut } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [kind, setKind] = useState<CreationKind>();
  const [created, setCreated] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  const selectedType = creationTypes.find((type) => type.kind === kind);
  const section = navigation.find((item) => item.href === pathname)?.label
    ?? (pathname.startsWith("/word") ? "Today’s Word" : "Profile");
  const displayName = String(user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest");
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "RO";
  const avatarUrl = typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;

  useEffect(() => {
    const element = dialog.current;
    if (dialogOpen && element && !element.open) element.showModal();
  }, [dialogOpen]);

  function openCreate(initialKind?: CreationKind) {
    if (!session) { window.location.assign("/sign-in"); return; }
    setKind(initialKind);
    setCreated(false);
    setCreateError("");
    setDialogOpen(true);
  }

  function closeCreate() {
    if (!creating) dialog.current?.close();
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !kind || creating) return;

    const form = new FormData(event.currentTarget);
    setCreating(true);
    setCreateError("");

    try {
      const response = await fetch("/api/initiatives", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ kind, title: form.get("title"), city: form.get("city"), startsAt: form.get("startsAt"), description: form.get("description") }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setCreateError(result.error ?? "We couldn’t save your draft. Try again.");
        return;
      }
      setCreated(true);
    } catch {
      setCreateError("We couldn’t connect. Check your connection and try again.");
    } finally {
      setCreating(false);
    }
  }

  function renderNav(mobile: boolean) {
    return navigation.map(({ href, label, Icon }, index) => (
      <div className="rev-nav-item" key={href}>
        {mobile && index === 2 && <button type="button" className="rev-mobile-create" onClick={() => openCreate()} aria-label="Create"><Plus size={24} aria-hidden="true" /></button>}
        <Link href={href} aria-current={href === pathname ? "page" : undefined}>
          <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      </div>
    ));
  }

  const avatar = <span className="rev-shell-avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : initials}</span>;
  const brand = <Link href="/" className="rev-brand"><img src="/revival-flame.png" alt="" width="42" height="42" /><span>Revival <strong>One</strong></span></Link>;

  return (
    <CreationContext.Provider value={openCreate}>
      <div className="rev-app">
        <a className="rev-skip" href="#rev-app-content">Skip to content</a>
        <aside className="rev-sidebar">
          {brand}
          <nav aria-label="App navigation">{renderNav(false)}</nav>
          <div className="rev-sidebar-bottom">
            <CreateInitiativeButton>Create</CreateInitiativeButton>
            {user ? (
              <div className="rev-shell-account">
                <Link href="/profile" aria-label="Open your profile">{avatar}<span>{displayName}</span></Link>
                <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut size={19} aria-hidden="true" /></button>
              </div>
            ) : <Link className="rev-sidebar-signin" href="/sign-in">Sign in to Revival One</Link>}
          </div>
        </aside>

        <div className="rev-app-workspace">
          <header className="rev-app-header">
            <div className="rev-app-desktop-title">
              <span>Revival One</span><ChevronRight size={15} aria-hidden="true" /><strong>{section}</strong>
            </div>
            <div className="rev-app-mobile-brand">{brand}</div>
            <div className="rev-app-header-actions">
              <Link className="rev-header-word" href="/word/isaiah-40-31"><BookOpen size={18} aria-hidden="true" /> Today’s Word</Link>
              {user ? <Link href="/profile" aria-label="Open your profile">{avatar}</Link> : <Link className="rev-button rev-button--quiet rev-button--small" href="/sign-in">Sign in</Link>}
            </div>
          </header>
          <main id="rev-app-content" className="rev-app-main">{children}</main>
        </div>

        <nav className="rev-bottom-nav" aria-label="Mobile app navigation">{renderNav(true)}</nav>

        {dialogOpen && (
          <dialog ref={dialog} className="rev-create-dialog" aria-labelledby="rev-create-title" onClose={() => setDialogOpen(false)} onCancel={(event) => { if (creating) event.preventDefault(); }}>
            <button type="button" className="rev-dialog-close" aria-label="Close" disabled={creating} onClick={closeCreate}><X size={21} aria-hidden="true" /></button>
            {created ? (
              <div className="rev-created">
                <Check size={28} aria-hidden="true" />
                <h2 id="rev-create-title">Draft saved</h2>
                <p>Your {selectedType?.title.toLowerCase()} was saved to your account.</p>
                <button className="rev-button" type="button" onClick={closeCreate}>Done</button>
              </div>
            ) : selectedType ? (
              <form className="rev-create-form" onSubmit={submitCreate}>
                <button type="button" className="rev-dialog-back" disabled={creating} onClick={() => { setKind(undefined); setCreateError(""); }}><ChevronLeft size={17} aria-hidden="true" /> Choose another type</button>
                <h2 id="rev-create-title">Create a {selectedType.title.toLowerCase()}</h2>
                <label>Name<input required name="title" minLength={3} maxLength={120} placeholder={selectedType.title} /></label>
                <div className="rev-create-row">
                  <label>City<input required name="city" minLength={2} maxLength={100} placeholder="Lagos, Nigeria" /></label>
                  <label>Start date<input required name="startsAt" type="date" /></label>
                </div>
                <label>Description<textarea required name="description" minLength={10} maxLength={1000} rows={4} /></label>
                {createError && <p className="rev-dialog-error" role="alert">{createError}</p>}
                <button className="rev-button" disabled={creating} type="submit">{creating ? "Saving…" : "Save draft"}</button>
              </form>
            ) : (
              <>
                <h2 id="rev-create-title">What are you starting?</h2>
                <div className="rev-create-types">
                  {creationTypes.map(({ kind: type, title, copy, Icon }) => (
                    <button type="button" onClick={() => setKind(type)} key={type}>
                      <Icon size={22} aria-hidden="true" /><span><b>{title}</b><small>{copy}</small></span><ChevronRight size={18} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </dialog>
        )}
      </div>
    </CreationContext.Provider>
  );
}
