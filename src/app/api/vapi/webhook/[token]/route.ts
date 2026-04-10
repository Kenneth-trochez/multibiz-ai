import { NextResponse } from "next/server";
import {
  extractVapiContext,
  resolveBusinessFromCall,
} from "@/lib/vapi/resolveBusinessFromCall";
import { registerAiUsage } from "@/lib/billing/registerAiUsage";
import { registerAiCallDetail } from "@/lib/billing/registerAiCallDetail";

function requireWebhookToken(tokenFromPath: string) {
  const expected = process.env.VAPI_WEBHOOK_TOKEN || "";

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Server misconfigured: missing VAPI_WEBHOOK_TOKEN" },
      { status: 500 }
    );
  }

  if (tokenFromPath !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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
    if (Number.isFinite(num) && num >= 0) return Math.trunc(num);
  }

  return 0;
}

function extractTranscript(payload: any): string | null {
  // end-of-call-report normalmente trae artifact.transcript y/o message.call.artifact.transcript
  const candidates = [
    payload?.transcript,
    payload?.call?.transcript,
    payload?.message?.transcript,
    payload?.artifact?.transcript,
    payload?.analysis?.transcript,

    payload?.call?.artifact?.transcript,
    payload?.message?.call?.artifact?.transcript,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
}

function extractSummary(payload: any): string | null {
  const candidates = [
    payload?.summary,
    payload?.call?.summary,
    payload?.message?.summary,
    payload?.analysis?.summary,
    payload?.artifact?.summary,

    payload?.call?.analysis?.summary,
    payload?.message?.call?.analysis?.summary,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
}

function extractMessages(payload: any): unknown[] {
  const candidates = [
    payload?.messages,
    payload?.call?.messages,
    payload?.message?.messages,
    payload?.artifact?.messages,
    payload?.transcriptMessages,

    payload?.call?.artifact?.messages,
    payload?.message?.call?.artifact?.messages,
  ];

  for (const value of candidates) {
    if (Array.isArray(value)) return value;
  }

  return [];
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await ctx.params;

    const unauthorized = requireWebhookToken(token);
    if (unauthorized) return unauthorized;

    const payload = await request.json().catch(() => ({}));
    const { assistantId, phoneNumberId, callId } = extractVapiContext(payload);

    if (!callId) {
      return NextResponse.json({ ok: true, skipped: true, reason: "No callId" });
    }

    const eventType = String(
      payload?.type || payload?.message?.type || payload?.event || ""
    ).trim();

    const businessCtx = await resolveBusinessFromCall({
      assistantId,
      phoneNumberId,
      callId,
    });

    // Guardar detalle cuando venga info (transcript/messages/summary)
    const transcript = extractTranscript(payload);
    const summary = extractSummary(payload);
    const messages = extractMessages(payload);

    const savedDetail = Boolean(transcript || summary || messages.length > 0);

    if (savedDetail) {
      await registerAiCallDetail({
        businessId: businessCtx.businessId,
        callId,
        assistantId: businessCtx.assistantId,
        transcript,
        summary,
        messages,
        rawPayload: payload,
      });
    }

    // Registrar uso SOLO cuando sea cierre (end-of-call-report)
    const shouldRegisterUsage =
      eventType.includes("end-of-call-report") ||
      eventType.includes("end") ||
      eventType.includes("completed") ||
      eventType.includes("finished");

    if (!shouldRegisterUsage) {
      return NextResponse.json({
        ok: true,
        savedDetail,
        skippedUsage: true,
        reason: "Event ignored for usage",
        eventType,
      });
    }

    const durationSeconds = getDurationSeconds(payload);

    const usage = await registerAiUsage({
      businessId: businessCtx.businessId,
      assistantId: businessCtx.assistantId,
      callId,
      startedAt:
        payload?.startedAt ||
        payload?.call?.startedAt ||
        payload?.message?.startedAt ||
        payload?.message?.call?.startedAt ||
        null,
      endedAt:
        payload?.endedAt ||
        payload?.call?.endedAt ||
        payload?.message?.endedAt ||
        payload?.message?.call?.endedAt ||
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
      businessId: businessCtx.businessId,
      savedDetail,
      ...usage,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo registrar el uso de IA";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}