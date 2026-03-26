import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/tenant/getCurrentBusiness";
import { hasSectionAccess, type AppSection } from "@/lib/auth/permissions";

export async function requireSectionAccess(section: AppSection) {
  const ctx = await getCurrentBusiness();

  if (!ctx?.business) {
    redirect("/onboarding");
  }

  if (!hasSectionAccess(ctx.role, section)) {
    redirect("/dashboard?error=No+tienes+acceso+a+ese+apartado");
  }

  return ctx;
}