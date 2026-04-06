import { createClient } from "@/lib/supabase/server";

export type BusinessSettingsRow = {
  business_id: string;
  daily_sales_goal: number;
  monthly_sales_goal: number;
  daily_appointments_goal: number;
};

export async function getBusinessSettings(
  businessId: string
): Promise<BusinessSettingsRow> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("business_settings")
    .select(
      "business_id, daily_sales_goal, monthly_sales_goal, daily_appointments_goal"
    )
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return {
      business_id: data.business_id,
      daily_sales_goal: Number(data.daily_sales_goal || 0),
      monthly_sales_goal: Number(data.monthly_sales_goal || 0),
      daily_appointments_goal: Number(data.daily_appointments_goal || 0),
    };
  }

  return {
    business_id: businessId,
    daily_sales_goal: 3000,
    monthly_sales_goal: 60000,
    daily_appointments_goal: 8,
  };
}