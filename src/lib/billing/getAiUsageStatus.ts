import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentPlanForBusiness } from "@/lib/vapi/resolveBusinessFromCall";

type AiUsageStatus = {
  planCode: string | null;
  includedMinutes: number;
  maxCallMinutes: number;
  overagePrice: number;
  usedMinutesThisMonth: number;
  remainingMinutes: number;
  overageMinutesThisMonth: number;
  hasIncludedMinutesAvailable: boolean;
};

function getMonthRange(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export async function getAiUsageStatus(
  businessId: string
): Promise<AiUsageStatus> {
  const supabase = createAdminClient();
  const plan = await getCurrentPlanForBusiness(businessId);

  const includedMinutes = Number(plan?.limits?.ai_monthly_minutes || 0);
  const maxCallMinutes = Number(plan?.limits?.ai_max_call_minutes || 0);
  const overagePrice = Number(plan?.limits?.ai_overage_price || 0);

  const { start, end } = getMonthRange();

  const { data, error } = await supabase
    .from("ai_usage_logs")
    .select("minutes_used, overage_minutes")
    .eq("business_id", businessId)
    .gte("usage_date", start)
    .lt("usage_date", end);

  if (error) {
    throw new Error(`No se pudo leer el uso de IA: ${error.message}`);
  }

  const usedMinutesThisMonth = Number(
    (data || []).reduce((acc, row) => acc + Number(row.minutes_used || 0), 0)
  );

  const overageMinutesThisMonth = Number(
    (data || []).reduce((acc, row) => acc + Number(row.overage_minutes || 0), 0)
  );

  const remainingMinutes = Math.max(0, includedMinutes - usedMinutesThisMonth);

  return {
    planCode: plan?.code || null,
    includedMinutes,
    maxCallMinutes,
    overagePrice,
    usedMinutesThisMonth,
    remainingMinutes,
    overageMinutesThisMonth,
    hasIncludedMinutesAvailable: remainingMinutes > 0,
  };
}