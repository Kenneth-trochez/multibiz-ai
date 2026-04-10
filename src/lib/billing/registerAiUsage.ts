import { createAdminClient } from "@/lib/supabase/admin";
import { getAiUsageStatus } from "@/lib/billing/getAiUsageStatus";

type RegisterAiUsageParams = {
  businessId: string;
  assistantId?: string | null;
  callId: string;
  startedAt?: string | null;
  endedAt?: string | null;
  durationSeconds: number;
  metadata?: Record<string, unknown>;
};

function roundMinutes(seconds: number) {
  return Math.ceil(seconds / 60 * 100) / 100;
}

export async function registerAiUsage(params: RegisterAiUsageParams) {
  const {
    businessId,
    assistantId,
    callId,
    startedAt,
    endedAt,
    durationSeconds,
    metadata = {},
  } = params;

  if (!callId) {
    throw new Error("callId es obligatorio para registrar uso de IA");
  }

  const usageStatus = await getAiUsageStatus(businessId);
  const minutesUsed = roundMinutes(durationSeconds);

  const includedRemainingBeforeThisCall = usageStatus.remainingMinutes;
  const overageMinutes = Math.max(0, minutesUsed - includedRemainingBeforeThisCall);

  const billingStatus =
    overageMinutes > 0 ? "overage" : "included";

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("ai_usage_logs")
    .upsert(
      {
        business_id: businessId,
        assistant_id: assistantId || null,
        call_id: callId,
        usage_date: new Date().toISOString().slice(0, 10),
        started_at: startedAt || null,
        ended_at: endedAt || null,
        duration_seconds: durationSeconds,
        minutes_used: minutesUsed,
        overage_minutes: overageMinutes,
        billing_status: billingStatus,
        source: "vapi_voice",
        metadata,
      },
      { onConflict: "call_id" }
    );

  if (error) {
    throw new Error(`No se pudo registrar el uso de IA: ${error.message}`);
  }

  return {
    minutesUsed,
    overageMinutes,
    billingStatus,
    overageAmount: Number((overageMinutes * usageStatus.overagePrice).toFixed(2)),
  };
}