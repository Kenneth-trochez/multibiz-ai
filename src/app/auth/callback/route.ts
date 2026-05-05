import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next");

  const next =
    nextParam && nextParam.startsWith("/")
      ? nextParam
      : "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=Link+de+invitación+inválido", requestUrl.origin)
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        "/login?error=El+link+expiró+o+no+se+pudo+validar.+Solicita+uno+nuevo",
        requestUrl.origin
      )
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}