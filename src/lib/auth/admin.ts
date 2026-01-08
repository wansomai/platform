import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";

/**
 * List of admin email addresses
 * Can add multiple emails separated by commas in the ADMIN_EMAILS environment variable
 */
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(email => email.length > 0);

/**
 * Check if an email address belongs to an admin user
 * @param email - Email address to check
 * @returns true if the email is in the admin list
 */
export function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Get admin status from the current session
 * @returns Object containing admin status and email
 */
export async function getAdminUserFromSession(): Promise<{
  isAdmin: boolean;
  email: string | null;
  userId: string | null;
}> {
  const session = await getServerSession(authOptions);

  return {
    isAdmin: isAdminUser(session?.user?.email),
    email: session?.user?.email || null,
    userId: session?.user?.id || null,
  };
}

/**
 * Check if the current session belongs to an admin user
 * Throws error if not admin
 */
export async function requireAdmin(): Promise<{
  email: string;
  userId: string;
}> {
  const { isAdmin, email, userId } = await getAdminUserFromSession();

  if (!isAdmin || !email || !userId) {
    throw new Error('Admin access required');
  }

  return { email, userId };
}
