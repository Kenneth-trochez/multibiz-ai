"use client";

import Link from "next/link";
import { markAlertAsReadAction } from "../../actions/insights";
import type { AssistantAnswer } from "@/lib/insights/getAssistantAnswer";
import type { BusinessSummary } from "@/lib/insights/getBusinessSummary";

type AlertRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  is_read: boolean;
  created_at: string;
};

type Theme = {
  card: string;
  cardSoft: string;
  subtle: string;
  textMuted: string;
  buttonPrimary: string;
  buttonSecondary: string;
  danger: string;
  input: string;
};

function getSeverityClasses(severity: AlertRow["severity"]) {
  switch (severity) {
    case "critical":
      return "border-red-300 bg-red-50 text-red-700";
    case "warning":
      return "border-amber-300 bg-amber-50 text-amber-700";
    case "info":
    default:
      return "border-sky-300 bg-sky-50 text-sky-700";
  }
}

function getSeverityOrder(severity: AlertRow["severity"]) {
  switch (severity) {
    case "critical":
      return 0;
    case "warning":
      return 1;
    case "info":
    default:
      return 2;
  }
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("es-HN", {
    timeZone: "America/Tegucigalpa",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateStr));
}

function sortAlerts(alerts: AlertRow[]) {
  return [...alerts].sort((a, b) => {
    const severityDiff = getSeverityOrder(a.severity) - getSeverityOrder(b.severity);
    if (severityDiff !== 0) return severityDiff;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function LockedFeatureCard({
  title,
  description,
  feature,
  theme,
}: {
  title: string;
  description: string;
  feature: string;
  theme: Theme;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${theme.cardSoft}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className={`mt-1 text-sm ${theme.textMuted}`}>{description}</p>
        </div>

        <Link
          href={`/dashboard/upgrade?feature=${feature}`}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${theme.buttonPrimary}`}
        >
          Mejorar plan
        </Link>
      </div>
    </div>
  );
}

function AlertsSection({
  title,
  description,
  alerts,
  emptyMessage,
  theme,
}: {
  title: string;
  description: string;
  alerts: AlertRow[];
  emptyMessage: string;
  theme: Theme;
}) {
  const sortedAlerts = sortAlerts(alerts);
  const unreadAlerts = sortedAlerts.filter((alert) => !alert.is_read);
  const readAlerts = sortedAlerts.filter((alert) => alert.is_read);

  return (
    <section className={`rounded-[28px] border p-6 ${theme.card}`}>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className={`mt-1 text-sm ${theme.textMuted}`}>{description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className={`rounded-full border px-3 py-1 text-xs font-medium ${theme.subtle}`}>
            Total: {sortedAlerts.length}
          </div>
          <div className={`rounded-full border px-3 py-1 text-xs font-medium ${theme.subtle}`}>
            Activas: {unreadAlerts.length}
          </div>
          <div className={`rounded-full border px-3 py-1 text-xs font-medium ${theme.subtle}`}>
            Leídas: {readAlerts.length}
          </div>
        </div>
      </div>

      {sortedAlerts.length === 0 ? (
        <div className={`rounded-2xl border p-5 ${theme.cardSoft}`}>
          <p className={theme.textMuted}>{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {unreadAlerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Alertas activas</p>
                <span className={`text-xs ${theme.textMuted}`}>
                  {unreadAlerts.length} pendiente(s)
                </span>
              </div>

              {unreadAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-2xl border p-4 ${theme.cardSoft}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{alert.title}</p>
                        <span
                          className={`rounded-full border px-2 py-1 text-[11px] font-medium ${getSeverityClasses(
                            alert.severity
                          )}`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>

                      <p className={`mt-2 text-sm ${theme.textMuted}`}>
                        {alert.message}
                      </p>

                      <p className={`mt-2 text-xs ${theme.textMuted}`}>
                        {formatDate(alert.created_at)}
                      </p>
                    </div>

                    <form action={markAlertAsReadAction}>
                      <input type="hidden" name="alertId" value={alert.id} />
                      <button
                        type="submit"
                        className={`rounded-xl px-3 py-2 text-sm transition ${theme.buttonSecondary}`}
                      >
                        Marcar leída
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}

          {readAlerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-sm font-semibold">Historial reciente</p>
                <span className={`text-xs ${theme.textMuted}`}>
                  {readAlerts.length} leída(s)
                </span>
              </div>

              {readAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-2xl border p-4 opacity-80 ${theme.cardSoft}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{alert.title}</p>
                    <span
                      className={`rounded-full border px-2 py-1 text-[11px] font-medium ${getSeverityClasses(
                        alert.severity
                      )}`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className={`text-[11px] ${theme.textMuted}`}>
                      Leída
                    </span>
                  </div>

                  <p className={`mt-2 text-sm ${theme.textMuted}`}>
                    {alert.message}
                  </p>

                  <p className={`mt-2 text-xs ${theme.textMuted}`}>
                    {formatDate(alert.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SummaryMetricCard({
  label,
  value,
  helper,
  progress,
  theme,
}: {
  label: string;
  value: string;
  helper: string;
  progress: number;
  theme: Theme;
}) {
  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`rounded-2xl border p-5 ${theme.cardSoft}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>

        <div className={`rounded-full border px-3 py-1 text-xs font-medium ${theme.subtle}`}>
          {safeProgress.toFixed(0)}%
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full border bg-black/5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${safeProgress}%`, background: "currentColor", opacity: 0.75 }}
          />
        </div>
      </div>

      <p className={`mt-3 text-xs ${theme.textMuted}`}>{helper}</p>
    </div>
  );
}

function SummaryListCard({
  title,
  items,
  theme,
}: {
  title: string;
  items: string[];
  theme: Theme;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${theme.cardSoft}`}>
      <p className="text-base font-semibold">{title}</p>
      <div className={`mt-4 space-y-3 text-sm ${theme.textMuted}`}>
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-current opacity-70" />
            <p>{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InsightsClient({
  basicAlerts,
  advancedAlerts,
  canViewBasicAlerts,
  canViewAdvancedAlerts,
  canUseAssistant,
  canUseSummary,
  assistantQuestion,
  assistantResult,
  summaryResult,
  theme,
}: {
  basicAlerts: AlertRow[];
  advancedAlerts: AlertRow[];
  canViewBasicAlerts: boolean;
  canViewAdvancedAlerts: boolean;
  canUseAssistant: boolean;
  canUseSummary: boolean;
  assistantQuestion: string;
  assistantResult: AssistantAnswer | null;
  summaryResult: BusinessSummary | null;
  theme: Theme;
}) {
  const totalVisibleAlerts =
    (canViewBasicAlerts ? basicAlerts.length : 0) +
    (canViewAdvancedAlerts ? advancedAlerts.length : 0);

  const quickQuestions = [
    "¿Cuánto vendí esta semana?",
    "¿Cuál es mi producto más vendido?",
    "¿Qué clientes están inactivos?",
    "¿Qué staff genera más ingresos?",
    "¿Qué productos tienen stock bajo?",
    "¿Cuántas citas tengo mañana?",
  ];

  return (
    <div className="space-y-6">
      <section className={`rounded-2xl border p-6 ${theme.card}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Resumen del módulo</h2>
            <p className={`mt-1 text-sm ${theme.textMuted}`}>
              Estado actual de alertas y funciones inteligentes del negocio.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className={`rounded-2xl border p-4 ${theme.cardSoft}`}>
              <p className={`text-xs ${theme.textMuted}`}>Alertas visibles</p>
              <p className="mt-1 text-xl font-bold">{totalVisibleAlerts}</p>
            </div>

            <div className={`rounded-2xl border p-4 ${theme.cardSoft}`}>
              <p className={`text-xs ${theme.textMuted}`}>Asistente IA</p>
              <p className="mt-1 text-sm font-semibold">
                {canUseAssistant ? "Disponible" : "Bloqueado"}
              </p>
            </div>

            <div className={`rounded-2xl border p-4 ${theme.cardSoft}`}>
              <p className={`text-xs ${theme.textMuted}`}>Resumen IA</p>
              <p className="mt-1 text-sm font-semibold">
                {canUseSummary ? "Disponible" : "Bloqueado"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {!canViewBasicAlerts ? (
        <section className={`rounded-[28px] border p-6 ${theme.card}`}>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Alertas básicas</h2>
            <p className={`mt-1 text-sm ${theme.textMuted}`}>
              Stock bajo y próximas citas.
            </p>
          </div>

          <LockedFeatureCard
            title="Alertas básicas"
            description="Activa este bloque para ver avisos clave del negocio."
            feature="alerts_basic"
            theme={theme}
          />
        </section>
      ) : (
        <AlertsSection
          title="Alertas básicas"
          description="Stock bajo y próximas citas."
          alerts={basicAlerts}
          emptyMessage="No hay alertas básicas activas."
          theme={theme}
        />
      )}

      {!canViewAdvancedAlerts ? (
        <section className={`rounded-[28px] border p-6 ${theme.card}`}>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Alertas avanzadas</h2>
            <p className={`mt-1 text-sm ${theme.textMuted}`}>
              Sin ventas hoy y clientes inactivos.
            </p>
          </div>

          <LockedFeatureCard
            title="Alertas avanzadas"
            description="Desbloquea alertas más útiles para operación y seguimiento."
            feature="alerts_advanced"
            theme={theme}
          />
        </section>
      ) : (
        <AlertsSection
          title="Alertas avanzadas"
          description="Sin ventas hoy y clientes inactivos."
          alerts={advancedAlerts}
          emptyMessage="No hay alertas avanzadas activas."
          theme={theme}
        />
      )}

      <section className={`rounded-[28px] border p-6 ${theme.card}`}>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Asistente del negocio</h2>
          <p className={`mt-1 text-sm ${theme.textMuted}`}>
            Haz preguntas concretas sobre ventas, clientes, staff, stock y citas.
          </p>
        </div>

        {!canUseAssistant ? (
          <LockedFeatureCard
            title="Asistente interno con IA"
            description="Disponible en planes con funciones inteligentes."
            feature="ai_assistant"
            theme={theme}
          />
        ) : (
          <div className="space-y-4">
            <form method="get" className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                type="text"
                name="question"
                defaultValue={assistantQuestion}
                placeholder="Ejemplo: ¿Cuál es mi producto más vendido?"
                className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
              />

              <button
                type="submit"
                className={`rounded-xl px-4 py-2 font-medium transition ${theme.buttonPrimary}`}
              >
                Preguntar
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question) => (
                <Link
                  key={question}
                  href={`/dashboard/insights?question=${encodeURIComponent(question)}`}
                  className={`rounded-full border px-3 py-2 text-xs transition ${theme.buttonSecondary}`}
                >
                  {question}
                </Link>
              ))}
            </div>

            {assistantResult ? (
              <div className={`rounded-2xl border p-5 ${theme.cardSoft}`}>
                <p className="text-lg font-semibold">{assistantResult.title}</p>
                <p className={`mt-2 text-sm ${theme.textMuted}`}>
                  {assistantResult.answer}
                </p>

                {assistantResult.suggestions.length > 0 && (
                  <div className="mt-4">
                    <p className={`mb-2 text-xs uppercase tracking-wide ${theme.textMuted}`}>
                      Sugerencias
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {assistantResult.suggestions.map((suggestion) => (
                        <Link
                          key={suggestion}
                          href={`/dashboard/insights?question=${encodeURIComponent(suggestion)}`}
                          className={`rounded-full border px-3 py-2 text-xs transition ${theme.buttonSecondary}`}
                        >
                          {suggestion}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={`rounded-2xl border p-5 ${theme.cardSoft}`}>
                <p className={theme.textMuted}>
                  Todavía no has hecho una consulta. Usa una de las preguntas rápidas o escribe la tuya.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <section className={`rounded-[28px] border p-6 ${theme.card}`}>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className={`text-sm ${theme.textMuted}`}>Resumen inteligente</p>
            <h2 className="mt-1 text-2xl font-semibold">Estado del negocio</h2>
            <p className={`mt-2 text-sm ${theme.textMuted}`}>
              Una vista más ejecutiva del rendimiento, riesgos y oportunidades.
            </p>
          </div>

          {!canUseSummary && (
            <Link
              href="/dashboard/upgrade?feature=ai_summary"
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${theme.buttonPrimary}`}
            >
              Mejorar plan
            </Link>
          )}
        </div>

        {!canUseSummary ? (
          <LockedFeatureCard
            title="Resumen inteligente con IA"
            description="Recibe resúmenes automáticos y recomendaciones del negocio."
            feature="ai_summary"
            theme={theme}
          />
        ) : summaryResult ? (
          <div className="space-y-5">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className={`rounded-[26px] border p-6 ${theme.cardSoft}`}>
                <div className="max-w-3xl">
                  <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
                    Panorama general
                  </p>
                  <h3 className="mt-2 text-2xl font-bold">{summaryResult.title}</h3>
                  <p className={`mt-4 text-sm leading-7 ${theme.textMuted}`}>
                    {summaryResult.overview}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                {summaryResult.metrics.map((metric) => (
                  <SummaryMetricCard
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    helper={metric.helper}
                    progress={metric.progress}
                    theme={theme}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <SummaryListCard
                title="Lo mejor del negocio"
                items={summaryResult.highlights}
                theme={theme}
              />
              <SummaryListCard
                title="Riesgos detectados"
                items={summaryResult.risks}
                theme={theme}
              />
              <SummaryListCard
                title="Oportunidades"
                items={summaryResult.opportunities}
                theme={theme}
              />
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl border p-5 ${theme.cardSoft}`}>
            <p className={theme.textMuted}>
              No fue posible generar el resumen inteligente en este momento.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}