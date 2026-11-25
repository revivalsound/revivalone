"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/app/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your Revival One account…");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const code = new URLSearchParams(window.location.search).get("code");
    const complete = async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { setMessage(error.message); return; }
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
      }
      const { data } = await supabase.auth.getSession();
      router.replace(data.session ? "/home" : "/sign-in");
    };
    complete();
  }, [router]);

  return <main className="rev-auth-status"><div><img src="/revival-flame.png" alt="" width="84" height="84" /><p role="status">{message}</p></div></main>;
}
