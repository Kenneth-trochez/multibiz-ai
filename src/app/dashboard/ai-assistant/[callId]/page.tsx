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

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-HN");
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

  const hasAiAccess = Boolean(plan?.features?.ai_booking);

  if (!hasAiAccess) {
    notFound();
  }

  const [{ data: usageData }, { data: detailData }] =
    await Promise.all([
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

  return (
    <main className={`min-h-screen ${theme.pageBg}`}>
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">

        {/* HEADER */}
        <section className={`rounded-[28px] border p-6 md:p-8 ${theme.card}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={`text-sm ${theme.textMuted}`}>
                Detalle de llamada IA
              </p>
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

        {/* MÉTRICAS */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={`rounded-[24px] border p-5 ${theme.cardSoft}`}>
            <p className={`text-xs ${theme.textMuted}`}>Estado</p>
            <p className="mt-2 text-2xl font-bold">{log.billing_status}</p>
          </div>

          <div className={`rounded-[24px] border p-5 ${theme.cardSoft}`}>
            <p className={`text-xs ${theme.textMuted}`}>Duración (seg)</p>
            <p className="mt-2 text-2xl font-bold">
              {log.duration_seconds}
            </p>
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

        {/* INFO */}
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
                {formatDateTime(log.started_at)}
              </p>
            </div>

            <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
              <p className={`text-xs ${theme.textMuted}`}>Fin</p>
              <p className="mt-1 font-medium">
                {formatDateTime(log.ended_at)}
              </p>
            </div>
          </div>
        </section>

        {/* RESUMEN */}
        <section className={`rounded-[28px] border p-6 ${theme.card}`}>
          <h2 className="text-2xl font-semibold">Resumen</h2>

          <div className={`mt-4 rounded-2xl border p-4 ${theme.subtle}`}>
            <p className="text-sm leading-7">
              {detail?.summary ||
                "No hay resumen disponible para esta llamada."}
            </p>
          </div>
        </section>

        {/* CONVERSACIÓN */}
        <section className={`rounded-[28px] border p-6 ${theme.card}`}>
          <h2 className="text-2xl font-semibold">Conversación</h2>

          {Array.isArray(detail?.messages) &&
          detail.messages.length > 0 ? (
            <div className="mt-5 space-y-4">
              {detail.messages.map((msg: any, index: number) => {
                const role = msg?.role || "assistant";
                const content =
                  typeof msg?.content === "string"
                    ? msg.content
                    : JSON.stringify(msg?.content || "");

                const isAssistant = role === "assistant";

                return (
                  <div
                    key={index}
                    className={`flex ${
                      isAssistant ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        isAssistant
                          ? `${theme.subtle} border`
                          : `${theme.buttonPrimary} text-white`
                      }`}
                    >
                      <p className="text-xs mb-1 opacity-70">
                        {isAssistant ? "Asistente IA" : "Cliente"}
                      </p>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`mt-4 rounded-2xl border p-4 ${theme.subtle}`}>
              <pre className="whitespace-pre-wrap text-sm leading-7">
                {detail?.transcript ||
                  "No hay conversación disponible."}
              </pre>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}