"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function markAlertAsReadAction(formData: FormData): Promise<void> {
  const alertId = String(formData.get("alertId") || "").trim();

  if (!alertId) {
    redirect("/dashboard/insights?error=Alerta+inválida");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("business_alerts")
    .update({ is_read: true })
    .eq("id", alertId);

  if (error) {
    redirect(`/dashboard/insights?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/insights");
  redirect("/dashboard/insights");
}