import NextAuth, { type DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import { UserRole, UserStatus } from "@prisma/client";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role: UserRole;
      badgeNumber: string;
      status: UserStatus;
    } & DefaultSession["user"]; // Keep default properties like name, email, image
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and sent to the `session` callback. */
  interface JWT {
    id: string;
    role: UserRole;
    badgeNumber: string;
    status: UserStatus;
  }
}
