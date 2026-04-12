import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";

const MAKE_WEBHOOK_URL =
  process.env.MAKE_COMMISSION_INVOICE_WEBHOOK_URL ??
  "https://hook.eu2.make.com/9yya0867dfwx3ivbx1au5wcqvmwl0pt5";

function isPdfFile(file: File, pdfBytes: Uint8Array): boolean {
  const nameOk = /\.pdf$/i.test(file.name.trim());
  const typeOk = file.type === "" || file.type === "application/pdf";
  const magicOk =
    pdfBytes.length >= 5 &&
    pdfBytes[0] === 0x25 &&
    pdfBytes[1] === 0x50 &&
    pdfBytes[2] === 0x44 &&
    pdfBytes[3] === 0x46;
  return nameOk && typeOk && magicOk;
}

export async function POST(request: Request) {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "לא נבחר קובץ. נא לבחור קובץ PDF." }, { status: 400 });
    }
    const certId = (formData.get("certId") as string | null) ?? undefined;

    const arrayBuffer = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    if (!isPdfFile(file, pdfBytes)) {
      return NextResponse.json(
        {
          error:
            "ניתן להעלות רק קובץ PDF תקין. ודאו שהקובץ בסיומת .pdf, שהסוג הוא PDF, ושהקובץ לא פגום.",
        },
        { status: 400 }
      );
    }

    const bufferBase64 = Buffer.from(arrayBuffer).toString("base64");
    const webhookBody = {
      eventType: "invoice" as const,
      file: { buffer: bufferBase64 },
      designerCode: session.designerCode,
      certId: certId ?? null,
      fileName: file.name || "invoice.pdf",
    };

    const hookRes = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookBody),
    });

    if (!hookRes.ok) {
      const text = await hookRes.text().catch(() => "");
      console.error("upload-invoice webhook", hookRes.status, text.slice(0, 500));
      return NextResponse.json(
        {
          error:
            "שליחת החשבונית נכשלה. נסו שוב בעוד רגע; אם הבעיה נמשכת, פנו לתמיכה.",
        },
        { status: 502 }
      );
    }

    const invoiceRef = `pdf-${Date.now()}`;
    return NextResponse.json({
      id: invoiceRef,
      invoice_code: invoiceRef,
      certId,
      created_at: new Date().toISOString(),
      certificate_number: null,
      transaction_count: null,
      commission: null,
      status: "ממתין לאישור",
    });
  } catch (e) {
    console.error("upload-invoice", e);
    return NextResponse.json(
      {
        error:
          "אירעה שגיאה בעת העלאת הקובץ. בדקו את החיבור לאינטרנט ונסו שוב; אם הבעיה נמשכת, פנו לתמיכה.",
      },
      { status: 500 }
    );
  }
}
