"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/app/lib/supabase";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError(""); setNotice("");
    const { error: signInError } = await getSupabaseBrowserClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) { setError(signInError.message); return; }
    router.push("/home");
    router.refresh();
  }

  async function resetPassword() {
    if (!email) { setError("Enter your email address first, then choose Forgot password."); return; }
    setLoading(true); setError("");
    const { error: resetError } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setLoading(false);
    if (resetError) { setError(resetError.message); return; }
    setNotice("Password reset link sent. Check your inbox.");
  }

  return <>
    <section className="auth-visual">
      <Link className="auth-logo" href="/"><img src="/revival-one-logo.png" alt="Revival One" /></Link>
      <img className="auth-flame" src="/revival-flame.png" alt="" />
      <div className="auth-testimony"><p className="auth-kicker">WELCOME BACK TO THE MOVEMENT</p><blockquote>Return to the place where faith becomes <em>action.</em></blockquote><footer><span>KA</span><p>Kemi Adebayo · Victoria Island Cell</p></footer></div>
    </section>
    <section className="auth-form-side"><div className="auth-panel">
      <Link className="auth-back" href="/">← Back to Revival One</Link>
      <h1>Welcome<br /><em>back.</em></h1>
      <p>Continue your journey of prayer, community, learning, and Kingdom impact.</p>
      <form className="auth-form" onSubmit={signIn}>
        <label>EMAIL ADDRESS<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label><span className="auth-password-row">PASSWORD<button type="button" onClick={resetPassword}>Forgot password?</button></span><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {notice && <p className="auth-notice" role="status">{notice}</p>}
        <button className="auth-submit" disabled={loading} type="submit"><span>{loading ? "Signing you in…" : "Enter Revival One"}</span><span>→</span></button>
      </form>
      <p className="auth-switch">New to the movement? <Link href="/sign-up">Create your account</Link></p>
      <div className="auth-trust"><span>SECURE SIGN-IN</span><span>PRIVATE BY DEFAULT</span><span>SUPABASE AUTH</span></div>
    </div></section>
  </>;
}
