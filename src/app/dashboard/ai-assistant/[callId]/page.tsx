import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { getCurrentPlan } from "@/lib/billing/getCurrentPlan";
import { createClient } from "@/lib/supabase/server";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";

type PageProps = {
  params: Promise<{
    callId: string;
  }>;
};

type AiUsageLogRow = {
  id: string;
  call_id: string;
  assistant_id: string | null;
  usage_date: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  minutes_used: number;
  overage_minutes: number;
  billing_status: string;
  source: string;
  created_at: string;
  updated_at: string;
};

type AiCallDetailRow = {
  call_id: string;
  assistant_id: string | null;
  transcript: string | null;
  summary: string | null;
  messages: any[];
};

type ChatMessage = {
  role: "assistant" | "user" | "system";
  content: string;
};

function formatDateTime(value: string | null, timezone: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-HN", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function extractTextFromUnknownContent(content: any): string {
  if (!content) return "";

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const joined = content
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item?.text && typeof item.text === "string") return item.text.trim();
        if (item?.content && typeof item.content === "string") return item.content.trim();
        if (item?.message && typeof item.message === "string") return item.message.trim();
        if (item?.transcript && typeof item.transcript === "string") return item.transcript.trim();
        return "";
      })
      .filter(Boolean)
      .join("\n");

    return joined.trim();
  }

  if (typeof content === "object") {
    const candidates = [
      content.text,
      content.content,
      content.message,
      content.transcript,
      content.summary,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }

    if (Array.isArray(content.parts)) {
      return extractTextFromUnknownContent(content.parts);
    }

    if (Array.isArray(content.messages)) {
      return extractTextFromUnknownContent(content.messages);
    }
  }

  return "";
}

function normalizeRole(role: unknown): "assistant" | "user" | "system" {
  const value = String(role || "").toLowerCase();

  if (
    value === "assistant" ||
    value === "bot" ||
    value === "ai" ||
    value === "agent"
  ) {
    return "assistant";
  }

  if (
    value === "user" ||
    value === "customer" ||
    value === "caller" ||
    value === "client" ||
    value === "human"
  ) {
    return "user";
  }

  return "system";
}

function normalizeMessages(messages: any[] | null | undefined): ChatMessage[] {
  if (!Array.isArray(messages)) return [];

  const normalized = messages
    .map((msg): ChatMessage | null => {
      if (!msg) return null;

      const role = normalizeRole(msg.role ?? msg.speaker ?? msg.source ?? msg.author);

      const content = extractTextFromUnknownContent(
        msg.content ??
          msg.text ??
          msg.message ??
          msg.transcript ??
          msg.summary ??
          msg.parts
      );

      if (!content) return null;
      if (role === "system") return null;

      return {
        role,
        content,
      };
    })
    .filter(Boolean) as ChatMessage[];

  return normalized;
}

