import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Top-level paths that are NOT localized (no [locale] segment). next-intl must
// NOT touch these or it would redirect/rewrite them under a locale and break
// them. Supabase auth still runs (admin needs it).
const NON_LOCALIZED = ["/admin", "/auth", "/feed"];

const PROTECTED_PATHS = ["/account", "/admin"];
const AUTH_PATHS = ["/login", "/register"];

// Split a leading locale segment: "/en/account" -> { locale: "en", rest: "/account" }
function splitLocale(pathname: string): {
  locale: string | null;
  rest: string;
} {
  const seg = pathname.split("/")[1];
  if ((routing.locales as readonly string[]).includes(seg)) {
    return { locale: seg, rest: pathname.slice(seg.length + 1) || "/" };
  }
  return { locale: null, rest: pathname };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isNonLocalized = NON_LOCALIZED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // 1) Locale detection/redirect + NEXT_LOCALE cookie (localized paths only).
  const response = isNonLocalized
    ? NextResponse.next({ request })
    : intlMiddleware(request);
  // If next-intl issued a redirect (e.g. to add/strip a prefix), honor it now.
  if (response.headers.get("location")) return response;

  // 2) Supabase auth on top, writing refreshed cookies onto the response above.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { locale, rest } = splitLocale(pathname);
  const prefix = locale ? `/${locale}` : "";
  const isProtected = PROTECTED_PATHS.some((p) => rest.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => rest.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `${prefix}/login`;
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && user) {
    const nextPath =
      request.nextUrl.searchParams.get("next") ?? `${prefix}/account`;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = nextPath;
    redirectUrl.searchParams.delete("next");
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
