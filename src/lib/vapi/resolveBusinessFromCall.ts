import { createAdminClient } from "@/lib/supabase/admin";

type BusinessContext = {
  businessId: string;
  assistantId: string;
  phoneNumberId: string | null;
  business: {
    id: string;
    name: string;
    slug: string;
    business_type: string;
    theme: string;
  };
};

type CurrentPlan = {
  code: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
};

function isLiquidPlaceholder(value: unknown) {
  return typeof value === "string" && value.includes("{{") && value.includes("}}");
}

function firstNonEmptyString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string") {
      const v = value.trim();
      if (!v) continue;
      if (isLiquidPlaceholder(v)) continue; // ✅ key fix
      return v;
    }
  }
  return null;
}

export function extractVapiContext(payload: any) {
  const assistantId = firstNonEmptyString(
    payload?.assistantId,
    payload?.assistant?.id,
    payload?.message?.assistantId,
    payload?.message?.assistant?.id,
    payload?.call?.assistantId,
    payload?.call?.assistant?.id,
    payload?.message?.call?.assistantId,
    payload?.message?.call?.assistant?.id
  );

  const phoneNumberId = firstNonEmptyString(
    payload?.phoneNumberId,
    payload?.phoneNumber?.id,
    payload?.message?.phoneNumberId,
    payload?.message?.phoneNumber?.id,
    payload?.call?.phoneNumberId,
    payload?.call?.phoneNumber?.id,
    payload?.message?.call?.phoneNumberId,
    payload?.message?.call?.phoneNumber?.id
  );

  const callId = firstNonEmptyString(
    payload?.callId,
    payload?.call?.id,
    payload?.message?.callId,
    payload?.message?.call?.id,
    payload?.id
  );

  return { assistantId, phoneNumberId, callId };
}

async function getAssistantIdFromVapiCall(callId: string): Promise<string> {
  const apiKey = process.env.VAPI_PRIVATE_KEY || "";
  if (!apiKey) throw new Error("Server misconfigured: missing VAPI_PRIVATE_KEY");

  const res = await fetch(`https://api.vapi.ai/call/${callId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`Vapi GET /call failed (${res.status}): ${JSON.stringify(data)}`);
  }

  const assistantId = data?.assistantId;
  if (!assistantId || typeof assistantId !== "string") {
    throw new Error("Vapi call missing assistantId");
  }

  return assistantId;
}

export async function resolveBusinessFromCall(params: {
  assistantId?: string | null;
  phoneNumberId?: string | null;
  callId?: string | null; // ✅ new
}): Promise<BusinessContext> {
  let { assistantId, phoneNumberId, callId } = params;
  const supabase = createAdminClient();

  // ✅ Guard against placeholders
  if (isLiquidPlaceholder(assistantId)) assistantId = null;
  if (isLiquidPlaceholder(phoneNumberId)) phoneNumberId = null;
  if (isLiquidPlaceholder(callId)) callId = null;

  // ✅ WebCall fix: resolve assistantId via Vapi API when we have callId
  if (!assistantId && callId) {
    assistantId = await getAssistantIdFromVapiCall(callId);
  }

  if (!assistantId && !phoneNumberId) {
    throw new Error("No se recibió assistantId ni phoneNumberId para identificar el negocio");
  }

  let query = supabase
    .from("business_vapi_assistants")
    .select(`
      business_id,
      vapi_assistant_id,
      vapi_phone_number_id,
      active,
      business:businesses (
        id,
        name,
        slug,
        business_type,
        theme
      )
    `)
    .eq("active", true)
    .limit(1);

  if (assistantId) {
    query = query.eq("vapi_assistant_id", assistantId);
  } else if (phoneNumberId) {
    query = query.eq("vapi_phone_number_id", phoneNumberId);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    throw new Error("No se encontró un negocio activo asociado a ese assistant de Vapi");
  }

  const business = Array.isArray(data.business) ? data.business[0] : data.business;
  if (!business) throw new Error("No se pudo cargar el negocio asociado al assistant");

  return {
    businessId: data.business_id,
    assistantId: data.vapi_assistant_id,
    phoneNumberId: data.vapi_phone_number_id ?? null,
    business,
  };
}

export async function getCurrentPlanForBusiness(
  businessId: string
): Promise<CurrentPlan | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("business_subscriptions")
    .select(`
      id,
      status,
      plan:subscription_plans(
        code,
        features,
        limits
      )
    `)
    .eq("business_id", businessId)
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle();

  if (error || !data) return null;

  const plan = Array.isArray(data.plan) ? data.plan[0] : data.plan;
  if (!plan) return null;

  return {
    code: plan.code,
    features: plan.features || {},
    limits: plan.limits || {},
  };
}

export async function ensureAiBookingEnabled(businessId: string) {
  const plan = await getCurrentPlanForBusiness(businessId);

  if (!plan) throw new Error("No se pudo leer el plan actual del negocio");
  if (!plan.features?.ai_booking) {
    throw new Error("El plan actual del negocio no incluye agendamiento por IA");
  }

  return plan;
}