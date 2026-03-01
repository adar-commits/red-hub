import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { erpSubmitInvoice } from "@/lib/erp";

export async function POST(request: Request) {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "קובץ חסר" }, { status: 400 });
    const supabase = createServerSupabaseClient();
    const ext = file.name.split(".").pop() || "pdf";
    const path = `invoices/${session.designerCode}/${Date.now()}.${ext}`;
    const { data: upload, error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(upload.path);
    const invoiceUrl = urlData.publicUrl;
    try {
      await erpSubmitInvoice(session.designerCode, invoiceUrl);
    } catch {
      // ERP optional for dev
    }
    return NextResponse.json({
      id: upload.path,
      created_at: new Date().toISOString(),
      certificate_number: null,
      transaction_count: null,
      commission: null,
      status: "ממתין לאישור",
    });
  } catch (e) {
    console.error("upload-invoice", e);
    return NextResponse.json({ error: "שגיאה בהעלאה" }, { status: 500 });
  }
}
