import { NextResponse } from "next/server";
import { getDesignerSession, isSessionExpired } from "@/lib/session";
import { erpGetDeals } from "@/lib/erp";

interface TInvoice {
  IVNUM?: string;
  CDES?: string;
  IVDATE?: string;
  Y_151_0_ESHB?: string;
  TOTPRICE?: number;
  STATDES?: string;
  TYPEDES?: string;
  BRANCH?: string;
  LTRN_SELLERNAME?: string;
  [key: string]: unknown;
}

function mapTInvoiceToDealRow(iv: TInvoice) {
  return {
    id: iv.IVNUM,
    invoice_date: iv.IVDATE,
    customer_name: iv.CDES,
    phone: iv.Y_151_0_ESHB,
    amount_excl_vat: iv.TOTPRICE,
    status: iv.STATDES ?? iv.TYPEDES,
    branch: iv.BRANCH ?? (iv as { branch?: string }).branch,
    seller_name: iv.LTRN_SELLERNAME,
  };
}

export async function GET() {
  try {
    const session = await getDesignerSession();
    if (!session?.designerCode || isSessionExpired(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawGroups = await erpGetDeals(session.designerCode) as Array<{ value: TInvoice[] }>;
    const tinvoices = rawGroups.flatMap((g) => g.value ?? []);
    const deals = tinvoices.map(mapTInvoiceToDealRow);

    return NextResponse.json(deals);
  } catch (e) {
    console.error("deals", e);
    return NextResponse.json({ error: "Failed to load deals" }, { status: 500 });
  }
}
