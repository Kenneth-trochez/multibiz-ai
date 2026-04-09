import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ensureAiBookingEnabled,
  extractVapiContext,
  resolveBusinessFromCall,
} from "@/lib/vapi/resolveBusinessFromCall";

export async function POST(request: Request) {
  try {
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