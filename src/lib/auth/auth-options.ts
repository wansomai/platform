// src/lib/auth-options.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { User } from "next-auth";
import * as jose from 'jose';

const prisma = new PrismaClient();

// Define a custom user type that matches what we return from authorize
interface CustomUser extends User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
  };
}

// Generate an access token
const generateAccessToken = async (user: CustomUser) => {
  const jwtSecret = process.env.NEXTAUTH_SECRET || "23cc5f842ca52345400e310985223cbd92444fba095df1bb9cf0f94a3fb6f9acc7b178a9aa8743db278c5d049946941e33099a15663cd45186c38028c87ed227";
  const encodedSecret = new TextEncoder().encode(jwtSecret);
  
  const token = await new jose.SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    organization: user.organization
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(encodedSecret);
  
  return token;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          console.log(`Attempting to authenticate user: ${credentials.email}`);
          
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            include: {
              organization: true,
            },
          });

          if (!user) {
            console.log(`User not found: ${credentials.email}`);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log(`Invalid password for: ${credentials.email}`);
            return null;
          }

          // Return the user object conforming to the User interface
          const authUser = {
            id: user.id,
            email: user.email,
            name: user.fullName || "", // Ensure name is never null
            role: user.role,
            organizationId: user.organizationId,
            organization: {
              id: user.organization.id,
              name: user.organization.name
            }
          } as CustomUser;
          
          console.log(`Authentication successful for: ${credentials.email}`);
          console.log("Auth user object:", JSON.stringify(authUser, null, 2));
          
          return authUser;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("JWT Callback - Input:", { 
        tokenExists: !!token, 
        userExists: !!user 
      });
      
      // Initial sign in
      if (user) {
        console.log("JWT Callback - Adding user data to token");
        
        // Generate an access token for API requests
        const accessToken = await generateAccessToken(user as CustomUser);
        
        const updatedToken = {
          ...token,
          userId: user.id,
          email: user.email,
          name: user.name,
          role: (user as CustomUser).role,
          organizationId: (user as CustomUser).organizationId,
          organization: (user as CustomUser).organization,
          accessToken
        };
        
        console.log("JWT Callback - New token data:", JSON.stringify({
          ...updatedToken,
          accessToken: accessToken ? "[ACCESS_TOKEN]" : undefined
        }, null, 2));
        
        return updatedToken;
      }
      
      // For subsequent calls to /api/auth/session, check if token needs to be refreshed
      const tokenExpiry = token.exp as number;
      const currentTime = Math.floor(Date.now() / 1000);
      const timeRemaining = tokenExpiry - currentTime;
      
      // If token is about to expire (less than 15 minutes), refresh it
      if (timeRemaining < 15 * 60) {
        console.log("JWT Callback - Token is about to expire, refreshing access token");
        
        // Reconstruct the user from token data
        const user = {
          id: token.userId as string,
          email: token.email as string,
          name: token.name as string,
          role: token.role as string,
          organizationId: token.organizationId as string,
          organization: token.organization as {
            id: string;
            name: string;
          }
        } as CustomUser;
        
        // Generate a new access token
        const newAccessToken = await generateAccessToken(user);
        
        return {
          ...token,
          accessToken: newAccessToken
        };
      }
      
      return token;
    },
    async session({ session, token }) {

      
      // Add custom properties to the session
      if (token && session.user) {
      
        session.accessToken = token.accessToken as string;
        session.user.id = token.userId as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        session.user.organization = token.organization as {
          id: string;
          name: string;
        };
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      return baseUrl;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: true, // Enable debug mode for more verbose logs
  logger: {
    error(code, metadata) {
      console.error(`NextAuth Error: ${code}`, metadata);
    },
    warn(code) {
      console.warn(`NextAuth Warning: ${code}`);
    },
    debug(code, metadata) {
      console.log(`NextAuth Debug: ${code}`, metadata);
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "23cc5f842ca52345400e310985223cbd92444fba095df1bb9cf0f94a3fb6f9acc7b178a9aa8743db278c5d049946941e33099a15663cd45186c38028c87ed227"
};

export default authOptions;