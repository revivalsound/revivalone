"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/app/lib/supabase";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", city: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.password.length < 8) { setError("Use at least 8 characters for your password."); return; }
    setLoading(true); setError(""); setNotice("");
    const { data, error: signUpError } = await getSupabaseBrowserClient().auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: form.fullName, city: form.city },
      },
    });
    setLoading(false);
    if (signUpError) { setError(signUpError.message); return; }
    if (data.session) { router.push("/home"); router.refresh(); return; }
    setNotice("Your account is ready. Check your inbox to confirm your email, then sign in.");
  }

  function update(field: keyof typeof form, value: string) { setForm((current) => ({ ...current, [field]: value })); }

  return <>
    <section className="auth-visual">
      <Link className="auth-logo" href="/"><img src="/revival-one-logo.png" alt="Revival One" /></Link>
      <img className="auth-flame" src="/revival-flame.png" alt="" />
      <div className="auth-testimony"><p className="auth-kicker">YOUR PLACE IN THE STORY</p><blockquote>One movement. One revival. <em>One generation.</em></blockquote><footer><span>12K</span><p>Believers gathering across 18 cities</p></footer></div>
    </section>
    <section className="auth-form-side"><div className="auth-panel">
      <Link className="auth-back" href="/">← Back to Revival One</Link>
      <h1>Carry the<br /><em>flame.</em></h1>
      <p>Create your account and find your next step in community, discipleship, and Kingdom impact.</p>
      <form className="auth-form" onSubmit={signUp}>
        <label>FULL NAME<input required autoComplete="name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Your full name" /></label>
        <label>CITY<input required autoComplete="address-level2" value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="Lagos, Nigeria" /></label>
        <label>EMAIL ADDRESS<input required type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" /></label>
        <label>PASSWORD<input required minLength={8} type="password" autoComplete="new-password" value={form.password} onChange={(event) => update("password", event.target.value)} placeholder="At least 8 characters" /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {notice && <p className="auth-notice" role="status">{notice}</p>}
        <button className="auth-submit" disabled={loading || Boolean(notice)} type="submit"><span>{loading ? "Creating your account…" : "Join the movement"}</span><span>→</span></button>
      </form>
      <p className="auth-switch">Already have an account? <Link href="/sign-in">Sign in</Link></p>
    </div></section>
  </>;
}
