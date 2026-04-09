import Link from "next/link";
import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { createClient } from "@/lib/supabase/server";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import { startPlanCheckoutAction } from "../../actions/billing";

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

function getCyclePrice(
  priceMonthly: number,
  cycle: "monthly" | "quarterly" | "yearly"
) {
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

function cycleLabel(cycle: string | null | undefined) {
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

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; cycle?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireSectionAccess("dashboard");
  const supabase = await createClient();

  const { business, user, role } = ctx;
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
        current_period_end,
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
  const currentBillingCycle = subscriptionRow?.billing_cycle || "monthly";

  return (
    <main className={`min-h-screen ${theme.pageBg}`}>
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <section className={`rounded-[28px] border p-6 md:p-8 ${theme.card}`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className={`text-sm ${theme.textMuted}`}>Perfil</p>
              <h1 className="mt-1 text-3xl font-bold">Mi cuenta</h1>
              <p className={`mt-2 text-sm ${theme.textMuted}`}>
                Administra tu perfil, el negocio actual y el plan activo.
              </p>
            </div>

            <Link
              href="/dashboard"
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${theme.buttonSecondary}`}
            >
              Volver al dashboard
            </Link>
          </div>
        </section>

        {params.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error}
          </p>
        )}

        {params.success === "plan_updated" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Plan actualizado correctamente.
          </p>
        )}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className={`rounded-[28px] border p-6 ${theme.cardSoft}`}>
              <h2 className="text-xl font-semibold">Información de la cuenta</h2>

              <div className="mt-5 space-y-4">
                <div>
                  <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
                    Correo
                  </p>
                  <p className="mt-1 text-sm font-medium">{user.email}</p>
                </div>

                <div>
                  <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
                    Rol de acceso
                  </p>
                  <p className="mt-1 text-sm font-medium uppercase">{role}</p>
                </div>

                <div>
                  <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
                    Negocio
                  </p>
                  <p className="mt-1 text-sm font-medium">{business.name}</p>
                </div>

                <div>
                  <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
                    Tipo
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {business.business_type || "Negocio"}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`rounded-[28px] border p-6 ${theme.cardSoft} ${getPlanCardClasses(
                currentPlanCode
              ).ring}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
                    Plan actual
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">
                    {currentPlan?.name || "Basic"}
                  </h2>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    getPlanCardClasses(currentPlanCode).badge
                  }`}
                >
                  {currentPlanCode.toUpperCase()}
                </span>
              </div>

              <p className={`mt-3 text-sm ${theme.textMuted}`}>
                {currentPlan?.description || "Plan activo del negocio"}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                  <p className={`text-xs ${theme.textMuted}`}>Facturación actual</p>
                  <p className="mt-1 text-lg font-semibold">
                    {cycleLabel(currentBillingCycle)}
                  </p>
                </div>

                <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                  <p className={`text-xs ${theme.textMuted}`}>Precio del ciclo actual</p>
                  <p className="mt-1 text-lg font-semibold">
                    ${getCyclePrice(
                      Number(currentPlan?.price_monthly || 0),
                      currentBillingCycle as "monthly" | "quarterly" | "yearly"
                    ).toFixed(2)}
                  </p>
                </div>

                <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                  <p className={`text-xs ${theme.textMuted}`}>Precio mensual base</p>
                  <p className="mt-1 text-lg font-semibold">
                    ${Number(currentPlan?.price_monthly || 0).toFixed(2)}
                  </p>
                </div>

                <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                  <p className={`text-xs ${theme.textMuted}`}>Límite de staff</p>
                  <p className="mt-1 text-lg font-semibold">
                    {currentPlan?.limits?.max_staff ?? "-"}
                  </p>
                </div>

                <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                  <p className={`text-xs ${theme.textMuted}`}>Minutos IA / mes</p>
                  <p className="mt-1 text-lg font-semibold">
                    {currentPlan?.limits?.ai_monthly_minutes ?? "-"}
                  </p>
                </div>

                <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                  <p className={`text-xs ${theme.textMuted}`}>Máx. por llamada</p>
                  <p className="mt-1 text-lg font-semibold">
                    {currentPlan?.limits?.ai_max_call_minutes
                      ? `${currentPlan.limits.ai_max_call_minutes} min`
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-[28px] border p-6 md:p-8 ${theme.card}`}>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Planes disponibles</h2>
              <p className={`mt-2 text-sm ${theme.textMuted}`}>
                Compara funciones y mejora tu plan cuando quieras.
              </p>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {(["monthly", "quarterly", "yearly"] as const).map((cycle) => {
                const active = selectedCycle === cycle;
                return (
                  <Link
                    key={cycle}
                    href={`/dashboard/profile?cycle=${cycle}`}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      active ? theme.buttonPrimary : theme.buttonSecondary
                    }`}
                  >
                    {cycleLabel(cycle)}
                  </Link>
                );
              })}
            </div>

            <div className="grid gap-5">
              {((plans || []) as PlanRow[]).map((plan) => {
                const features = Object.entries(plan.features || {}).filter(
                  ([, enabled]) => !!enabled
                );

                const isSamePlan = plan.code === currentPlanCode;
                const isCurrent = isSamePlan && currentBillingCycle === selectedCycle;
                const isSamePlanDifferentCycle =
                  isSamePlan && currentBillingCycle !== selectedCycle;

                const styles = getPlanCardClasses(plan.code);
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
                          {features.map(([key]) => (
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
                            <p className={`text-xs ${theme.textMuted}`}>Minutos IA / mes</p>
                            <p className="mt-1 text-sm font-semibold">
                              {plan.limits?.ai_monthly_minutes ?? "-"}
                            </p>
                          </div>

                          <div className={`rounded-2xl border p-3 ${theme.subtle}`}>
                            <p className={`text-xs ${theme.textMuted}`}>Máx. por llamada</p>
                            <p className="mt-1 text-sm font-semibold">
                              {plan.limits?.ai_max_call_minutes
                                ? `${plan.limits.ai_max_call_minutes} min`
                                : "-"}
                            </p>
                          </div>

                          <div className={`rounded-2xl border p-3 ${theme.subtle}`}>
                            <p className={`text-xs ${theme.textMuted}`}>Minuto extra</p>
                            <p className="mt-1 text-sm font-semibold">
                              {typeof plan.limits?.ai_overage_price === "number"
                                ? `$${Number(plan.limits.ai_overage_price).toFixed(2)}`
                                : "-"}
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
                          <form action={startPlanCheckoutAction}>
                            <input type="hidden" name="planCode" value={plan.code} />
                            <input
                              type="hidden"
                              name="billingCycle"
                              value={selectedCycle}
                            />
                            <button
                              type="submit"
                              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${theme.buttonPrimary}`}
                            >
                              {isSamePlanDifferentCycle
                                ? "Cambiar ciclo"
                                : "Cambiar a este plan"}
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}