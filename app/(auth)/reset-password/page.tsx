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

  return (
    <>
      <section className="auth-visual">
        <Link className="rev-brand" href="/"><img src="/revival-flame.png" alt="" width="42" height="42" /><span>Revival <strong>One</strong></span></Link>
        <div className="auth-testimony"><blockquote>Make a <em>fresh start.</em></blockquote></div>
      </section>
      <section className="auth-form-side">
        <div className="auth-panel">
          <Link className="auth-back" href="/sign-in">← Back to sign in</Link>
          <h1>Choose a new <em>password.</em></h1>
          <p>Use at least eight characters for your Revival One account.</p>
          <form className="auth-form" onSubmit={updatePassword}>
            <label>New password<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" disabled={loading} type="submit">{loading ? "Updating…" : "Update password"}</button>
          </form>
        </div>
      </section>
    </>
  );
}
