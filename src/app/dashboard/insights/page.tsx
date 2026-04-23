import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { createClient } from "@/lib/supabase/server";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import { generateAlerts } from "@/lib/insights/generateAlerts";
import {
  getBusinessAssistantAnswer,
  type AssistantAnswer,
} from "@/lib/insights/getAssistantAnswer";
import {
  getBusinessSummary,
  type BusinessSummary,
} from "@/lib/insights/getBusinessSummary";
import InsightsClient from "./InsightsClient";

type PlanFeatures = {
  alerts_basic?: boolean;
  alerts_advanced?: boolean;
  ai_assistant?: boolean;
  ai_summary?: boolean;
};

type AlertRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  is_read: boolean;
  created_at: string;
};

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; question?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireSectionAccess("dashboard");
  const supabase = await createClient();

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");

  const { data: subscriptionRow } = await supabase
    .from("business_subscriptions")
    .select(`
      id,
      status,
      plan:subscription_plans(
        id,
        code,
        name,
        features
      )
    `)
    .eq("business_id", business.id)
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle();

  const currentPlan = subscriptionRow?.plan
    ? Array.isArray(subscriptionRow.plan)
      ? subscriptionRow.plan[0]
      : subscriptionRow.plan
    : null;

  const features: PlanFeatures = (currentPlan?.features || {}) as PlanFeatures;

  const canViewBasicAlerts = !!features.alerts_basic;
  const canViewAdvancedAlerts = !!features.alerts_advanced;
  const canUseAssistant = !!features.ai_assistant;
  const canUseSummary = !!features.ai_summary;

  await generateAlerts(business.id, {
    alerts_basic: canViewBasicAlerts,
    alerts_advanced: canViewAdvancedAlerts,
  });

  const { data: alerts } = await supabase
    .from("business_alerts")
    .select("id, type, title, message, severity, is_read, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const basicAlertTypes = new Set(["low_stock", "upcoming_appointments"]);
  const advancedAlertTypes = new Set(["no_sales_today", "inactive_customer"]);

  const basicAlerts = ((alerts || []) as AlertRow[]).filter((alert) =>
    basicAlertTypes.has(alert.type)
  );

  const advancedAlerts = ((alerts || []) as AlertRow[]).filter((alert) =>
    advancedAlertTypes.has(alert.type)
  );

  let assistantResult: AssistantAnswer | null = null;
  const assistantQuestion = String(params.question || "").trim();

  if (canUseAssistant && assistantQuestion) {
    assistantResult = await getBusinessAssistantAnswer(
      business.id,
      assistantQuestion
    );
  }

  let summaryResult: BusinessSummary | null = null;

  if (canUseSummary) {
    summaryResult = await getBusinessSummary(business.id);
  }

  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <section className={`rounded-[28px] border p-6 md:p-8 ${theme.card}`}>
          <div>
            <p className={`text-sm ${theme.textMuted}`}>Insights</p>
            <h1 className="mt-1 text-3xl font-bold">Centro inteligente</h1>
            <p className={`mt-2 text-sm ${theme.textMuted}`}>
              Alertas, funciones inteligentes y próximos módulos del negocio.
            </p>
          </div>
        </section>

        {params.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error}
          </p>
        )}

        <InsightsClient
          basicAlerts={basicAlerts}
          advancedAlerts={advancedAlerts}
          canViewBasicAlerts={canViewBasicAlerts}
          canViewAdvancedAlerts={canViewAdvancedAlerts}
          canUseAssistant={canUseAssistant}
          canUseSummary={canUseSummary}
          assistantQuestion={assistantQuestion}
          assistantResult={assistantResult}
          summaryResult={summaryResult}
          theme={theme}
        />
      </div>
    </main>
  );
}