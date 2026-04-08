"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Bot,
  CalendarClock,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  Clock3,
  MessageSquare,
  PackageSearch,
  Send,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserRoundX,
} from "lucide-react";
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

function getAlertIcon(type: string) {
  switch (type) {
    case "low_stock":
      return <PackageSearch className="h-5 w-5" />;
    case "upcoming_appointments":
      return <CalendarClock className="h-5 w-5" />;
    case "no_sales_today":
      return <TrendingUp className="h-5 w-5" />;
    case "inactive_customer":
      return <UserRoundX className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
}

function getAlertTypeLabel(type: string) {
  switch (type) {
    case "low_stock":
      return "Inventario";
    case "upcoming_appointments":
      return "Citas";
    case "no_sales_today":
      return "Ventas";
    case "inactive_customer":
      return "Clientes";
    default:
      return "General";
  }
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
    <div className={`rounded-3xl border p-5 ${theme.cardSoft}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className={`mt-1 text-sm ${theme.textMuted}`}>{description}</p>
        </div>

        <Link
          href={`/dashboard/upgrade?feature=${feature}`}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${theme.buttonPrimary}`}
        >
          Mejorar plan
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function AlertFeedCard({
  alert,
  showReadBadge = false,
  theme,
}: {
  alert: AlertRow;
  showReadBadge?: boolean;
  theme: Theme;
}) {
  return (
    <div className={`rounded-3xl border p-4 md:p-5 ${theme.cardSoft}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`rounded-2xl border p-2 ${getSeverityClasses(alert.severity)}`}>
              {getAlertIcon(alert.type)}
            </div>

            <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${theme.subtle}`}>
              {getAlertTypeLabel(alert.type)}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-medium ${getSeverityClasses(
                alert.severity
              )}`}
            >
              {alert.severity.toUpperCase()}
            </span>

            {showReadBadge && (
              <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${theme.subtle}`}>
                Leída
              </span>
            )}
          </div>

          <h3 className="mt-4 text-lg font-semibold">{alert.title}</h3>
          <p className={`mt-2 text-sm leading-6 ${theme.textMuted}`}>{alert.message}</p>

          <div className={`mt-4 flex items-center gap-2 text-xs ${theme.textMuted}`}>
            <Clock3 className="h-4 w-4" />
            <span>{formatDate(alert.created_at)}</span>
          </div>
        </div>

        {!alert.is_read && (
          <form action={markAlertAsReadAction}>
            <input type="hidden" name="alertId" value={alert.id} />
            <button
              type="submit"
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm transition ${theme.buttonSecondary}`}
            >
              <CheckCheck className="h-4 w-4" />
              Marcar leída
            </button>
          </form>
        )}
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

  const criticalCount = sortedAlerts.filter((alert) => alert.severity === "critical").length;
  const warningCount = sortedAlerts.filter((alert) => alert.severity === "warning").length;
  const infoCount = sortedAlerts.filter((alert) => alert.severity === "info").length;

  return (
    <section className={`rounded-[30px] border p-6 ${theme.card}`}>
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className={`mt-1 text-sm ${theme.textMuted}`}>{description}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-4">
          <div className={`rounded-2xl border px-4 py-3 ${theme.cardSoft}`}>
            <p className={`text-[11px] uppercase tracking-wide ${theme.textMuted}`}>Total</p>
            <p className="mt-1 text-lg font-bold">{sortedAlerts.length}</p>
          </div>

          <div className={`rounded-2xl border px-4 py-3 ${theme.cardSoft}`}>
            <p className={`text-[11px] uppercase tracking-wide ${theme.textMuted}`}>Activas</p>
            <p className="mt-1 text-lg font-bold">{unreadAlerts.length}</p>
          </div>

          <div className={`rounded-2xl border px-4 py-3 ${theme.cardSoft}`}>
            <p className={`text-[11px] uppercase tracking-wide ${theme.textMuted}`}>Críticas</p>
            <p className="mt-1 text-lg font-bold">{criticalCount}</p>
          </div>

          <div className={`rounded-2xl border px-4 py-3 ${theme.cardSoft}`}>
            <p className={`text-[11px] uppercase tracking-wide ${theme.textMuted}`}>Warnings</p>
            <p className="mt-1 text-lg font-bold">{warningCount}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${theme.subtle}`}>
          Info: {infoCount}
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${theme.subtle}`}>
          Historial: {readAlerts.length}
        </span>
      </div>

      {sortedAlerts.length === 0 ? (
        <div className={`rounded-3xl border p-5 ${theme.cardSoft}`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-2xl border p-2 ${theme.subtle}`}>
              <Bell className="h-5 w-5" />
            </div>
            <p className={theme.textMuted}>{emptyMessage}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {unreadAlerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Alertas activas</p>
                <span className={`text-xs ${theme.textMuted}`}>
                  {unreadAlerts.length} pendiente(s)
                </span>
              </div>

              {unreadAlerts.map((alert) => (
                <AlertFeedCard key={alert.id} alert={alert} theme={theme} />
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
                <AlertFeedCard
                  key={alert.id}
                  alert={alert}
                  showReadBadge
                  theme={theme}
                />
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

function ChatMessage({
  side,
  title,
  text,
  meta,
  theme,
}: {
  side: "user" | "assistant";
  title?: string;
  text: string;
  meta?: string;
  theme: Theme;
}) {
  const isUser = side === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-[24px] border px-4 py-3 md:max-w-[78%] ${
          isUser ? `${theme.buttonPrimary}` : `${theme.cardSoft}`
        }`}
      >
        {title && !isUser && <p className="text-sm font-semibold">{title}</p>}
        <p className={`text-sm leading-6 ${title && !isUser ? "mt-1" : ""}`}>{text}</p>
        {meta && (
          <p className={`mt-2 text-[11px] ${isUser ? "opacity-80" : theme.textMuted}`}>
            {meta}
          </p>
        )}
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
      <section className={`rounded-[30px] border p-6 ${theme.card}`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className={`text-sm ${theme.textMuted}`}>Centro inteligente</p>
            <h2 className="mt-1 text-2xl font-semibold">Estado del módulo</h2>
            <p className={`mt-2 text-sm ${theme.textMuted}`}>
              Alertas, asistente y resumen del negocio en un solo lugar.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className={`rounded-2xl border p-4 ${theme.cardSoft}`}>
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
                  Alertas visibles
                </p>
              </div>
              <p className="mt-2 text-2xl font-bold">{totalVisibleAlerts}</p>
            </div>

            <div className={`rounded-2xl border p-4 ${theme.cardSoft}`}>
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
                  Asistente IA
                </p>
              </div>
              <p className="mt-2 text-sm font-semibold">
                {canUseAssistant ? "Disponible" : "Bloqueado"}
              </p>
            </div>

            <div className={`rounded-2xl border p-4 ${theme.cardSoft}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
                  Resumen IA
                </p>
              </div>
              <p className="mt-2 text-sm font-semibold">
                {canUseSummary ? "Disponible" : "Bloqueado"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {!canViewBasicAlerts ? (
        <section className={`rounded-[30px] border p-6 ${theme.card}`}>
          <div className="mb-4 flex items-center gap-3">
            <div className={`rounded-2xl border p-2 ${theme.cardSoft}`}>
              <CircleAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Alertas básicas</h2>
              <p className={`mt-1 text-sm ${theme.textMuted}`}>
                Stock bajo y próximas citas.
              </p>
            </div>
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
        <section className={`rounded-[30px] border p-6 ${theme.card}`}>
          <div className="mb-4 flex items-center gap-3">
            <div className={`rounded-2xl border p-2 ${theme.cardSoft}`}>
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Alertas avanzadas</h2>
              <p className={`mt-1 text-sm ${theme.textMuted}`}>
                Sin ventas hoy y clientes inactivos.
              </p>
            </div>
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

      <section className={`rounded-[30px] border p-6 ${theme.card}`}>
        <div className="mb-5 flex items-center gap-3">
          <div className={`rounded-2xl border p-2 ${theme.cardSoft}`}>
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Asistente del negocio</h2>
            <p className={`mt-1 text-sm ${theme.textMuted}`}>
              Haz preguntas sobre ventas, stock, clientes, staff y citas.
            </p>
          </div>
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
            <div className={`rounded-[28px] border p-4 md:p-5 ${theme.cardSoft}`}>
              <div className="space-y-4">
                {!assistantQuestion ? (
                  <ChatMessage
                    side="assistant"
                    title="Asistente del negocio"
                    text="Hola. Puedo ayudarte a entender ventas, productos, clientes, staff y citas del negocio. Elige una sugerencia rápida o escribe tu pregunta abajo."
                    meta="Listo para responder"
                    theme={theme}
                  />
                ) : (
                  <>
                    <ChatMessage
                      side="user"
                      text={assistantQuestion}
                      meta="Consulta enviada"
                      theme={theme}
                    />

                    <ChatMessage
                      side="assistant"
                      title={assistantResult?.title || "Respuesta del asistente"}
                      text={
                        assistantResult?.answer ||
                        "No fue posible generar una respuesta en este momento."
                      }
                      meta="Basado en los datos actuales del negocio"
                      theme={theme}
                    />
                  </>
                )}
              </div>
            </div>

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

            {assistantResult?.suggestions?.length ? (
              <div className={`rounded-2xl border p-4 ${theme.cardSoft}`}>
                <p className={`mb-3 text-xs uppercase tracking-wide ${theme.textMuted}`}>
                  Sugerencias para seguir
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
            ) : null}

            <form method="get" className={`rounded-[24px] border p-3 ${theme.cardSoft}`}>
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  type="text"
                  name="question"
                  defaultValue=""
                  placeholder="Escribe tu pregunta aquí..."
                  className={`w-full rounded-2xl border px-4 py-3 outline-none ${theme.input}`}
                />

                <button
                  type="submit"
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-medium transition ${theme.buttonPrimary}`}
                >
                  <Send className="h-4 w-4" />
                  Enviar
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      <section className={`rounded-[30px] border p-6 ${theme.card}`}>
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
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${theme.buttonPrimary}`}
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