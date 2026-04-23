import Link from "next/link";
import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { getCurrentPlan } from "@/lib/billing/getCurrentPlan";
import { createClient } from "@/lib/supabase/server";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import { updateAiOverageSettingAction } from "../../actions/business-settings";

type SearchParams = Promise<{
  error?: string;
  success?: string;
  page?: string;
  q?: string;
}>;

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
};

const LOGS_PER_PAGE = 5;

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

function getDatePartsInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";

  return { year, month, day };
}

function getMonthRange(timezone: string, date = new Date()) {
  const { year, month } = getDatePartsInTimezone(date, timezone);

  const start = `${year}-${month}-01`;

  const nextMonthDate =
    Number(month) === 12
      ? new Date(Number(year) + 1, 0, 1)
      : new Date(Number(year), Number(month), 1);

  const nextParts = getDatePartsInTimezone(nextMonthDate, timezone);

  return {
    start,
    end: `${nextParts.year}-${nextParts.month}-${nextParts.day}`,
  };
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function buildAiAssistantUrl(params: { page?: number; q?: string }) {
  const search = new URLSearchParams();

  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }

  if (params.q?.trim()) {
    search.set("q", params.q.trim());
  }

  const queryString = search.toString();
  return queryString
    ? `/dashboard/ai-assistant?${queryString}`
    : "/dashboard/ai-assistant";
}

