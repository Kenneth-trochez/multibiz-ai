import { createAdminClient } from "@/lib/supabase/admin";
import { getAiUsageStatus } from "@/lib/billing/getAiUsageStatus";

type AiUsagePolicyResult = {
  allowed: boolean;
  planCode: string | null;
  includedMinutes: number;
  usedMinutesThisMonth: number;
  remainingMinutes: number;
  overageMinutesThisMonth: number;
  overagePrice: number;
  allowOverage: boolean;
  mode: "included" | "overage" | "blocked";
  warning: string | null;
};

export async function enforceAiUsagePolicy(
  businessId: string
): Promise<AiUsagePolicyResult> {
  const usage = await getAiUsageStatus(businessId);
  const supabase = createAdminClient();

  const { data: settings, error } = await supabase
    .from("business_settings")
    .select("ai_allow_overage")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer business_settings: ${error.message}`);
  }

  const allowOverage = Boolean(settings?.ai_allow_overage);

  if (usage.remainingMinutes > 0) {
    return {
      allowed: true,
      planCode: usage.planCode,
      includedMinutes: usage.includedMinutes,
      usedMinutesThisMonth: usage.usedMinutesThisMonth,
      remainingMinutes: usage.remainingMinutes,
      overageMinutesThisMonth: usage.overageMinutesThisMonth,
      overagePrice: usage.overagePrice,
      allowOverage,
      mode: "included",
      warning: null,
    };
  }

  if (allowOverage) {
    return {
      allowed: true,
      planCode: usage.planCode,
      includedMinutes: usage.includedMinutes,
      usedMinutesThisMonth: usage.usedMinutesThisMonth,
      remainingMinutes: usage.remainingMinutes,
      overageMinutesThisMonth: usage.overageMinutesThisMonth,
      overagePrice: usage.overagePrice,
      allowOverage,
      mode: "overage",
      warning: `Este negocio ya consumió sus minutos incluidos y ahora está usando sobreconsumo a $${usage.overagePrice.toFixed(
        2
      )} por minuto.`,
    };
  }

  return {
    allowed: false,
    planCode: usage.planCode,
    includedMinutes: usage.includedMinutes,
    usedMinutesThisMonth: usage.usedMinutesThisMonth,
    remainingMinutes: usage.remainingMinutes,
    overageMinutesThisMonth: usage.overageMinutesThisMonth,
    overagePrice: usage.overagePrice,
    allowOverage,
    mode: "blocked",
    warning:
      "El negocio ya consumió sus minutos de IA incluidos y no tiene habilitado el sobreconsumo.",
  };
}