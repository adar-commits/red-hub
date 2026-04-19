import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchFaqDocumentFromDb } from "@/lib/faq-db";
import type { FaqDocumentPayload } from "@/lib/faq-shared";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const doc = await fetchFaqDocumentFromDb();
  if (!doc) return NextResponse.json({ error: "FAQ content not configured" }, { status: 500 });
  return NextResponse.json(doc);
}

function validatePayload(body: unknown): body is FaqDocumentPayload {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  const s = o.settings;
  if (!s || typeof s !== "object") return false;
  const settings = s as Record<string, unknown>;
  if (typeof settings.page_title !== "string") return false;
  if (typeof settings.page_subtitle !== "string") return false;
  if (typeof settings.youtube_video_id !== "string") return false;
  if (typeof settings.video_iframe_title !== "string") return false;
  if (!Array.isArray(o.sections)) return false;
  for (const sec of o.sections) {
    if (!sec || typeof sec !== "object") return false;
    const secO = sec as Record<string, unknown>;
    if (typeof secO.heading !== "string") return false;
    if (!Array.isArray(secO.items)) return false;
    for (const it of secO.items) {
      if (!it || typeof it !== "object") return false;
      const itO = it as Record<string, unknown>;
      if (typeof itO.title !== "string") return false;
      if (typeof itO.body !== "string") return false;
    }
  }
  return true;
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!validatePayload(body)) return NextResponse.json({ error: "Invalid FAQ payload" }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const sectionsJson = body.sections.map((sec) => ({
    heading: sec.heading,
    items: sec.items.map((it) => ({ title: it.title, body: it.body })),
  }));

  const { error } = await supabase.rpc("replace_faq_content", {
    p_page_title: body.settings.page_title,
    p_page_subtitle: body.settings.page_subtitle,
    p_youtube_video_id: body.settings.youtube_video_id,
    p_video_iframe_title: body.settings.video_iframe_title,
    p_sections: sectionsJson,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const doc = await fetchFaqDocumentFromDb();
  return NextResponse.json(doc ?? body);
}
