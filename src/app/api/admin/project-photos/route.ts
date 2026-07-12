import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAdminProjectPhotos } from "@/lib/admin-project-photos";

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session) return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { session, error: null };
}

export async function GET() {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  try {
    const supabase = createServerSupabaseClient();
    const photos = await fetchAdminProjectPhotos(supabase);

    return NextResponse.json({
      photos,
      stats: { total: photos.length },
    });
  } catch (e) {
    console.error("admin project-photos get", e);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
