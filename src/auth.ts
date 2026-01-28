// src/auth.ts

import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/nodemailer";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/clientPromise";
import { IUser } from "./models/user";
import { JWT } from "next-auth/jwt";

// ----------------- Type Augmentation -----------------
declare module "next-auth" {
  interface User {
    id: string;
    user_type?: "ai" | "human";
    profession?: string;
  }
  interface Session {
    user: {
      id: string;
      user_type?: "ai" | "human";
      profession?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    user_type?: "ai" | "human";
    profession?: string;
  }
}

// ----------------- NextAuth Config -----------------
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER as string,
      from: process.env.EMAIL_FROM as string,
    }),
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.user_type = user.user_type;
        token.profession = user.profession;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        if (token.user_type !== undefined) {
          session.user.user_type = token.user_type;
        }
        session.user.profession = token.profession;
      }
      return session;
    },
  },
});
