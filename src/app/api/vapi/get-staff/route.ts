import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceAiUsagePolicy } from "@/lib/billing/enforceAiUsagePolicy";
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
  try {
    const unauthorized = requireVapiKey(request);
    if (unauthorized) return unauthorized;

    const payload = await request.json().catch(() => ({}));
    const { assistantId, phoneNumberId, callId } = extractVapiContext(payload);

    const ctx = await resolveBusinessFromCall({
      assistantId,
      phoneNumberId,
      callId,
    });

    await ensureAiBookingEnabled(ctx.businessId);

    const usagePolicy = await enforceAiUsagePolicy(ctx.businessId);

    if (!usagePolicy.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: usagePolicy.warning,
          usage: usagePolicy,
        },
        { status: 402 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("staff")
      .select("id, display_name, specialty, active")
      .eq("business_id", ctx.businessId)
      .eq("active", true)
      .order("display_name", { ascending: true });

    if (error) throw new Error(error.message);

    return NextResponse.json({
      ok: true,
      mode: "staff_list",
      business: {
        id: ctx.business.id,
        name: ctx.business.name,
        slug: ctx.business.slug,
      },
      usage: usagePolicy,
      staff: (data || []).map((member) => ({
        id: member.id,
        display_name: member.display_name,
        specialty: member.specialty || null,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo cargar el staff";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}