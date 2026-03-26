import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { createClient } from "@/lib/supabase/server";

function getThemeClasses(theme: string) {
  switch (theme) {
    case "dark":
      return {
        pageBg: "bg-[#181818] text-white",
        card: "bg-white/5 border-white/10 backdrop-blur-xl",
        textMuted: "text-[#bdbdbd]",
        buttonPrimary: "bg-white text-black hover:bg-[#e8e8e8]",
        buttonSecondary:
          "bg-white/10 border-white/20 text-white hover:bg-white/15",
      };
    case "elegant":
      return {
        pageBg: "bg-[#f4efe8] text-[#2b211b]",
        card: "bg-white/60 border-white/50 backdrop-blur-xl",
        textMuted: "text-[#7a6858]",
        buttonPrimary: "bg-[#6b4f3a] text-white hover:bg-[#5a4331]",
        buttonSecondary:
          "bg-white/70 border-[#d8c7b7] text-[#2b211b] hover:bg-[#f3e8dc]",
      };
    case "minimal":
      return {
        pageBg: "bg-[#f8f8f8] text-[#1f1f1f]",
        card: "bg-white/70 border-white/60 backdrop-blur-xl",
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
        textMuted: "text-[#6b5b4d]",
        buttonPrimary: "bg-[#a56a3a] text-white hover:bg-[#8d582e]",
        buttonSecondary:
          "bg-white/80 border-[#d9c6b2] text-[#2f241d] hover:bg-[#f3e8dc]",
      };
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

  return (
    <main className={`min-h-screen ${theme.pageBg}`}>
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        <section className={`rounded-[28px] border p-6 md:p-8 ${theme.card}`}>
          <p className={`text-sm ${theme.textMuted}`}>Checkout preparado</p>
          <h1 className="mt-1 text-3xl font-bold">Finalizar mejora de plan</h1>
          <p className={`mt-2 text-sm ${theme.textMuted}`}>
            Esta pantalla ya está lista para conectar Stripe o PayPal después.
            Por ahora la sesión queda creada como pendiente.
          </p>
        </section>

        <section className={`rounded-[28px] border p-6 md:p-8 ${theme.card}`}>
          <div className="grid gap-5 md:grid-cols-2">
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
            </div>

            <div>
              <p className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
                Resumen
              </p>
              <p className="mt-1 text-lg font-semibold">
                {session.currency} {Number(session.amount || 0).toFixed(2)}
              </p>
              <p className={`mt-2 text-sm ${theme.textMuted}`}>
                Estado: {session.status}
              </p>
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