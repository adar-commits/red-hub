import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";

const PHOTOS_WEBHOOK_URL = "https://hook.eu2.make.com/9yya0867dfwx3ivbx1au5wcqvmwl0pt5";

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

async function fileToBase64(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  return buf.toString("base64");
}

export async function POST(request: Request) {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const formData = await request.formData();
    const projectDescription = (formData.get("projectDescription") ?? formData.get("תיאור פרויקט") ?? "").toString().trim();
    if (!projectDescription) {
      return NextResponse.json({ error: "חובה למלא שדה תיאור פרויקט" }, { status: 400 });
    }

    const files: File[] = [];
    const fileList = formData.getAll("files") as File[];
    for (const f of fileList) {
      if (f && f instanceof File && f.type.startsWith("image/")) files.push(f);
    }
    const single = formData.get("file") as File | null;
    if (single && single instanceof File && single.type.startsWith("image/")) {
      files.push(single);
    }
    if (files.length === 0) {
      return NextResponse.json({ error: "יש לבחור לפחות תמונה אחת" }, { status: 400 });
    }

    const images = await Promise.all(
      files.map(async (file) => ({
        fileName: file.name,
        contentType: file.type,
        data: await fileToBase64(file),
      }))
    );

    const webhookUrl = process.env.PHOTOS_WEBHOOK_URL ?? PHOTOS_WEBHOOK_URL;
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentCode: session.designerCode,
        actionType: "imgupload",
        projectDescription,
        images,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("photos webhook", res.status, text);
      return NextResponse.json(
        { error: "שגיאה בשליחה לשרת. נסה שוב." },
        { status: 502 }
      );
    }
    return NextResponse.json({
      success: true,
      count: files.length,
      projectDescription,
    });
  } catch (e) {
    console.error("photos post", e);
    return NextResponse.json({ error: "שגיאה בהעלאה" }, { status: 500 });
  }
}
