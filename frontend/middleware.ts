import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/api/:path*"],
};

export function middleware(request: NextRequest) {
  return NextResponse.rewrite(
    new URL(
      `${process.env.API_HOST}${request.nextUrl.pathname.substring(4)}${request.nextUrl.search}`
    ),
    { request }
  );
}