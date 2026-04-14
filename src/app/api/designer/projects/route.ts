import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireDesignerSession } from "@/lib/designer-api-auth";
import { carpetModelsToJson, ERR_INVALID_BODY, normalizeProjectBody } from "@/lib/designer-project-body";
import { PROJECT_CREATE_MAX_PER_DESIGNER_PER_DAY } from "@/lib/designer-project-photos";

export async function GET() {
  const auth = await requireDesignerSession();
  if (auth.error) return auth.error;

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("designer_projects")
      .select(
        "id, designer_code, project_name, address, photographer_name, photographer_phone, carpet_models, created_at, updated_at"
      )
      .eq("designer_code", auth.session.designerCode)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("designer projects list", error);
      return NextResponse.json({ error: "שגיאה בטעינת פרויקטים" }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("designer projects get", e);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireDesignerSession();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: ERR_INVALID_BODY }, { status: 400 });
  }

  const parsed = normalizeProjectBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const supabase = createServerSupabaseClient();
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    const { count, error: countErr } = await supabase
      .from("designer_projects")
      .select("id", { count: "exact", head: true })
      .eq("designer_code", auth.session.designerCode)
      .gte("created_at", start.toISOString());

    if (countErr) {
      console.error("designer projects create count", countErr);
      return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
    }
    if ((count ?? 0) >= PROJECT_CREATE_MAX_PER_DESIGNER_PER_DAY) {
      return NextResponse.json(
        { error: "הגעת למגבלת יצירת פרויקטים להיום. נסה שוב מחר." },
        { status: 429 }
      );
    }

    const { data, error } = await supabase
      .from("designer_projects")
      .insert({
        designer_code: auth.session.designerCode,
        project_name: parsed.data.project_name,
        address: parsed.data.address,
        photographer_name: parsed.data.photographer_name,
        photographer_phone: parsed.data.photographer_phone,
        carpet_models: carpetModelsToJson(parsed.data.carpet_models),
      })
      .select(
        "id, designer_code, project_name, address, photographer_name, photographer_phone, carpet_models, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      console.error("designer projects insert", error);
      return NextResponse.json({ error: "לא ניתן ליצור פרויקט" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("designer projects post", e);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
