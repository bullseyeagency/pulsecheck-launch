import NextAuth, { DefaultSession, NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/**
 * Extend NextAuth types to include custom fields
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    organizationId?: string;
    role?: string;
  }
}

/**
 * NextAuth configuration
 */
export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
    newUser: "/onboarding", // Redirect new users to onboarding
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow OAuth sign in
      if (account?.provider === "google") {
        return true;
      }
      return false;
    },
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.organizationId = user.organizationId;
        token.role = user.role;
      }

      // Handle account linking (when user connects Google Ads)
      if (account?.provider === "google" && account.access_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }

      return token;
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.organizationId = token.organizationId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // When a new user signs up, create an Organization for them
      // This will be handled in the sign-up page or onboarding flow
      console.log("New user created:", user.email);
    },
  },
  debug: true,
  logger: {
    error(code, ...message) {
      console.error("[NEXTAUTH ERROR]", code, JSON.stringify(message));
    },
    warn(code) {
      console.warn("[NEXTAUTH WARN]", code);
    },
    debug(code, ...message) {
      console.log("[NEXTAUTH DEBUG]", code, JSON.stringify(message));
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
