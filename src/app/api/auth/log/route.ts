import { NextResponse } from "next/server";

/**
 * No-op for auth log. Prevents next-auth or other clients from 500ing when calling this.
 */
export async function POST() {
  return NextResponse.json({ ok: true });
}
