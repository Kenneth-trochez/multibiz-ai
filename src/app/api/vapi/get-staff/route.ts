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
      .from("staff")
      .select("id, display_name, specialty, active")
      .eq("business_id", ctx.businessId)
      .eq("active", true)
      .order("display_name", { ascending: true });

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
      staff: (data || []).map((member) => ({
        id: member.id,
        display_name: member.display_name,
        specialty: member.specialty || null,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo cargar el staff";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 }
    );
  }
}