export default async function AiAssistantPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const ctx = await requireSectionAccess("ai_assistant");
  const plan = await getCurrentPlan();
  const supabase = await createClient();

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");

  const { data: settings } = await supabase
    .from("business_settings")
    .select("timezone, ai_allow_overage")
    .eq("business_id", business.id)
    .maybeSingle();

  const timezone = settings?.timezone || "America/Tegucigalpa";

  const hasAiAccess = Boolean(plan?.features?.ai_booking);
  const currentPage = Math.max(1, Number(params.page || "1") || 1);
  const searchQuery = String(params.q || "").trim();

  const { start, end } = getMonthRange(timezone);
  const from = (currentPage - 1) * LOGS_PER_PAGE;
  const to = from + LOGS_PER_PAGE - 1;

  const baseLogsQuery = supabase
    .from("ai_usage_logs")
    .select(
      `
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
        created_at
      `,
      { count: "exact" }
    )
    .eq("business_id", business.id)
    .gte("usage_date", start)
    .lt("usage_date", end);

  const filteredLogsQuery = searchQuery
    ? baseLogsQuery.ilike("call_id", `%${searchQuery}%`)
    : baseLogsQuery;

  const [
    { data: usageLogs, count: totalLogs },
    { data: allLogsForSummary },
    { data: vapiAssistant },
  ] = await Promise.all([
    filteredLogsQuery
      .order("created_at", { ascending: false })
      .range(from, to),

    supabase
      .from("ai_usage_logs")
      .select(
        `
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
          created_at
        `
      )
      .eq("business_id", business.id)
      .gte("usage_date", start)
      .lt("usage_date", end),

    supabase
      .from("business_vapi_assistants")
      .select("vapi_assistant_id, vapi_phone_number_id, active")
      .eq("business_id", business.id)
      .maybeSingle(),
  ]);

  const logs = (usageLogs || []) as AiUsageLogRow[];
  const allLogs = (allLogsForSummary || []) as AiUsageLogRow[];

  const includedMinutes = Number(plan?.limits?.ai_monthly_minutes || 0);
  const maxCallMinutes = Number(plan?.limits?.ai_max_call_minutes || 0);
  const overagePrice = Number(plan?.limits?.ai_overage_price || 0);
  const aiAllowOverage = Boolean(settings?.ai_allow_overage);

  const usedMinutes = Number(
    allLogs.reduce((acc, row) => acc + Number(row.minutes_used || 0), 0)
  );

  const overageMinutes = Number(
    allLogs.reduce((acc, row) => acc + Number(row.overage_minutes || 0), 0)
  );

  const remainingMinutes = Math.max(0, includedMinutes - usedMinutes);
  const estimatedOverageCost = Number((overageMinutes * overagePrice).toFixed(2));

  const totalPages = Math.max(1, Math.ceil(Number(totalLogs || 0) / LOGS_PER_PAGE));
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  if (!hasAiAccess) {
    return (
      <main className={`min-h-screen ${theme.pageBg}`}>
        <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
          <section className={`rounded-[28px] border p-6 md:p-8 ${theme.card}`}>
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={`text-sm ${theme.textMuted}`}>Módulo premium</p>
                <h1 className="mt-1 text-3xl font-bold">IA Asistente no disponible</h1>
                <p className={`mt-2 text-sm ${theme.textMuted}`}>
                  Tu plan actual no incluye el módulo de asistente IA, minutos mensuales ni logs de llamadas.
                </p>
              </div>

              <Link
                href="/dashboard/profile"
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${theme.buttonSecondary}`}
              >
                Ver perfil y plan
              </Link>
            </div>
          </section>

          {params.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {params.error}
            </div>
          )}

          <section className={`rounded-[28px] border p-6 ${theme.cardSoft}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Desbloquea IA Asistente</h2>
                <p className={`mt-2 text-sm ${theme.textMuted}`}>
                  Mejora tu plan para acceder a agendamiento por voz con IA, consumo mensual por minutos,
                  historial de llamadas y control de sobreconsumo.
                </p>
              </div>

              <div className="rounded-2xl border px-4 py-3 text-sm font-medium">
                Plan actual: <span className="font-semibold">{plan?.code || "basic"}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                <p className={`text-xs ${theme.textMuted}`}>Minutos IA / mes</p>
                <p className="mt-1 text-lg font-semibold">Solo Bronze y Premium</p>
              </div>

              <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                <p className={`text-xs ${theme.textMuted}`}>Máx. por llamada</p>
                <p className="mt-1 text-lg font-semibold">Según plan</p>
              </div>

              <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                <p className={`text-xs ${theme.textMuted}`}>Logs de llamadas</p>
                <p className="mt-1 text-lg font-semibold">Incluidos</p>
              </div>

              <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                <p className={`text-xs ${theme.textMuted}`}>Sobreconsumo</p>
                <p className="mt-1 text-lg font-semibold">Configurable</p>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/dashboard/upgrade?feature=ai_booking"
                className={`inline-flex rounded-2xl px-5 py-3 text-sm font-semibold transition ${theme.buttonPrimary}`}
              >
                Mejorar plan
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <section className={`rounded-[28px] border p-6 md:p-8 ${theme.card}`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={`text-sm ${theme.textMuted}`}>Módulo premium</p>
              <h1 className="mt-1 text-3xl font-bold">IA Asistente</h1>
              <p className={`mt-2 text-sm ${theme.textMuted}`}>
                Monitorea consumo mensual, logs de llamadas y configuración de sobreconsumo.
              </p>
            </div>

            <div className="rounded-2xl border px-4 py-3 text-sm font-medium">
              Plan actual: <span className="font-semibold">{plan?.code || "—"}</span>
            </div>
          </div>
        </section>

        {params.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error}
          </div>
        )}

        {params.success === "overage_updated" && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Configuración de sobreconsumo actualizada correctamente.
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className={`rounded-[24px] border p-5 ${theme.cardSoft}`}>
            <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
              Minutos incluidos
            </p>
            <p className="mt-2 text-2xl font-bold">{includedMinutes.toFixed(2)}</p>
          </div>

          <div className={`rounded-[24px] border p-5 ${theme.cardSoft}`}>
            <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
              Consumidos este mes
            </p>
            <p className="mt-2 text-2xl font-bold">{usedMinutes.toFixed(2)}</p>
          </div>

          <div className={`rounded-[24px] border p-5 ${theme.cardSoft}`}>
            <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
              Restantes
            </p>
            <p className="mt-2 text-2xl font-bold">{remainingMinutes.toFixed(2)}</p>
          </div>

          <div className={`rounded-[24px] border p-5 ${theme.cardSoft}`}>
            <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
              Extra consumido
            </p>
            <p className="mt-2 text-2xl font-bold">{overageMinutes.toFixed(2)}</p>
          </div>

          <div className={`rounded-[24px] border p-5 ${theme.cardSoft}`}>
            <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
              Costo extra estimado
            </p>
            <p className="mt-2 text-2xl font-bold">{formatMoney(estimatedOverageCost)}</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className={`rounded-[28px] border p-6 ${theme.card}`}>
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Logs de llamadas</h2>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Historial mensual de consumo de IA por llamada.
                </p>
              </div>

              <form
                action="/dashboard/ai-assistant"
                method="get"
                className="flex w-full max-w-md gap-2"
              >
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Buscar por call id"
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.input}`}
                />
                <button
                  type="submit"
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${theme.buttonPrimary}`}
                >
                  Buscar
                </button>
              </form>
            </div>

            {searchQuery && (
              <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${theme.subtle}`}>
                Buscando por: <span className="font-semibold">{searchQuery}</span>
              </div>
            )}

            {logs.length === 0 ? (
              <div className={`rounded-2xl border p-6 text-sm ${theme.subtle} ${theme.textMuted}`}>
                {searchQuery
                  ? "No se encontraron llamadas para ese call id en este mes."
                  : "Aún no hay llamadas registradas este mes."}
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`rounded-[22px] border p-4 ${theme.cardSoft}`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold">Call ID</h3>
                          <span className={`rounded-full border px-3 py-1 text-xs ${theme.subtle}`}>
                            {log.billing_status}
                          </span>
                        </div>

                        <p className={`mt-2 break-all text-xs ${theme.textMuted}`}>
                          {log.call_id}
                        </p>

                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                          <div>
                            <p className={`text-xs ${theme.textMuted}`}>Inicio</p>
                            <p className="mt-1 font-medium">
                              {formatDateTime(log.started_at, timezone)}
                            </p>
                          </div>

                          <div>
                            <p className={`text-xs ${theme.textMuted}`}>Fin</p>
                            <p className="mt-1 font-medium">
                              {formatDateTime(log.ended_at, timezone)}
                            </p>
                          </div>

                          <div>
                            <p className={`text-xs ${theme.textMuted}`}>Assistant ID</p>
                            <p className="mt-1 break-all font-medium">
                              {log.assistant_id || "—"}
                            </p>
                          </div>

                          <div>
                            <p className={`text-xs ${theme.textMuted}`}>Duración (seg)</p>
                            <p className="mt-1 font-medium">
                              {Number(log.duration_seconds || 0)}
                            </p>
                          </div>

                          <div>
                            <p className={`text-xs ${theme.textMuted}`}>Minutos usados</p>
                            <p className="mt-1 font-medium">
                              {Number(log.minutes_used || 0).toFixed(2)}
                            </p>
                          </div>

                          <div>
                            <p className={`text-xs ${theme.textMuted}`}>Minutos extra</p>
                            <p className="mt-1 font-medium">
                              {Number(log.overage_minutes || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:items-end">
                        <div className={`rounded-2xl border px-4 py-3 text-sm ${theme.subtle}`}>
                          <p className={`text-xs ${theme.textMuted}`}>Fuente</p>
                          <p className="mt-1 font-medium">{log.source}</p>
                        </div>

                        <Link
                          href={`/dashboard/ai-assistant/${encodeURIComponent(log.call_id)}`}
                          className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${theme.buttonSecondary}`}
                        >
                          Ver detalle
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className={`text-sm ${theme.textMuted}`}>
                    Página {currentPage} de {totalPages}
                  </p>

                  <div className="flex gap-2">
                    {hasPreviousPage ? (
                      <Link
                        href={buildAiAssistantUrl({
                          page: currentPage - 1,
                          q: searchQuery,
                        })}
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${theme.buttonSecondary}`}
                      >
                        Anterior
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold opacity-60 ${theme.buttonSecondary}`}
                      >
                        Anterior
                      </button>
                    )}

                    {hasNextPage ? (
                      <Link
                        href={buildAiAssistantUrl({
                          page: currentPage + 1,
                          q: searchQuery,
                        })}
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${theme.buttonPrimary}`}
                      >
                        Siguiente
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold opacity-60 ${theme.buttonSecondary}`}
                      >
                        Siguiente
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <section className={`rounded-[28px] border p-6 ${theme.card}`}>
              <div className="mb-5">
                <h2 className="text-2xl font-semibold">Configuración IA</h2>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Controla el sobreconsumo y consulta el estado de tu integración.
                </p>
              </div>

              <form action={updateAiOverageSettingAction} className="space-y-4">
                <input type="hidden" name="businessId" value={business.id} />

                <div>
                  <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
                    Permitir sobreconsumo
                  </label>

                  <select
                    name="ai_allow_overage"
                    defaultValue={aiAllowOverage ? "true" : "false"}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.select}`}
                  >
                    <option value="false" className={theme.option}>
                      No, bloquear IA al llegar al límite
                    </option>
                    <option value="true" className={theme.option}>
                      Sí, permitir minutos extra con cobro adicional
                    </option>
                  </select>

                  <p className={`mt-2 text-xs ${theme.textMuted}`}>
                    Precio actual por minuto extra: {formatMoney(overagePrice)}. Máximo por llamada:{" "}
                    {maxCallMinutes ? `${maxCallMinutes} min` : "—"}.
                  </p>
                </div>

                <button
                  type="submit"
                  className={`rounded-2xl px-6 py-3 text-sm font-semibold transition ${theme.buttonPrimary}`}
                >
                  Guardar configuración IA
                </button>
              </form>
            </section>

            <section className={`rounded-[28px] border p-6 ${theme.cardSoft}`}>
              <h3 className="text-xl font-semibold">Integración actual</h3>

              <div className="mt-4 space-y-3 text-sm">
                <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                  <p className={`text-xs ${theme.textMuted}`}>Assistant ID</p>
                  <p className="mt-1 break-all font-medium">
                    {vapiAssistant?.vapi_assistant_id || "No configurado"}
                  </p>
                </div>

                <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                  <p className={`text-xs ${theme.textMuted}`}>Phone Number ID</p>
                  <p className="mt-1 break-all font-medium">
                    {vapiAssistant?.vapi_phone_number_id || "—"}
                  </p>
                </div>

                <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                  <p className={`text-xs ${theme.textMuted}`}>Estado</p>
                  <p className="mt-1 font-medium">
                    {vapiAssistant?.active ? "Activo" : "Inactivo"}
                  </p>
                </div>

                <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                  <p className={`text-xs ${theme.textMuted}`}>Zona horaria</p>
                  <p className="mt-1 font-medium">{timezone}</p>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}