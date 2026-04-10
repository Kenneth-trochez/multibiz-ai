import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ensureAiBookingEnabled,
  extractVapiContext,
  resolveBusinessFromCall,
} from "@/lib/vapi/resolveBusinessFromCall";

function requireVapiKey(request: Request) {
  const key = request.headers.get("x-vapi-key") || "";
  const expected = process.env.VAPI_INTERNAL_KEY || "";

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Server misconfigured: missing VAPI_INTERNAL_KEY" },
      { status: 500 }
    );
  }

  if (key !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function POST(request: Request) {
  let payload: any = {};
  let debug: any = {};

  try {
    const unauthorized = requireVapiKey(request);
    if (unauthorized) return unauthorized;

    payload = await request.json().catch(() => ({}));

    const extracted = extractVapiContext(payload) || {};

    const assistantId =
      extracted.assistantId ??
      payload?.assistantId ??
      payload?.call?.assistantId ??
      null;

    const phoneNumberId =
      extracted.phoneNumberId ??
      payload?.phoneNumberId ??
      payload?.call?.phoneNumberId ??
      null;

    const callId =
      extracted.callId ??
      payload?.callId ??
      payload?.call?.id ??
      null;

    debug = {
      assistantId_extracted: extracted.assistantId ?? null,
      assistantId_payload: payload?.assistantId ?? null,
      assistantId_call: payload?.call?.assistantId ?? null,
      assistantId_used: assistantId,
      phoneNumberId_extracted: extracted.phoneNumberId ?? null,
      phoneNumberId_payload: payload?.phoneNumberId ?? null,
      phoneNumberId_call: payload?.call?.phoneNumberId ?? null,
      phoneNumberId_used: phoneNumberId,
      callId_extracted: extracted.callId ?? null,
      callId_payload: payload?.callId ?? null,
      callId_used: callId,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      nodeEnv: process.env.NODE_ENV ?? null,
    };

    // ✅ KEY CHANGE: pass callId too
    const ctx = await resolveBusinessFromCall({
      assistantId,
      phoneNumberId,
      callId,
    });

    await ensureAiBookingEnabled(ctx.businessId);

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("services")
      .select("id, name, price, duration_minutes, active")
      .eq("business_id", ctx.businessId)
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);

    return NextResponse.json({
      ok: true,
      mode: "service_list",
      business: {
        id: ctx.business.id,
        name: ctx.business.name,
        slug: ctx.business.slug,
      },
      services: (data || []).map((service) => ({
        id: service.id,
        name: service.name,
        price: Number(service.price || 0),
        duration_minutes: Number(service.duration_minutes || 0),
      })),
      debug,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron cargar los servicios";

    return NextResponse.json(
      {
        ok: false,
        error: message,
        debug,
      },
      { status: 400 }
    );
  }
}