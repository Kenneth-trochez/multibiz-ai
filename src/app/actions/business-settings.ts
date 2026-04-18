"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const VALID_TIMEZONES = [
  "America/Tegucigalpa",
  "America/Mexico_City",
  "America/Bogota",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Madrid",
] as const;

const VALID_WORKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

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

export async function updateBusinessScheduleAction(
  formData: FormData
): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();
  const timezone = String(
    formData.get("timezone") || "America/Tegucigalpa"
  ).trim();
  const workdayStartTime = String(
    formData.get("workday_start_time") || ""
  ).trim();
  const workdayEndTime = String(
    formData.get("workday_end_time") || ""
  ).trim();

  const selectedWorkdays = formData
    .getAll("workdays")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!businessId) {
    redirect("/dashboard/settings?error=Negocio+inválido");
  }

  if (!VALID_TIMEZONES.includes(timezone as (typeof VALID_TIMEZONES)[number])) {
    redirect("/dashboard/settings?error=Zona+horaria+inválida");
  }

  if (!isValidTime(workdayStartTime) || !isValidTime(workdayEndTime)) {
    redirect("/dashboard/settings?error=Hora+de+apertura+o+cierre+inválida");
  }

  if (timeToMinutes(workdayStartTime) >= timeToMinutes(workdayEndTime)) {
    redirect("/dashboard/settings?error=La+hora+de+apertura+debe+ser+menor+que+la+de+cierre");
  }

  const normalizedWorkdays = Array.from(
    new Set(
      selectedWorkdays.filter((day) =>
        VALID_WORKDAYS.includes(day as (typeof VALID_WORKDAYS)[number])
      )
    )
  );

  if (normalizedWorkdays.length === 0) {
    redirect("/dashboard/settings?error=Debes+seleccionar+al+menos+un+día+laboral");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("business_settings").upsert(
    {
      business_id: businessId,
      timezone,
      workday_start_time: workdayStartTime,
      workday_end_time: workdayEndTime,
      workdays: normalizedWorkdays,
    },
    {
      onConflict: "business_id",
    }
  );

  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/settings");

  redirect("/dashboard/settings?success=schedule_updated");
}

export async function updateAiOverageSettingAction(
  formData: FormData
): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();
  const allowOverageValue = String(formData.get("ai_allow_overage") || "").trim();

  if (!businessId) {
    redirect("/dashboard/ai-assistant?error=Negocio+inválido");
  }

  const aiAllowOverage =
    allowOverageValue === "true" || allowOverageValue === "on";

  const supabase = await createClient();

  const { error } = await supabase.from("business_settings").upsert(
    {
      business_id: businessId,
      ai_allow_overage: aiAllowOverage,
    },
    {
      onConflict: "business_id",
    }
  );

  if (error) {
    redirect(
      `/dashboard/ai-assistant?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/ai-assistant");

  redirect("/dashboard/ai-assistant?success=overage_updated");
}