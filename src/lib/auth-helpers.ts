// src/lib/auth-helpers.ts
import { NextRequest, NextResponse } from 'next/server';

export async function authenticateRequest(request: NextRequest) {
  // TEMPORARILY BYPASSING AUTHENTICATION
  // Return success with a dummy user ID
  return {
    authenticated: true,
    userId: 'cm7xswboz0000ye0wpfo5npsp'
  };
}