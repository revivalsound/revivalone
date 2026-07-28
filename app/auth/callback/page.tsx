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

  return <main style={{ minHeight:"100vh", display:"grid", placeItems:"center", background:"#050505", color:"white", textAlign:"center", padding:24 }}><div><img src="/revival-flame.png" alt="" style={{ width:120, height:120, objectFit:"contain" }} /><p style={{ color:"#ff8fb4", letterSpacing:".12em", fontSize:11 }}>{message}</p></div></main>;
}
