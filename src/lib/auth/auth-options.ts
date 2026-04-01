// src/lib/auth-options.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from '@/lib/prisma';
import bcrypt from "bcryptjs";
import { User } from "next-auth";
import * as jose from 'jose';

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
    contactEmail: string;
    contactPhone: string;
    currentWebsite: string;
    firmSize: string;
    firmStory: string;
    linkedinUrl: string;
    onboardingCompleted: boolean;
    practiceAreas: string[];
    profileStatus: string;
    serviceAreas: string[];
    yearsInPractice: number;
  };
}

// Generate an access token
const generateAccessToken = async (user: CustomUser) => {
  const jwtSecret = process.env.NEXTAUTH_SECRET;
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
    .setExpirationTime('7d')
    .sign(encodedSecret);

  return token;
};

// Refresh Google OAuth access token
async function refreshGoogleAccessToken(token: any) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_AUTH_CLIENT_ID!,
        client_secret: process.env.GOOGLE_AUTH_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.googleRefreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    // Update the account in the database with new tokens
    await prisma.account.updateMany({
      where: {
        userId: token.userId as string,
        provider: 'google',
      },
      data: {
        access_token: refreshedTokens.access_token,
        expires_at: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
        refresh_token: refreshedTokens.refresh_token ?? token.googleRefreshToken,
      },
    });

    return {
      ...token,
      googleAccessToken: refreshedTokens.access_token,
      googleTokenExpires: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      googleRefreshToken: refreshedTokens.refresh_token ?? token.googleRefreshToken,
    };
  } catch (error) {
    console.error('Error refreshing Google access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_AUTH_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:      { label: "Email",       type: "email" },
        password:   { label: "Password",    type: "password" },
        magicToken: { label: "Magic Token", type: "text" },
      },
      async authorize(credentials, req) {
        // ── Magic-link login (Briefly one-time auto-login) ───────────────────
        if (credentials?.magicToken) {
          try {
            const user = await prisma.user.findFirst({
              where: { resetToken: credentials.magicToken },
              include: { organization: true, activeOrganization: true },
            });
            if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
              return null;
            }
            // Consume token — single use
            await prisma.user.update({
              where: { id: user.id },
              data:  { resetToken: null, resetTokenExpiry: null },
            });
            const currentOrg = user.activeOrganization || user.organization;
            return {
              id:             user.id,
              email:          user.email,
              name:           user.fullName || '',
              role:           user.role,
              organizationId: currentOrg.id,
              organization:   { id: currentOrg.id, name: currentOrg.name },
            } as CustomUser;
          } catch {
            return null;
          }
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            include: {
              organization: true,
              activeOrganization: true,
            },
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // Use active organization if set, otherwise use primary organization
          let currentOrg = user.activeOrganization || user.organization;

          // Self-heal: user has no organization at all
          if (!currentOrg) {
            // Try to find an existing membership first
            const membership = await prisma.userOrganization.findFirst({
              where: { userId: user.id },
              include: { organization: true },
            });

            if (membership) {
              currentOrg = membership.organization;
              await prisma.user.update({
                where: { id: user.id },
                data: { organizationId: membership.organizationId },
              });
            } else {
              // Create a personal org for this user
              const org = await prisma.organization.create({
                data: {
                  name: `${user.fullName || 'My'} Organization`,
                  accountType: 'personal',
                  ownerId: user.id,
                  practiceAreas: [],
                  serviceAreas: [],
                },
              });
              await prisma.user.update({
                where: { id: user.id },
                data: { organizationId: org.id },
              });
              await prisma.userOrganization.create({
                data: { userId: user.id, organizationId: org.id, role: 'owner' },
              });
              currentOrg = org;
            }
          }

          const authUser = {
            id: user.id,
            email: user.email,
            name: user.fullName || "", // Ensure name is never null
            role: user.role,
            organizationId: currentOrg.id,
            organization: {
              id: currentOrg.id,
              name: currentOrg.name
            }
          } as CustomUser;

          return authUser;
        } catch (error) {
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
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'google') {
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: {
              organization: true,
              activeOrganization: true
            }
          });

          if (!dbUser) {
            const organization = await prisma.organization.create({
              data: {
                name: `${user.name}'s Organization`,
                contactEmail: "",
                contactPhone: "",
                currentWebsite: "",
                firmSize: "",
                firmStory: "",
                linkedinUrl: "",
                onboardingCompleted: false,
                practiceAreas: [],
                profileStatus: "pending",
                serviceAreas: [],
                yearsInPractice: 0
              }
            });

            dbUser = await prisma.user.create({
              data: {
                email: user.email!,
                fullName: user.name || '',
                password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
                role: 'admin',
                organizationId: organization.id,
                emailVerified: true,
                authProvider: 'google',
              },
              include: {
                organization: true,
                activeOrganization: true
              }
            });
          }

          // Ensure UserOrganization row exists and org has an ownerId (self-heal for all Google users)
          if (dbUser.organizationId) {
            await prisma.userOrganization.upsert({
              where: { userId_organizationId: { userId: dbUser.id, organizationId: dbUser.organizationId } },
              create: { userId: dbUser.id, organizationId: dbUser.organizationId, role: 'owner' },
              update: {},
            });
            await prisma.organization.updateMany({
              where: { id: dbUser.organizationId, ownerId: null },
              data: { ownerId: dbUser.id },
            });
          }

          // Save or update OAuth account tokens
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId
              }
            },
            create: {
              userId: dbUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state
            },
            update: {
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state
            }
          });

          user.id = dbUser.id;

          // Use active organization if set, otherwise use primary organization
          const currentOrg = dbUser.activeOrganization || dbUser.organization;

          (user as any).organizationId = currentOrg.id;
          (user as any).organization = {
            id: currentOrg.id,
            name: currentOrg.name
          };
          (user as any).role = dbUser.role;

          return true;
        }

        return true;
      } catch (error) {
        return false;
      }
    },

    async jwt({ token, user, account, trigger }) {
      // If session update was triggered (user clicked "Continue Session" on the expiry modal),
      // force-regenerate the access token regardless of its remaining lifetime
      if (trigger === "update") {
        const refreshedUser = {
          id: token.userId as string,
          email: token.email as string,
          name: token.name as string,
          role: token.role as string,
          organizationId: token.organizationId as string,
          organization: token.organization as { id: string; name: string },
        } as CustomUser;
        const newAccessToken = await generateAccessToken(refreshedUser);
        return { ...token, accessToken: newAccessToken };
      }

      // Initial sign in - save Google OAuth tokens to JWT
      if (account && user) {
        const accessToken = await generateAccessToken(user as CustomUser);

        const updatedToken = {
          ...token,
          userId: user.id,
          email: user.email,
          name: user.name,
          role: (user as CustomUser).role || 'user',
          organizationId: (user as any).organizationId,
          organization: (user as any).organization,
          accessToken,
          // Store Google OAuth tokens
          googleAccessToken: account.access_token,
          googleRefreshToken: account.refresh_token,
          googleTokenExpires: account.expires_at,
        };

        return updatedToken;
      }

      // Check if Google OAuth token needs refresh (5 minutes before expiry)
      if (token.googleTokenExpires && token.googleRefreshToken) {
        const shouldRefreshTime = (token.googleTokenExpires as number) - 5 * 60; // 5 minutes before expiry
        const currentTime = Math.floor(Date.now() / 1000);

        if (currentTime > shouldRefreshTime) {
          token = await refreshGoogleAccessToken(token);
        }
      }

      // Check if custom access token needs refresh (1 day before expiry)
      const tokenExpiry = token.exp as number;
      const currentTime = Math.floor(Date.now() / 1000);
      const timeRemaining = tokenExpiry - currentTime;

      if (timeRemaining < 24 * 60 * 60) {
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

        const newAccessToken = await generateAccessToken(user);

        return {
          ...token,
          accessToken: newAccessToken
        };
      }

      return token;
    },
    async session({ session, token, trigger }) {
      if (token && session.user) {
        session.accessToken = token.accessToken as string;
        session.user.id = token.userId as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;

        // If session is being updated (e.g., after org switch), fetch fresh data
        if (trigger === "update") {
          try {
            const user = await prisma.user.findUnique({
              where: { id: token.userId as string },
              include: {
                organization: true,
                activeOrganization: true
              }
            });

            if (user) {
              // Use active organization if set, otherwise use primary organization
              const currentOrg = user.activeOrganization || user.organization;
              session.user.organizationId = currentOrg.id;
              session.user.organization = {
                id: currentOrg.id,
                name: currentOrg.name
              };
            }
          } catch (error) {
            console.error("Error fetching user organization in session callback:", error);
            // Fallback to token data if database fetch fails
            session.user.organizationId = token.organizationId as string;
            session.user.organization = token.organization as {
              id: string;
              name: string;
            };
          }
        } else {
          // For regular session reads, use token data
          session.user.organizationId = token.organizationId as string;
          session.user.organization = token.organization as {
            id: string;
            name: string;
          };
        }
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
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
  debug: false, // Disabled debug mode
  logger: {
    error(code, metadata) {},
    warn(code) {},
    debug(code, metadata) {},
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;