import Link from "next/link";
import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { getCurrentPlan } from "@/lib/billing/getCurrentPlan";
import { createClient } from "@/lib/supabase/server";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import { updateAiOverageSettingAction } from "../../actions/business-settings";

type SearchParams = Promise<{
  error?: string;
  success?: string;
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

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-HN");
}

function getMonthRange(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
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

  const hasAiAccess = Boolean(plan?.features?.ai_booking);

  const { start, end } = getMonthRange();

  const [{ data: usageLogs }, { data: businessSettings }, { data: vapiAssistant }] =
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
          created_at
        `)
        .eq("business_id", business.id)
        .gte("usage_date", start)
        .lt("usage_date", end)
        .order("created_at", { ascending: false }),

      supabase
        .from("business_settings")
        .select("ai_allow_overage")
        .eq("business_id", business.id)
        .maybeSingle(),

      supabase
        .from("business_vapi_assistants")
        .select("vapi_assistant_id, vapi_phone_number_id, active")
        .eq("business_id", business.id)
        .maybeSingle(),
    ]);

  const logs = (usageLogs || []) as AiUsageLogRow[];

  const includedMinutes = Number(plan?.limits?.ai_monthly_minutes || 0);
  const maxCallMinutes = Number(plan?.limits?.ai_max_call_minutes || 0);
  const overagePrice = Number(plan?.limits?.ai_overage_price || 0);
  const aiAllowOverage = Boolean(businessSettings?.ai_allow_overage);

  const usedMinutes = Number(
    logs.reduce((acc, row) => acc + Number(row.minutes_used || 0), 0)
  );

  const overageMinutes = Number(
    logs.reduce((acc, row) => acc + Number(row.overage_minutes || 0), 0)
  );

  const remainingMinutes = Math.max(0, includedMinutes - usedMinutes);
  const estimatedOverageCost = Number((overageMinutes * overagePrice).toFixed(2));

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
    <main className={`min-h-screen ${theme.pageBg}`}>
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
            <div className="mb-5">
              <h2 className="text-2xl font-semibold">Logs de llamadas</h2>
              <p className={`mt-1 text-sm ${theme.textMuted}`}>
                Historial mensual de consumo de IA por llamada.
              </p>
            </div>

            {logs.length === 0 ? (
              <div className={`rounded-2xl border p-6 text-sm ${theme.subtle} ${theme.textMuted}`}>
                Aún no hay llamadas registradas este mes.
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
                            <p className="mt-1 font-medium">{formatDateTime(log.started_at)}</p>
                          </div>

                          <div>
                            <p className={`text-xs ${theme.textMuted}`}>Fin</p>
                            <p className="mt-1 font-medium">{formatDateTime(log.ended_at)}</p>
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

                      <div className={`rounded-2xl border px-4 py-3 text-sm ${theme.subtle}`}>
                        <p className={`text-xs ${theme.textMuted}`}>Fuente</p>
                        <p className="mt-1 font-medium">{log.source}</p>
                      </div>
                    </div>
                  </div>
                ))}
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
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}