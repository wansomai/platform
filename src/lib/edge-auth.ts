import { jwtVerify } from 'jose'

// Simple JWT verification for Edge Runtime
export async function verifyAuth(token: string) {
  try {
    const secret = new TextEncoder().encode(
      "23cc5f842ca52345400e310985223cbd92444fba095df1bb9cf0f94a3fb6f9acc7b178a9aa8743db278c5d049946941e33099a15663cd45186c38028c87ed227"
    )
    
    const { payload } = await jwtVerify(token, secret)
    return { userId: payload.userId, valid: true }
  } catch (error) {
    return { valid: false, userId: null }
  }
}