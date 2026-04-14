import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";

/** Legacy Make.com photo webhook — retired; use /photos → Supabase project uploads. */
export async function GET() {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json([]);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST() {
  const session = await getDesignerSession();
  if (!session?.designerCode || isSessionExpired(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    {
      error:
        "נתיב זה הושבת. נא להשתמש בדף תמונות הפרויקטים: צרו פרויקט והעלו תמונות דרך /photos.",
    },
    { status: 410 }
  );
}
