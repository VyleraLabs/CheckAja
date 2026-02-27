import { auth } from "@/auth"

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");

    if (isDashboardRoute && !isLoggedIn) {
        const signInUrl = new URL("/login", req.nextUrl.origin);
        // Optionally append callbackUrl to redirect back after login
        signInUrl.searchParams.append("callbackUrl", req.nextUrl.pathname);
        return Response.redirect(signInUrl);
    }
})

// Optionally configure matcher to avoid running auth on static files
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
