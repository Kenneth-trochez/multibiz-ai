import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ensureAiBookingEnabled,
  extractVapiContext,
  resolveBusinessFromCall,
} from "@/lib/vapi/resolveBusinessFromCall";

// ✅ NEW: API key protection (simple)
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
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}

export async function POST(request: Request) {
  try {
    // ✅ NEW: protect endpoint
    const unauthorized = requireVapiKey(request);
    if (unauthorized) return unauthorized;

    const payload = await request.json().catch(() => ({}));
    const { assistantId, phoneNumberId } = extractVapiContext(payload);

    const ctx = await resolveBusinessFromCall({
      assistantId,
      phoneNumberId,
    });

    await ensureAiBookingEnabled(ctx.businessId);

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("services")
      .select("id, name, price, duration_minutes, active")
      .eq("business_id", ctx.businessId)
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

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
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron cargar los servicios";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 }
    );
  }
}