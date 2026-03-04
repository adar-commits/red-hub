import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

function parseDisplayAt(s: string | null | undefined): string | null {
  if (!s || typeof s !== "string") return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  const [dPart, tPart] = trimmed.split(/\s+/);
  if (!dPart) return null;
  const [dd, mm, yyyy] = dPart.split("/");
  if (!dd || !mm || !yyyy) return null;
  const [hh, min] = (tPart ?? "00:00").split(":");
  const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${(hh ?? "00").padStart(2, "0")}:${(min ?? "00").padStart(2, "0")}:00`;
  return iso;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const supabase = createServerSupabaseClient();
  const insert: Record<string, unknown> = {
    title: body.title ?? "",
    content: body.content ?? body.subtitle ?? null,
    is_published: !!body.is_published,
  };
  const displayAt = parseDisplayAt(body.display_at ?? body.displayAt);
  if (displayAt) insert.display_at = displayAt;
  const { data, error } = await supabase.from("announcements").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const id = body.id;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const supabase = createServerSupabaseClient();
  const update: Record<string, unknown> = {
    title: body.title,
    content: body.content ?? body.subtitle,
    is_published: body.is_published,
  };
  const displayAt = parseDisplayAt(body.display_at ?? body.displayAt);
  if (displayAt != null) update.display_at = displayAt;
  const { data, error } = await supabase.from("announcements").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
