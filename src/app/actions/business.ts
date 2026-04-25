"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/tenant/getCurrentBusiness";

function clean(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

export async function updateBusinessAction(formData: FormData): Promise<void> {
  const ctx = await getCurrentBusiness();

  if (!ctx?.business) {
    redirect("/onboarding");
  }

  const supabase = await createClient();

  const name = clean(formData.get("name"));
  const business_type = clean(formData.get("business_type"));
  const phone = clean(formData.get("phone"));
  const address = clean(formData.get("address"));
  const theme = clean(formData.get("theme")) || "warm";

  if (!name) {
    redirect("/dashboard/settings?error=El+nombre+del+negocio+es+obligatorio");
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      business_type: business_type || null,
      phone: phone || null,
      address: address || null,
      theme,
      // logo_url ya no se toca aquí
    })
    .eq("id", ctx.business.id);

  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?success=updated");
}