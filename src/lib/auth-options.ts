import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "אימייל וסיסמה",
      credentials: {
        email: { label: "אימייל", type: "email" },
        password: { label: "סיסמה", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        try {
          const supabase = createServerSupabaseClient();
          const { data: row, error } = await supabase
            .from("admin_portal_users")
            .select("id, email, password_hash")
            .eq("email", email)
            .maybeSingle();

          if (error || !row?.password_hash) {
            if (error) console.error("admin_portal_users lookup", error.message);
            return null;
          }

          const valid = await bcrypt.compare(password, row.password_hash);
          if (!valid) return null;

          const rowEmail =
            typeof row.email === "string" && row.email.trim()
              ? row.email.trim().toLowerCase()
              : email;

          return {
            id: row.id,
            email: rowEmail,
            name: "מנהל",
          };
        } catch (e) {
          console.error("authorize admin", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
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
  pages: { signIn: "/admin" },
};
