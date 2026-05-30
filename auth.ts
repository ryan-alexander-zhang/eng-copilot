import NextAuth, { customFetch, type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { applySessionUserId, canSignIn, createGoogleAuthFetch } from "@/lib/auth-config";
import { assertValidAuthEnv, getAuthEnv } from "@/lib/auth-env";
import { ensureOwnerDefaultWordList } from "@/lib/word-lists/service";

assertValidAuthEnv();

const authEnv = getAuthEnv();

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
  providers: [
    Google({
      clientId: authEnv.googleClientId,
      clientSecret: authEnv.googleClientSecret,
      [customFetch]: createGoogleAuthFetch(),
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    signIn: canSignIn,
    session: applySessionUserId,
  },
  events: {
    createUser: async ({ user }) => {
      if (!user.id) {
        return;
      }

      await ensureOwnerDefaultWordList({
        ownerId: user.id,
        prisma,
      });
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
