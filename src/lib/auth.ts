
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import type { User, UserStatus } from "@prisma/client";

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        badgeNumber: { label: "Badge Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.badgeNumber || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            badgeNumber: String(credentials.badgeNumber).toUpperCase(),
          },
        });

        // If user does not exist, or their password is not set, deny.
        if (!user || !user.password) {
          return null;
        }
        
        // Deny login if user is suspended.
        if (user.status === 'Suspended') {
            return null; // Explicitly block suspended users.
        }
        
        // For 'Inactive' or 'Active' users, proceed to check password.
        const isPasswordCorrect = await bcrypt.compare(
          String(credentials.password),
          user.password
        );

        if (isPasswordCorrect) {
          // Update lastLogin timestamp. If user was 'Inactive', set them to 'Active'.
          await prisma.user.update({
            where: { id: user.id },
            data: { 
                lastLogin: new Date(),
                status: user.status === 'Inactive' ? 'Active' : user.status
            },
          });
          return user as any; // Cast to any to satisfy NextAuth type which expects a simpler object
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign in, `user` object is available
      if (user) {
        const dbUser = user as User; // Cast to our Prisma User type
        token.id = dbUser.id;
        token.role = dbUser.role;
        token.badgeNumber = dbUser.badgeNumber;
        token.name = dbUser.name;
        token.email = dbUser.email;
        token.status = dbUser.status;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom properties to the session object
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "OFFICER";
        session.user.badgeNumber = token.badgeNumber as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.status = token.status as "Active" | "Inactive" | "Suspended";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
