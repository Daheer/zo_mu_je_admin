import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "./lib/admin-session";
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const headers = new Headers(request.headers);
  headers.set("x-admin-pathname", pathname);
  if (pathname !== "/login") {
    const session = await verifySession(request.cookies.get("admin_session")?.value || "", process.env.ADMIN_COOKIE_SECRET || "");
    if (!session) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("admin_session");
      return response;
    }
  }
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-transparent.png).*)"] };
