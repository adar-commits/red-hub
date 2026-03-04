import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";
import { erpGetBusinessInfo, erpUpdateBusinessInfo } from "@/lib/erp";

export async function GET() {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await erpGetBusinessInfo(session.designerCode);
    return NextResponse.json(data);
  } catch (e) {
    console.error("business get", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load business info" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const payload = {
      eventType: "updateInfo",
      fullName: body.fullName ?? "",
      phoneNumber: body.phoneNumber ?? "",
      companyAddress: body.companyAddress ?? "",
      companyCity: body.companyCity ?? "",
      companyType: body.companyType ?? "",
      birthday: body.birthday ?? "",
      email: body.email ?? "",
      companyName: body.companyName ?? "",
      vatNo: body.vatNo ?? "",
      designerType: body.designerType ?? "",
      speciality: body.speciality ?? "",
      experienceYears: body.experienceYears ?? "",
      howDidYouHear: body.howDidYouHear ?? "",
      bankType: body.bankType ?? "",
      bankBranch: body.bankBranch ?? "",
      bankNo: body.bankNo ?? "",
    };
    await erpUpdateBusinessInfo(payload);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("business post", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update business info" },
      { status: 500 }
    );
  }
}
