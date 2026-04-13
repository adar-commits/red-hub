import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/** Default matches product request; set ADMIN_ACCESS_CODE in env to rotate without code changes. */
const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE ?? "L1234!";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "קוד גישה",
      credentials: {
        code: { label: "קוד גישה", type: "password" },
      },
      async authorize(credentials) {
        const code = credentials?.code?.trim();
        if (!code || code !== ADMIN_ACCESS_CODE) return null;
        return { id: "admin", name: "מנהל" };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET ?? "red-hub-fallback-secret",
  pages: { signIn: "/admin" },
};
