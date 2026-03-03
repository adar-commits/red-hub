import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const hasGoogle = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

export const authOptions: NextAuthOptions = {
  providers: hasGoogle
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      ]
    : [],
  secret: process.env.NEXTAUTH_SECRET ?? "red-hub-fallback-secret",
  pages: { signIn: "/admin" },
  callbacks: {
    async signIn() {
      return true;
    },
  },
};
