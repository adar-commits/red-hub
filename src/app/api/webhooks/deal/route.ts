import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-webhook-secret");
    if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const agentCode = body.agentCode ?? body.designer_code;
    if (!agentCode) return NextResponse.json({ error: "agentCode required" }, { status: 400 });
    // Deal data is consumed by ERP; red-hub does not store deals. This endpoint can forward to ERP or just acknowledge.
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("webhook deal", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
