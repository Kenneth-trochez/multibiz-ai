"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateBusinessGoalsAction(
  formData: FormData
): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();
  const dailySalesGoal = Number(formData.get("daily_sales_goal") || 0);
  const monthlySalesGoal = Number(formData.get("monthly_sales_goal") || 0);
  const dailyAppointmentsGoal = Number(
    formData.get("daily_appointments_goal") || 0
  );

  if (!businessId) {
    redirect("/dashboard/settings?error=Negocio+inválido");
  }

  if (
    Number.isNaN(dailySalesGoal) ||
    Number.isNaN(monthlySalesGoal) ||
    Number.isNaN(dailyAppointmentsGoal) ||
    dailySalesGoal < 0 ||
    monthlySalesGoal < 0 ||
    dailyAppointmentsGoal < 0
  ) {
    redirect("/dashboard/settings?error=Metas+inválidas");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("business_settings").upsert(
    {
      business_id: businessId,
      daily_sales_goal: dailySalesGoal,
      monthly_sales_goal: monthlySalesGoal,
      daily_appointments_goal: Math.trunc(dailyAppointmentsGoal),
    },
    {
      onConflict: "business_id",
    }
  );

  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/insights");

  redirect("/dashboard/settings?success=goals_updated");
}