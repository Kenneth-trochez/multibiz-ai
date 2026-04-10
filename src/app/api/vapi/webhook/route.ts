import { NextResponse } from "next/server";
import { extractVapiContext, resolveBusinessFromCall } from "@/lib/vapi/resolveBusinessFromCall";
import { registerAiUsage } from "@/lib/billing/registerAiUsage";

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

function getDurationSeconds(payload: any): number {
  const candidates = [
    payload?.durationSeconds,
    payload?.call?.durationSeconds,
    payload?.message?.durationSeconds,
    payload?.call?.duration,
    payload?.message?.call?.duration,
  ];

  for (const value of candidates) {
    const num = Number(value);
    if (Number.isFinite(num) && num >= 0) {
      return Math.trunc(num);
    }
  }

  return 0;
}

export async function POST(request: Request) {
  try {
    const unauthorized = requireVapiKey(request);
    if (unauthorized) return unauthorized;

    const payload = await request.json().catch(() => ({}));
    const { assistantId, phoneNumberId, callId } = extractVapiContext(payload);

    if (!callId) {
      return NextResponse.json({ ok: true, skipped: true, reason: "No callId" });
    }

    const eventType = String(
      payload?.type ||
      payload?.message?.type ||
      payload?.event ||
      ""
    ).trim();

    // Ajusta luego si quieres registrar más eventos.
    const shouldRegister =
      eventType.includes("end") ||
      eventType.includes("completed") ||
      eventType.includes("finished");

    if (!shouldRegister) {
      return NextResponse.json({ ok: true, skipped: true, reason: "Event ignored" });
    }

    const ctx = await resolveBusinessFromCall({
      assistantId,
      phoneNumberId,
      callId,
    });

    const durationSeconds = getDurationSeconds(payload);

    const result = await registerAiUsage({
      businessId: ctx.businessId,
      assistantId: ctx.assistantId,
      callId,
      startedAt:
        payload?.startedAt ||
        payload?.call?.startedAt ||
        payload?.message?.startedAt ||
        null,
      endedAt:
        payload?.endedAt ||
        payload?.call?.endedAt ||
        payload?.message?.endedAt ||
        null,
      durationSeconds,
      metadata: {
        eventType,
        rawType: payload?.type || null,
      },
    });

    return NextResponse.json({
      ok: true,
      registered: true,
      callId,
      businessId: ctx.businessId,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo registrar el uso de IA";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 400 }
    );
  }
}