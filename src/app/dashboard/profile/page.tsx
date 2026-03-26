import Link from "next/link";
import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { createClient } from "@/lib/supabase/server";
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

function getThemeClasses(theme: string) {
  switch (theme) {
    case "dark":
      return {
        pageBg: "bg-[#181818] text-white",
        card: "bg-white/5 border-white/10 backdrop-blur-xl",
        cardSoft: "bg-white/10 border-white/15 backdrop-blur-xl",
        textMuted: "text-[#bdbdbd]",
        buttonPrimary: "bg-white text-black hover:bg-[#e8e8e8]",
        buttonSecondary:
          "bg-white/10 border-white/20 text-white hover:bg-white/15",
      };
    case "elegant":
      return {
        pageBg: "bg-[#f4efe8] text-[#2b211b]",
        card: "bg-white/60 border-white/50 backdrop-blur-xl",
        cardSoft: "bg-white/70 border-white/60 backdrop-blur-xl",
        textMuted: "text-[#7a6858]",
        buttonPrimary: "bg-[#6b4f3a] text-white hover:bg-[#5a4331]",
        buttonSecondary:
          "bg-white/70 border-[#d8c7b7] text-[#2b211b] hover:bg-[#f3e8dc]",
      };
    case "minimal":
      return {
        pageBg: "bg-[#f8f8f8] text-[#1f1f1f]",
        card: "bg-white/70 border-white/60 backdrop-blur-xl",
        cardSoft: "bg-white/85 border-white/70 backdrop-blur-xl",
        textMuted: "text-[#6f6f6f]",
        buttonPrimary: "bg-[#111111] text-white hover:bg-[#222222]",
        buttonSecondary:
          "bg-white border-[#d6d6d6] text-[#1f1f1f] hover:bg-[#f1f1f1]",
      };
    case "warm":
    default:
      return {
        pageBg: "bg-[#f6f1e8] text-[#2f241d]",
        card: "bg-white/55 border-white/50 backdrop-blur-xl",
        cardSoft: "bg-white/75 border-white/60 backdrop-blur-xl",
        textMuted: "text-[#6b5b4d]",
        buttonPrimary: "bg-[#a56a3a] text-white hover:bg-[#8d582e]",
        buttonSecondary:
          "bg-white/80 border-[#d9c6b2] text-[#2f241d] hover:bg-[#f3e8dc]",
      };
  }
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
  };

  return map[key] || key;
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireSectionAccess("dashboard");
  const supabase = await createClient();

  const { business, user, role } = ctx;
  const theme = getThemeClasses(business.theme || "warm");

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
                <div className="rounded-2xl border border-white/20 p-4">
                  <p className={`text-xs ${theme.textMuted}`}>Precio mensual</p>
                  <p className="mt-1 text-lg font-semibold">
                    ${Number(currentPlan?.price_monthly || 0).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/20 p-4">
                  <p className={`text-xs ${theme.textMuted}`}>Límite de staff</p>
                  <p className="mt-1 text-lg font-semibold">
                    {currentPlan?.limits?.max_staff ?? "-"}
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

            <div className="grid gap-5">
              {((plans || []) as PlanRow[]).map((plan) => {
                const features = Object.entries(plan.features || {}).filter(
                  ([, enabled]) => !!enabled
                );
                const isCurrent = plan.code === currentPlanCode;
                const styles = getPlanCardClasses(plan.code);

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
                        <p className={`text-xs ${theme.textMuted}`}>Mensual</p>
                        <p className="text-2xl font-bold">
                          ${Number(plan.price_monthly || 0).toFixed(2)}
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
                              className="rounded-full border border-white/20 px-3 py-1 text-xs"
                            >
                              {featureLabel(key)}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white/20 p-3">
                            <p className={`text-xs ${theme.textMuted}`}>Máx. staff</p>
                            <p className="mt-1 text-sm font-semibold">
                              {plan.limits?.max_staff ?? "-"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/20 p-3">
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
                          <form action={startPlanCheckoutAction}>
                            <input type="hidden" name="planCode" value={plan.code} />
                            <button
                              type="submit"
                              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${theme.buttonPrimary}`}
                            >
                              Cambiar a este plan
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