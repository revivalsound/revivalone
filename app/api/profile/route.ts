import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/supabase";

function bearerToken(request: Request) {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

async function authenticatedClient(request: Request) {
  const token = bearerToken(request);
  if (!token) return null;
  const supabase = createSupabaseServerClient(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { supabase, user: data.user };
}

export async function GET(request: Request) {
  const auth = await authenticatedClient(request);
  if (!auth) return NextResponse.json({ error: "Sign in to view your profile." }, { status: 401 });

  const { data: profile, error } = await auth.supabase.from("profiles").select("id, full_name, city, country, church, ministry_focus, bio, avatar_url, created_at, updated_at").eq("id", auth.user.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const [initiatives, events, cells, courses] = await Promise.all([
    auth.supabase.from("initiatives").select("id", { count: "exact", head: true }).eq("owner_id", auth.user.id),
    auth.supabase.from("event_registrations").select("event_id", { count: "exact", head: true }).eq("user_id", auth.user.id),
    auth.supabase.from("community_memberships").select("cell_id", { count: "exact", head: true }).eq("user_id", auth.user.id),
    auth.supabase.from("course_enrollments").select("course_id", { count: "exact", head: true }).eq("user_id", auth.user.id),
  ]);

  return NextResponse.json({
    profile: { ...profile, email: auth.user.email ?? "" },
    stats: { initiatives: initiatives.count ?? 0, events: events.count ?? 0, cells: cells.count ?? 0, courses: courses.count ?? 0 },
  });
}

export async function PATCH(request: Request) {
  const auth = await authenticatedClient(request);
  if (!auth) return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid profile request." }, { status: 400 }); }

  const text = (key: string, max: number) => String(body[key] ?? "").trim().slice(0, max);
  const fullName = text("full_name", 100);
  if (fullName.length < 2) return NextResponse.json({ error: "Enter your full name." }, { status: 400 });

  const updates = {
    full_name: fullName,
    city: text("city", 80),
    country: text("country", 80),
    church: text("church", 120),
    ministry_focus: text("ministry_focus", 120),
    bio: text("bio", 500),
    avatar_url: text("avatar_url", 600) || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await auth.supabase.from("profiles").update(updates).eq("id", auth.user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (auth.user.user_metadata?.full_name !== fullName) {
    await auth.supabase.auth.updateUser({ data: { ...auth.user.user_metadata, full_name: fullName, city: updates.city } });
  }

  return NextResponse.json({ profile: data });
}
