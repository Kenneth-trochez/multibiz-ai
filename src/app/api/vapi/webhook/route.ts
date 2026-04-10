import { NextResponse } from "next/server";
import {
  extractVapiContext,
  resolveBusinessFromCall,
} from "@/lib/vapi/resolveBusinessFromCall";
import { registerAiUsage } from "@/lib/billing/registerAiUsage";
import { registerAiCallDetail } from "@/lib/billing/registerAiCallDetail";

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

function extractTranscript(payload: any): string | null {
  const candidates = [
    payload?.transcript,
    payload?.call?.transcript,
    payload?.message?.transcript,
    payload?.artifact?.transcript,
    payload?.analysis?.transcript,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
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
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
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
  ];

  for (const value of candidates) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
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

    const ctx = await resolveBusinessFromCall({
      assistantId,
      phoneNumberId,
      callId,
    });

    // Siempre intentamos guardar detalle si viene transcript/messages/summary
    const transcript = extractTranscript(payload);
    const summary = extractSummary(payload);
    const messages = extractMessages(payload);

    if (transcript || summary || messages.length > 0) {
      await registerAiCallDetail({
        businessId: ctx.businessId,
        callId,
        assistantId: ctx.assistantId,
        transcript,
        summary,
        messages,
        rawPayload: payload,
      });
    }

    const shouldRegisterUsage =
      eventType.includes("end") ||
      eventType.includes("completed") ||
      eventType.includes("finished");

    if (!shouldRegisterUsage) {
      return NextResponse.json({
        ok: true,
        savedDetail: transcript || summary || messages.length > 0,
        skippedUsage: true,
        reason: "Event ignored for usage",
      });
    }

    const durationSeconds = getDurationSeconds(payload);

    const usage = await registerAiUsage({
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
      savedDetail: transcript || summary || messages.length > 0,
      ...usage,
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