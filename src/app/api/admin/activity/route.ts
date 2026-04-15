import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isDesignerActivityType } from "@/lib/designer-activity-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id?.trim();
  const email = session?.user?.email?.trim();
  if (!session?.user || (!uid && !email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const activityType = searchParams.get("activity_type");
  const designerCode = searchParams.get("designer_code");
  const limitRaw = searchParams.get("limit");
  const offsetRaw = searchParams.get("offset");

  const limit = Math.min(
    Math.max(1, parseInt(limitRaw || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
    MAX_LIMIT
  );
  const offset = Math.max(0, parseInt(offsetRaw || "0", 10) || 0);

  if (activityType && !isDesignerActivityType(activityType)) {
    return NextResponse.json({ error: "Invalid activity_type" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  let q = supabase
    .from("designer_activity")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (from) q = q.gte("created_at", from);
  if (to) q = q.lte("created_at", to);
  if (activityType) q = q.eq("activity_type", activityType);
  if (designerCode?.trim()) q = q.ilike("designer_code", `${designerCode.trim()}%`);

  const { data, error, count } = await q.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const total = count ?? 0;
  const nextOffset = offset + rows.length < total ? offset + rows.length : null;

  return NextResponse.json({ rows, nextOffset, total });
}
