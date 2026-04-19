import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

const googleProviders =
  googleId && googleSecret
    ? [
        GoogleProvider({
          clientId: googleId,
          clientSecret: googleSecret,
        }),
      ]
    : [];

/** Same email must exist in admin_portal_users (seed/migrate in Supabase). */
async function isAllowedAdminEmail(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("admin_portal_users")
      .select("id")
      .eq("email", normalized)
      .maybeSingle();
    if (error) console.error("admin_portal_users SSO lookup", error.message);
    return Boolean(data);
  } catch (e) {
    console.error("isAllowedAdminEmail", e);
    return false;
  }
}

export const authOptions: NextAuthOptions = {
  providers: googleProviders,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;
      const email = typeof user?.email === "string" ? user.email : "";
      return isAllowedAdminEmail(email);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const email = user.email.trim().toLowerCase();
        try {
          const supabase = createServerSupabaseClient();
          const { data } = await supabase
            .from("admin_portal_users")
            .select("id, email")
            .eq("email", email)
            .maybeSingle();
          if (data) {
            token.id = data.id;
            token.email = typeof data.email === "string" ? data.email.trim().toLowerCase() : email;
          }
        } catch (e) {
          console.error("jwt admin SSO", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const id = (token.id as string) ?? token.sub ?? "";
        const tokenEmail = typeof token.email === "string" ? token.email.trim() : "";
        session.user.id = id;
        session.user.email = tokenEmail;
      }
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET ?? "red-hub-fallback-secret",
  pages: {
    signIn: "/admin",
    error: "/admin",
  },
};
