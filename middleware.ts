import { authMiddleware } from "@clerk/nextjs/server"

export default authMiddleware({
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/gallery",
    "/gallery/(.*)",
    "/about",
    "/contact",
    "/blog",
    "/blog/(.*)",
    "/api/categories",
    "/api/art-listings",
    "/api/payments/pesapal",
    "/api/payments/pesapal/(.*)",
    "/api/pesapal/ipn",
    "/api/pesapal/ipn/(.*)",
    "/api/payments/pesapal/ipn",
    "/api/payments/pesapal/ipn/(.*)",
    "/api/payments/mpesa/callback",
  ],
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
