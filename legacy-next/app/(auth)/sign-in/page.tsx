"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/app/lib/supabase";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      <Link className="rev-brand" href="/"><img src="/revival-flame.png" alt="" width="42" height="42" /><span>Revival <strong>One</strong></span></Link>
      <div className="auth-testimony"><blockquote>Faith grows <em>in good company.</em></blockquote></div>
    </section>
    <section className="auth-form-side"><div className="auth-panel">
      <Link className="auth-back" href="/">← Back to Revival One</Link>
      <h1>Welcome<br /><em>back.</em></h1>
      <p>Continue your journey of prayer, community, learning, and Kingdom impact.</p>
      <form className="auth-form" onSubmit={signIn}>
        <label>EMAIL ADDRESS<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <div className="auth-field">
          <div className="auth-password-row"><label htmlFor="signin-password">PASSWORD</label><button type="button" onClick={resetPassword}>Forgot password?</button></div>
          <div className="auth-password-field">
            <input id="signin-password" required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" />
            <button className="auth-eye-button" type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}</button>
          </div>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {notice && <p className="auth-notice" role="status">{notice}</p>}
        <button className="auth-submit" disabled={loading} type="submit"><span>{loading ? "Signing you in…" : "Enter Revival One"}</span><span>→</span></button>
      </form>
      <p className="auth-switch">New to the movement? <Link href="/sign-up">Create your account</Link></p>
    </div></section>
  </>;
}
