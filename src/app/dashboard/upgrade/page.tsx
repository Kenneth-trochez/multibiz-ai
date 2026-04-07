import Link from "next/link";
import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { createClient } from "@/lib/supabase/server";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";

type PlanRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_monthly: number;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  active: boolean;
};

function featureLabel(key: string) {
  const map: Record<string, string> = {
    dashboard: "Dashboard",
    customers: "Clientes",
    appointments: "Citas",
    services: "Servicios",
    staff: "Staff",
    products: "Productos",
    sales: "Ventas",
    balance: "Balance",
    exports: "Exportaciones",
    ai_booking: "IA para agendamiento",
    alerts_basic: "Alertas básicas",
    alerts_advanced: "Alertas avanzadas",
    ai_assistant: "Asistente interno con IA",
    ai_summary: "Resumen inteligente con IA",
  };

  return map[key] || key;
}

function getPlanCardClasses(code: string) {
  switch (code) {
    case "premium":
      return {
        ring: "border-amber-400/50",
        badge: "bg-amber-500/15 text-amber-700 border border-amber-400/40",
      };
    case "bronze":
      return {
        ring: "border-orange-400/40",
        badge: "bg-orange-500/15 text-orange-700 border border-orange-400/40",
      };
    case "basic":
    default:
      return {
        ring: "border-slate-400/30",
        badge: "bg-slate-500/10 text-slate-700 border border-slate-400/30",
      };
  }
}

function getCyclePrice(priceMonthly: number, cycle: "monthly" | "quarterly" | "yearly") {
  switch (cycle) {
    case "quarterly":
      return Number(priceMonthly || 0) * 3;
    case "yearly":
      return Number(priceMonthly || 0) * 12;
    case "monthly":
    default:
      return Number(priceMonthly || 0);
  }
}

function cycleLabel(cycle: "monthly" | "quarterly" | "yearly") {
  switch (cycle) {
    case "quarterly":
      return "Trimestral";
    case "yearly":
      return "Anual";
    case "monthly":
    default:
      return "Mensual";
  }
}

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string; error?: string; cycle?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireSectionAccess("upgrade");
  const supabase = await createClient();

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");

  const selectedCycle =
    params.cycle === "quarterly" || params.cycle === "yearly"
      ? params.cycle
      : "monthly";

  const [{ data: subscriptionRow }, { data: plans }] = await Promise.all([
    supabase
      .from("business_subscriptions")
      .select(`
        id,
        status,
        billing_cycle,
        plan:subscription_plans(
          id,
          code,
          name,
          description,
          price_monthly,
          features,
          limits,
          active
        )
      `)
      .eq("business_id", business.id)
      .in("status", ["active", "trialing", "past_due"])
      .maybeSingle(),

    supabase
      .from("subscription_plans")
      .select("id, code, name, description, price_monthly, features, limits, active")
      .eq("active", true)
      .order("price_monthly", { ascending: true }),
  ]);

  const currentPlan = subscriptionRow?.plan
    ? Array.isArray(subscriptionRow.plan)
      ? subscriptionRow.plan[0]
      : subscriptionRow.plan
    : null;

  const currentPlanCode = currentPlan?.code || "basic";
  const feature = params.feature || "";

  return (
    <main className={`min-h-screen ${theme.pageBg}`}>
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <section className={`rounded-[28px] border p-6 md:p-8 ${theme.card}`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={`text-sm ${theme.textMuted}`}>Plan requerido</p>
              <h1 className="mt-1 text-3xl font-bold">Función no disponible</h1>
              <p className={`mt-2 text-sm ${theme.textMuted}`}>
                {feature
                  ? `La función "${featureLabel(feature)}" no está incluida en tu plan actual.`
                  : "Tu plan actual no incluye esta función."}
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

        <section className={`rounded-[28px] border p-6 ${theme.cardSoft}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
                Plan actual
              </p>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{currentPlan?.name || "Basic"}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    getPlanCardClasses(currentPlanCode).badge
                  }`}
                >
                  {currentPlanCode.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["monthly", "quarterly", "yearly"] as const).map((cycle) => {
                const active = selectedCycle === cycle;
                return (
                  <Link
                    key={cycle}
                    href={`/dashboard/upgrade?${new URLSearchParams({
                      ...(feature ? { feature } : {}),
                      cycle,
                    }).toString()}`}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      active ? theme.buttonPrimary : theme.buttonSecondary
                    }`}
                  >
                    {cycleLabel(cycle)}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-5">
          {((plans || []) as PlanRow[]).map((plan) => {
            const isCurrent = plan.code === currentPlanCode;
            const styles = getPlanCardClasses(plan.code);
            const enabledFeatures = Object.entries(plan.features || {}).filter(
              ([, value]) => !!value
            );
            const cyclePrice = getCyclePrice(plan.price_monthly, selectedCycle);

            return (
              <div
                key={plan.id}
                className={`rounded-[26px] border p-5 md:p-6 ${theme.cardSoft} ${styles.ring}`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${styles.badge}`}
                      >
                        {plan.code.toUpperCase()}
                      </span>
                    </div>

                    <p className={`mt-2 text-sm ${theme.textMuted}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className={`text-xs ${theme.textMuted}`}>
                      {cycleLabel(selectedCycle)}
                    </p>
                    <p className="text-2xl font-bold">
                      ${cyclePrice.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
                  <div>
                    <p className={`mb-2 text-xs uppercase tracking-wide ${theme.textMuted}`}>
                      Incluye
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {enabledFeatures.map(([key]) => (
                        <span
                          key={key}
                          className={`rounded-full border px-3 py-1 text-xs ${theme.subtle}`}
                        >
                          {featureLabel(key)}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className={`rounded-2xl border p-3 ${theme.subtle}`}>
                        <p className={`text-xs ${theme.textMuted}`}>Máx. staff</p>
                        <p className="mt-1 text-sm font-semibold">
                          {plan.limits?.max_staff ?? "-"}
                        </p>
                      </div>

                      <div className={`rounded-2xl border p-3 ${theme.subtle}`}>
                        <p className={`text-xs ${theme.textMuted}`}>IA mensual</p>
                        <p className="mt-1 text-sm font-semibold">
                          {plan.limits?.max_monthly_ai_calls ?? "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end">
                    {isCurrent ? (
                      <button
                        type="button"
                        disabled
                        className={`rounded-2xl px-5 py-3 text-sm font-semibold opacity-70 ${theme.buttonSecondary}`}
                      >
                        Plan actual
                      </button>
                    ) : (
                      <Link
                        href={`/dashboard/profile?cycle=${selectedCycle}`}
                        className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${theme.buttonPrimary}`}
                      >
                        Mejorar plan
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}