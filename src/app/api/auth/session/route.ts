import { NextResponse } from "next/server";

/**
 * Safe session endpoint for designer flow. Designer auth uses iron-session, not NextAuth.
 * Returning 200 with null prevents any client (e.g. cached next-auth) from 500ing and crashing the app.
 */
export async function GET() {
  return NextResponse.json({ session: null, user: null });
}
