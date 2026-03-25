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
  const logo = formData.get("logo") as File | null;

  if (!name) {
    redirect("/dashboard/settings?error=El+nombre+del+negocio+es+obligatorio");
  }

  let logo_url = ctx.business.logo_url || null;

  if (logo && logo.size > 0) {
    const fileExt = logo.name.split(".").pop() || "png";
    const filePath = `${ctx.business.id}/logo-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("business-assets")
      .upload(filePath, logo, {
        upsert: true,
      });

    if (uploadError) {
      redirect(
        `/dashboard/settings?error=${encodeURIComponent(uploadError.message)}`
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("business-assets")
      .getPublicUrl(filePath);

    logo_url = publicUrlData.publicUrl;
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      business_type: business_type || null,
      phone: phone || null,
      address: address || null,
      theme,
      logo_url,
    })
    .eq("id", ctx.business.id);

  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?success=updated");
}