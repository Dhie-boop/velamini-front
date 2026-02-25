import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

export default NextAuth(authConfig).auth

export const config = {
  matcher: [
    // Exclude /api/chat/shared from auth
    '/((?!api/chat/shared|api|_next/static|_next/image|favicon.ico).*)',
  ],
}
