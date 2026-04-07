import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { createClient } from "@/lib/supabase/server";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import { updateCheckoutSessionCycleAction } from "../../../actions/billing";

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

function cycleDescription(cycle: string | null | undefined) {
  switch (cycle) {
    case "quarterly":
      return "Cobro cada 3 meses";
    case "yearly":
      return "Cobro cada 12 meses";
    case "monthly":
    default:
      return "Cobro cada mes";
  }
}

export default async function CheckoutSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const resolvedParams = await params;

  const ctx = await requireSectionAccess("profile");
  const supabase = await createClient();

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");

  const { data: session, error } = await supabase
    .from("subscription_checkout_sessions")
    .select(`
      id,
      status,
      amount,
      currency,
      provider,
      created_at,
      billing_cycle,
      plan:subscription_plans(
        id,
        code,
        name,
        description,
        price_monthly
      )
    `)
    .eq("id", resolvedParams.sessionId)
    .eq("business_id", business.id)
    .maybeSingle();

  if (error || !session) {
    redirect("/dashboard/profile?error=No+se+encontró+la+sesión+de+checkout");
  }

  const targetPlan = session.plan
    ? Array.isArray(session.plan)
      ? session.plan[0]
      : session.plan
    : null;

  const selectedCycle =
    session.billing_cycle === "quarterly" || session.billing_cycle === "yearly"
      ? session.billing_cycle
      : "monthly";

  const cycleOptions = [
    {
      value: "monthly",
      label: "Mensual",
      description: "Cobro cada mes",
    },
    {
      value: "quarterly",
      label: "Trimestral",
      description: "Cobro cada 3 meses",
    },
    {
      value: "yearly",
      label: "Anual",
      description: "Cobro cada 12 meses",
    },
  ] as const;

  return (
    <main className={`min-h-screen ${theme.pageBg}`}>
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
        <section className={`rounded-[28px] border p-6 md:p-8 ${theme.card}`}>
          <p className={`text-sm ${theme.textMuted}`}>Checkout preparado</p>
          <h1 className="mt-1 text-3xl font-bold">Finalizar mejora de plan</h1>
          <p className={`mt-2 text-sm ${theme.textMuted}`}>
            Elige el ciclo de facturación antes de proceder con el pago.
            Esta pantalla ya está lista para conectar Stripe o PayPal después.
          </p>
        </section>

        <section className={`rounded-[28px] border p-6 md:p-8 ${theme.card}`}>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
                Plan seleccionado
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {targetPlan?.name || "Plan"}
              </p>
              <p className={`mt-2 text-sm ${theme.textMuted}`}>
                {targetPlan?.description || "Cambio de plan pendiente"}
              </p>

              <div className="mt-6">
                <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
                  Elegir ciclo
                </p>

                <div className="mt-3 grid gap-3">
                  {cycleOptions.map((option) => {
                    const isActive = selectedCycle === option.value;

                    return (
                      <form key={option.value} action={updateCheckoutSessionCycleAction}>
                        <input type="hidden" name="sessionId" value={session.id} />
                        <input
                          type="hidden"
                          name="billingCycle"
                          value={option.value}
                        />

                        <button
                          type="submit"
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            isActive
                              ? `${theme.buttonPrimary}`
                              : `${theme.cardSoft}`
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold">{option.label}</p>
                              <p
                                className={`mt-1 text-xs ${
                                  isActive ? "opacity-90" : theme.textMuted
                                }`}
                              >
                                {option.description}
                              </p>
                            </div>

                            {isActive && (
                              <span className="rounded-full border px-3 py-1 text-xs font-medium">
                                Seleccionado
                              </span>
                            )}
                          </div>
                        </button>
                      </form>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={`rounded-[24px] border p-5 ${theme.cardSoft}`}>
              <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
                Resumen
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <p className={`text-xs ${theme.textMuted}`}>Monto del ciclo</p>
                  <p className="mt-1 text-2xl font-bold">
                    {session.currency} {Number(session.amount || 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className={`text-xs ${theme.textMuted}`}>Facturación</p>
                  <p className="mt-1 text-sm font-semibold">
                    {cycleLabel(selectedCycle)}
                  </p>
                  <p className={`mt-1 text-xs ${theme.textMuted}`}>
                    {cycleDescription(selectedCycle)}
                  </p>
                </div>

                <div>
                  <p className={`text-xs ${theme.textMuted}`}>Estado</p>
                  <p className="mt-1 text-sm font-semibold">{session.status}</p>
                </div>

                <div>
                  <p className={`text-xs ${theme.textMuted}`}>Proveedor</p>
                  <p className="mt-1 text-sm font-semibold uppercase">
                    {session.provider || "internal"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled
              className={`rounded-2xl px-5 py-3 text-sm font-semibold opacity-70 ${theme.buttonPrimary}`}
            >
              Pagar con tarjeta próximamente
            </button>

            <button
              type="button"
              disabled
              className={`rounded-2xl px-5 py-3 text-sm font-semibold opacity-70 ${theme.buttonSecondary}`}
            >
              PayPal próximamente
            </button>

            <Link
              href="/dashboard/profile"
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${theme.buttonSecondary}`}
            >
              Volver al perfil
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}