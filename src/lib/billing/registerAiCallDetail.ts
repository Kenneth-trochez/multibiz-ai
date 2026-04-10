import { createAdminClient } from "@/lib/supabase/admin";

type RegisterAiCallDetailParams = {
  businessId: string;
  callId: string;
  assistantId?: string | null;
  transcript?: string | null;
  summary?: string | null;
  messages?: unknown[];
  rawPayload?: Record<string, unknown>;
};

function normalizeTranscript(payload: RegisterAiCallDetailParams) {
  if (typeof payload.transcript === "string" && payload.transcript.trim()) {
    return payload.transcript.trim();
  }

  return null;
}

function normalizeSummary(payload: RegisterAiCallDetailParams) {
  if (typeof payload.summary === "string" && payload.summary.trim()) {
    return payload.summary.trim();
  }

  return null;
}

export async function registerAiCallDetail(
  params: RegisterAiCallDetailParams
) {
  const supabase = createAdminClient();

  const transcript = normalizeTranscript(params);
  const summary = normalizeSummary(params);
  const messages = Array.isArray(params.messages) ? params.messages : [];
  const rawPayload = params.rawPayload || {};

  const { error } = await supabase
    .from("ai_call_details")
    .upsert(
      {
        business_id: params.businessId,
        call_id: params.callId,
        assistant_id: params.assistantId || null,
        transcript,
        summary,
        messages,
        raw_payload: rawPayload,
      },
      { onConflict: "call_id" }
    );

  if (error) {
    throw new Error(`No se pudo registrar el detalle de llamada: ${error.message}`);
  }
}