export default async function AiAssistantCallDetailPage({
  params,
}: PageProps) {
  const { callId } = await params;
  const decodedCallId = decodeURIComponent(callId);

  const ctx = await requireSectionAccess("ai_assistant");
  const plan = await getCurrentPlan();
  const supabase = await createClient();

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");

  const { data: settings } = await supabase
    .from("business_settings")
    .select("timezone")
    .eq("business_id", business.id)
    .maybeSingle();

  const timezone = settings?.timezone || "America/Tegucigalpa";

  const hasAiAccess = Boolean(plan?.features?.ai_booking);

  if (!hasAiAccess) {
    notFound();
  }

  const [{ data: usageData }, { data: detailData }] = await Promise.all([
    supabase
      .from("ai_usage_logs")
      .select(`
        id,
        call_id,
        assistant_id,
        usage_date,
        started_at,
        ended_at,
        duration_seconds,
        minutes_used,
        overage_minutes,
        billing_status,
        source,
        created_at,
        updated_at
      `)
      .eq("business_id", business.id)
      .eq("call_id", decodedCallId)
      .maybeSingle(),

    supabase
      .from("ai_call_details")
      .select(`
        call_id,
        assistant_id,
        transcript,
        summary,
        messages
      `)
      .eq("business_id", business.id)
      .eq("call_id", decodedCallId)
      .maybeSingle(),
  ]);

  if (!usageData) {
    notFound();
  }

  const log = usageData as AiUsageLogRow;
  const detail = (detailData || null) as AiCallDetailRow | null;
  const chatMessages = normalizeMessages(detail?.messages);

  return (
    <main className={`min-h-screen ${theme.pageBg}`}>
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
        <section className={`rounded-[28px] border p-6 md:p-8 ${theme.card}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={`text-sm ${theme.textMuted}`}>Detalle de llamada IA</p>
              <h1 className="mt-1 text-3xl font-bold">Call ID</h1>
              <p className={`mt-2 break-all text-sm ${theme.textMuted}`}>
                {log.call_id}
              </p>
            </div>

            <Link
              href="/dashboard/ai-assistant"
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${theme.buttonSecondary}`}
            >
              Volver
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={`rounded-[24px] border p-5 ${theme.cardSoft}`}>
            <p className={`text-xs ${theme.textMuted}`}>Estado</p>
            <p className="mt-2 text-2xl font-bold">{log.billing_status}</p>
          </div>

          <div className={`rounded-[24px] border p-5 ${theme.cardSoft}`}>
            <p className={`text-xs ${theme.textMuted}`}>Duración (seg)</p>
            <p className="mt-2 text-2xl font-bold">{log.duration_seconds}</p>
          </div>

          <div className={`rounded-[24px] border p-5 ${theme.cardSoft}`}>
            <p className={`text-xs ${theme.textMuted}`}>Minutos usados</p>
            <p className="mt-2 text-2xl font-bold">
              {log.minutes_used.toFixed(2)}
            </p>
          </div>

          <div className={`rounded-[24px] border p-5 ${theme.cardSoft}`}>
            <p className={`text-xs ${theme.textMuted}`}>Minutos extra</p>
            <p className="mt-2 text-2xl font-bold">
              {log.overage_minutes.toFixed(2)}
            </p>
          </div>
        </section>

        <section className={`rounded-[28px] border p-6 ${theme.card}`}>
          <h2 className="text-2xl font-semibold">Información</h2>

          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
              <p className={`text-xs ${theme.textMuted}`}>Assistant ID</p>
              <p className="mt-1 break-all font-medium">
                {log.assistant_id || detail?.assistant_id || "—"}
              </p>
            </div>

            <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
              <p className={`text-xs ${theme.textMuted}`}>Fuente</p>
              <p className="mt-1 font-medium">{log.source}</p>
            </div>

            <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
              <p className={`text-xs ${theme.textMuted}`}>Inicio</p>
              <p className="mt-1 font-medium">
                {formatDateTime(log.started_at, timezone)}
              </p>
            </div>

            <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
              <p className={`text-xs ${theme.textMuted}`}>Fin</p>
              <p className="mt-1 font-medium">
                {formatDateTime(log.ended_at, timezone)}
              </p>
            </div>

            <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
              <p className={`text-xs ${theme.textMuted}`}>Registrado</p>
              <p className="mt-1 font-medium">
                {formatDateTime(log.created_at, timezone)}
              </p>
            </div>

            <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
              <p className={`text-xs ${theme.textMuted}`}>Zona horaria</p>
              <p className="mt-1 font-medium">{timezone}</p>
            </div>
          </div>
        </section>

        <section className={`rounded-[28px] border p-6 ${theme.card}`}>
          <h2 className="text-2xl font-semibold">Resumen</h2>

          <div className={`mt-4 rounded-2xl border p-4 ${theme.subtle}`}>
            <p className="text-sm leading-7">
              {detail?.summary || "No hay resumen disponible para esta llamada."}
            </p>
          </div>
        </section>

        <section className={`rounded-[28px] border p-6 ${theme.card}`}>
          <h2 className="text-2xl font-semibold">Conversación</h2>

          {chatMessages.length > 0 ? (
            <div className="mt-5 space-y-4">
              {chatMessages.map((msg, index) => {
                const isAssistant = msg.role === "assistant";

                return (
                  <div
                    key={`${msg.role}-${index}`}
                    className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        isAssistant
                          ? `${theme.subtle} border`
                          : `${theme.buttonPrimary} text-white`
                      }`}
                    >
                      <p className="mb-1 text-xs opacity-70">
                        {isAssistant ? "Asistente IA" : "Cliente"}
                      </p>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`mt-4 rounded-2xl border p-4 ${theme.subtle}`}>
              <pre className="whitespace-pre-wrap text-sm leading-7">
                {detail?.transcript || "No hay conversación disponible."}
              </pre>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}