import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "קובץ חסר" }, { status: 400 });

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const header = lines[0].split(",").map((h) => h.trim());
    const designerCodeIdx = header.findIndex((h) => /designer_code|agentCode|code/i.test(h));
    const phoneIdx = header.findIndex((h) => /phone|טלפון/i.test(h));
    const nameIdx = header.findIndex((h) => /full_name|name|שם/i.test(h));
    if (designerCodeIdx < 0 || phoneIdx < 0) {
      return NextResponse.json({ error: "CSV must have designer_code (or agentCode) and phone columns" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const designer_code = cols[designerCodeIdx];
      const phone = cols[phoneIdx];
      if (!designer_code || !phone) continue;
      const full_name = nameIdx >= 0 ? cols[nameIdx] : null;
      const { error } = await supabase.from("designers").upsert(
        { designer_code, phone, full_name, updated_at: new Date().toISOString() },
        { onConflict: "designer_code" }
      );
      if (!error) imported++;
    }
    return NextResponse.json({ imported });
  } catch (e) {
    console.error("csv import", e);
    return NextResponse.json({ error: "שגיאה בייבוא" }, { status: 500 });
  }
}
