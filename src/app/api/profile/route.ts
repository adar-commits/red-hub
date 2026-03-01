import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { erpUpdateProfile } from "@/lib/erp";

export async function GET() {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("designers")
      .select("*")
      .eq("designer_code", session.designerCode)
      .single();
    if (error || !data) {
      return NextResponse.json({
        designer_code: session.designerCode,
        phone: session.phone,
        full_name: session.fullName,
      });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("profile get", e);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const supabase = createServerSupabaseClient();
    const update: Record<string, unknown> = {
      full_name: body.full_name,
      phone: body.phone,
      email: body.email,
      business_name: body.business_name,
      business_type: body.business_type,
      company_id: body.company_id,
      business_address: body.business_address,
      city: body.city,
      design_type: body.design_type,
      specialization: body.specialization,
      experience_years: body.experience_years,
      how_heard: body.how_heard,
      date_of_birth: body.date_of_birth,
      marketing_consent: body.marketing_consent,
      updated_at: new Date().toISOString(),
    };
    const { error: updateError } = await supabase
      .from("designers")
      .update(update)
      .eq("designer_code", session.designerCode);
    if (updateError) throw updateError;
    try {
      await erpUpdateProfile(session.designerCode, body);
    } catch {
      // ERP optional
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("profile post", e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
