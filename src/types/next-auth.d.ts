// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

// Extend the built-in types
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      organizationId: string;
      organization: {
        id: string;
        name: string;
      };
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role?: string;
    organizationId?: string;
    organization?: {
      id: string;
      name: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    email: string;
    name: string;
    role: string;
    organizationId: string;
    organization: {
      id: string;
      name: string;
    };
    accessToken?: string;
  }
}