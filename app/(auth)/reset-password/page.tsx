"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/app/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) { setError("Use at least 8 characters for your password."); return; }
    setLoading(true); setError("");
    const { error: updateError } = await getSupabaseBrowserClient().auth.updateUser({ password });
    setLoading(false);
    if (updateError) { setError(updateError.message); return; }
    router.push("/home");
  }

  return <><section className="auth-visual"><Link className="auth-logo" href="/"><img src="/revival-one-logo.png" alt="Revival One" /></Link><img className="auth-flame" src="/revival-flame.png" alt="" /><div className="auth-testimony"><p className="auth-kicker">A FRESH START</p><blockquote>Renew your access. Return to the <em>movement.</em></blockquote></div></section><section className="auth-form-side"><div className="auth-panel"><Link className="auth-back" href="/sign-in">← Back to sign in</Link><h1>Choose a new<br /><em>password.</em></h1><p>Use at least eight characters to secure your Revival One account.</p><form className="auth-form" onSubmit={updatePassword}><label>NEW PASSWORD<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="auth-submit" disabled={loading} type="submit"><span>{loading ? "Updating…" : "Update password"}</span><span>→</span></button></form></div></section></>;
}
