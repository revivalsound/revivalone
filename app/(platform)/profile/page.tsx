"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { getSupabaseBrowserClient } from "@/app/lib/supabase";

type Profile = {
  id: string; full_name: string; email: string; city: string; country: string;
  church: string; ministry_focus: string; bio: string; avatar_url: string | null;
  created_at: string; updated_at: string;
};

type Stats = { initiatives: number; events: number; cells: number; courses: number };

const emptyProfile: Profile = { id: "", full_name: "", email: "", city: "", country: "", church: "", ministry_focus: "", bio: "", avatar_url: null, created_at: "", updated_at: "" };

export default function ProfilePage() {
  const { loading: authLoading, session, user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [stats, setStats] = useState<Stats>({ initiatives: 0, events: 0, cells: 0, courses: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!session) { window.location.assign("/sign-in"); return; }
    fetch("/api/profile", { headers: { authorization: `Bearer ${session.access_token}` } })
      .then(async (response) => ({ ok: response.ok, body: await response.json() }))
      .then(({ ok, body }) => {
        if (!ok) throw new Error(body.error ?? "Could not load your profile.");
        setProfile({ ...emptyProfile, ...body.profile });
        setStats(body.stats);
      })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [authLoading, session]);

  const initials = useMemo(() => profile.full_name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "RO", [profile.full_name]);
  const location = [profile.city, profile.country].filter(Boolean).join(", ") || "Add your city";
  const joined = profile.created_at ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(profile.created_at)) : "Recently";

  function update(key: keyof Profile, value: string) { setProfile((current) => ({ ...current, [key]: value })); }

  async function saveProfile(event?: FormEvent<HTMLFormElement>, avatarUrl = profile.avatar_url) {
    event?.preventDefault();
    if (!session) return;
    setSaving(true); setError(""); setMessage("");
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ ...profile, avatar_url: avatarUrl }),
    });
    const body = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) { setError(body.error ?? "Could not save your profile."); return; }
    setProfile((current) => ({ ...current, ...body.profile, email: current.email }));
    setMessage("Your profile has been updated.");
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !session || !user) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) { setError("Choose a JPG, PNG, or WebP image under 2 MB."); return; }
    setUploading(true); setError(""); setMessage("");
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;
    const supabase = getSupabaseBrowserClient();
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) { setUploading(false); setError(uploadError.message); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setProfile((current) => ({ ...current, avatar_url: data.publicUrl }));
    await saveProfile(undefined, data.publicUrl);
    setUploading(false);
  }

  if (loading || authLoading) return <div className="ro-page profile-loading"><span className="profile-loader" /><p>Preparing your profile…</p></div>;

  return <div className="ro-page profile-page">
    <div className="profile-back-row"><Link href="/home">← Back home</Link><span>MEMBER SINCE {joined.toUpperCase()}</span></div>

    <section className="profile-hero">
      <div className="profile-glow" />
      <img className="profile-flame" src="/revival-flame.png" alt="" />
      <div className="profile-avatar-wrap">{profile.avatar_url ? <img src={profile.avatar_url} alt={`${profile.full_name} profile`} /> : <span>{initials}</span>}<label className="profile-avatar-edit"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadAvatar} disabled={uploading} /><b>{uploading ? "…" : "+"}</b><i>{uploading ? "Uploading" : "Change photo"}</i></label></div>
      <div className="profile-identity"><p className="ro-overline bright">REVIVAL ONE MEMBER</p><h1>{profile.full_name || "Your name"}</h1><p>{location}</p><div><span>{profile.ministry_focus || "Discovering my assignment"}</span><span>{profile.church || "Add your church"}</span></div></div>
      <div className="profile-level"><span>LEVEL 4</span><b>Kingdom Builder</b><div><i style={{ width: "68%" }} /></div><small>680 of 1,000 impact points</small></div>
    </section>

    <section className="profile-stats" aria-label="Your Revival One activity">
      <article><span>◇</span><b>{stats.events}</b><small>EVENTS JOINED</small></article>
      <article><span>◎</span><b>{stats.cells}</b><small>REVIVAL CELLS</small></article>
      <article><span>△</span><b>{stats.courses}</b><small>COURSES STARTED</small></article>
      <article><span>↗</span><b>{stats.initiatives}</b><small>INITIATIVES CREATED</small></article>
    </section>

    <div className="profile-content-grid">
      <form className="profile-form-card" onSubmit={saveProfile}>
        <div className="profile-card-heading"><div><p className="ro-overline">PERSONAL PROFILE</p><h2>Tell the movement<br /><em>who you are.</em></h2></div><span>Visible to your community</span></div>
        <div className="profile-fields"><label>FULL NAME<input required value={profile.full_name} onChange={(event) => update("full_name", event.target.value)} /></label><label>EMAIL ADDRESS<input value={profile.email} disabled /></label><label>CITY<input value={profile.city} onChange={(event) => update("city", event.target.value)} placeholder="Lagos" /></label><label>COUNTRY<input value={profile.country} onChange={(event) => update("country", event.target.value)} placeholder="Nigeria" /></label><label>CHURCH / COMMUNITY<input value={profile.church} onChange={(event) => update("church", event.target.value)} placeholder="Your local church" /></label><label>MINISTRY FOCUS<input value={profile.ministry_focus} onChange={(event) => update("ministry_focus", event.target.value)} placeholder="Prayer, missions, business…" /></label><label className="profile-bio-field">BIO<textarea rows={5} maxLength={500} value={profile.bio} onChange={(event) => update("bio", event.target.value)} placeholder="Share a little about your faith journey and the assignment on your heart." /><small>{profile.bio.length}/500</small></label></div>
        {error && <p className="profile-error" role="alert">{error}</p>}{message && <p className="profile-success" role="status">{message}</p>}
        <div className="profile-form-actions"><button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}<span>→</span></button><small>Changes sync securely to your Revival One account.</small></div>
      </form>

      <aside className="profile-side-column">
        <section className="profile-calling-card"><span>✦</span><p className="ro-overline">YOUR DECLARATION</p><blockquote>“I carry the presence of God into every room and build what the Kingdom needs next.”</blockquote></section>
        <section className="profile-account-card"><div><p className="ro-overline">ACCOUNT</p><h3>Security & session</h3></div><p>Signed in as<br /><b>{profile.email}</b></p><Link href="/reset-password">Change password <span>→</span></Link><button type="button" onClick={signOut}>Sign out of Revival One</button></section>
      </aside>
    </div>
  </div>;
}
