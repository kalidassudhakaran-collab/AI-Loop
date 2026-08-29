export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/inbox/:path*",
    "/ask/:path*",
    "/settings/:path*",
    "/themes/:path*",
    "/reports/:path*",
    "/share/:path*",
  ],
};
