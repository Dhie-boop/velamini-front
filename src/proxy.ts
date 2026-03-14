import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

export default NextAuth(authConfig).auth

export const config = {
  // Targeted whitelist — only run auth middleware on routes that need it.
  // A broad catch-all pattern intercepts Next.js internal dev-server paths
  // (webpack-hmr, RSC prefetches, _next/*) and causes all pages to 404.
  matcher: [
    // Protected app areas
    "/Dashboard/:path*",
    "/training/:path*",
    "/profile/:path*",
    "/settings/:path*",
    // Auth flows (redirect to Dashboard if already signed in)
    "/auth/:path*",
    "/admin/:path*",
    // Email verification gate
    "/verify-email",
    // Onboarding
    "/onboarding",
    // Maintenance mode page
    "/maintenance",
  ],
}
