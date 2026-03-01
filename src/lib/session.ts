import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface DesignerSession {
  designerCode: string;
  phone: string;
  fullName: string | null;
  expiresAt: number;
  commissionCertificates?: unknown[];
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "red-hub-dev-secret-min-32-chars-long",
  cookieName: "red_hub_designer",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax" as const,
    path: "/",
  },
};

export async function getDesignerSession() {
  const cookieStore = await cookies();
  return getIronSession<DesignerSession>(cookieStore, sessionOptions);
}

export function isSessionExpired(session: DesignerSession | null): boolean {
  if (!session?.expiresAt) return true;
  return Date.now() > session.expiresAt;
}
