import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired, type DesignerSession } from "@/lib/session";

export async function requireDesignerSession(): Promise<
  { session: DesignerSession; error: null } | { session: null; error: NextResponse }
> {
  const session = await getDesignerSession();
  if (!session?.designerCode || isSessionExpired(session)) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}
