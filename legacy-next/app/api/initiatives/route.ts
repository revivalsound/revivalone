import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/supabase";

const allowedKinds = new Set(["event", "bootcamp", "cell"]);

function bearerToken(request: Request) {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

export async function GET(request: Request) {
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "Sign in to view your creations." }, { status: 401 });

  const supabase = createSupabaseServerClient(token);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: "Your session has expired." }, { status: 401 });

  const { data, error } = await supabase.from("initiatives").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ initiatives: data });
}

export async function POST(request: Request) {
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "Sign in before creating an initiative." }, { status: 401 });

  const supabase = createSupabaseServerClient(token);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });

  let body: { kind?: string; title?: string; city?: string; startsAt?: string; description?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const kind = body.kind?.trim().toLowerCase() ?? "";
  const title = body.title?.trim() ?? "";
  const city = body.city?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  if (!allowedKinds.has(kind) || title.length < 3 || city.length < 2 || description.length < 10 || !body.startsAt) {
    return NextResponse.json({ error: "Complete every field with a little more detail." }, { status: 400 });
  }

  const { data, error } = await supabase.from("initiatives").insert({
    owner_id: userData.user.id,
    kind,
    title,
    city,
    starts_at: body.startsAt,
    description,
    status: "draft",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ initiative: data }, { status: 201 });
}
