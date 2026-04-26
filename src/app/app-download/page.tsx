import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Smartphone,
  ShieldCheck,
  Store,
  Clock,
} from "lucide-react";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";

export default function AppDownloadPage() {
  const theme = getThemeClasses("warm");
  const androidApkUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL || "";

  return (
    <main className={`relative min-h-screen overflow-hidden px-4 py-10 ${theme.pageBg}`}>
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#a56a3a]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-white/50 blur-3xl" />

      <div className="relative mx-auto max-w-5xl">
        <Link
          href="/"
          className={`mb-6 inline-flex items-center gap-2 text-sm font-semibold ${theme.textMuted}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <section className={`rounded-[2rem] border p-6 shadow-xl md:p-10 ${theme.glassCard}`}>
          <div className="grid gap-8 md:grid-cols-[1fr_0.8fr] md:items-center">
            <div>
              <div className={`mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${theme.softAccent}`}>
                <Smartphone className="h-4 w-4" />
                App móvil MultiBiz AI
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Lleva tu negocio también en el teléfono.
              </h1>

              <p className={`mt-5 max-w-2xl text-base leading-7 ${theme.textMuted}`}>
                Consulta citas, clientes, balance y recibe notificaciones desde la app móvil.
                Actualmente está disponible para Android mediante APK privado.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {androidApkUrl ? (
                  <a
                    href={androidApkUrl}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${theme.buttonPrimary}`}
                  >
                    <Download className="h-4 w-4" />
                    Descargar APK Android
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-gray-300 px-5 py-3 text-sm font-bold text-gray-600"
                  >
                    <Clock className="h-4 w-4" />
                    APK no disponible aún
                  </button>
                )}

                <Link
                  href="/login"
                  className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-bold transition ${theme.buttonSecondary}`}
                >
                  Entrar al SaaS
                </Link>
              </div>

              <p className={`mt-4 text-xs leading-5 ${theme.textMuted}`}>
                En Android puede aparecer una advertencia al instalar APKs fuera de Play Store.
                Instala únicamente el archivo oficial compartido desde esta página.
              </p>
            </div>

            <div className={`rounded-[2rem] border p-5 ${theme.card}`}>
              <div className="mx-auto max-w-[260px] rounded-[2rem] border bg-[#2f241d] p-3 shadow-2xl">
                <div className="rounded-[1.5rem] bg-[#f6f1e8] p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#a56a3a] text-white">
                      <Store className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#2f241d]">MultiBiz AI</p>
                      <p className="text-xs text-[#6a5a4d]">App móvil</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      "Citas del día",
                      "Balance mensual",
                      "Notificaciones push",
                      "Clientes del negocio",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-[#eadfce] bg-white/80 p-3 text-sm font-semibold text-[#2f241d]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <p className="text-sm font-bold">Conectada a tu negocio</p>
                  </div>
                  <p className={`mt-2 text-sm ${theme.textMuted}`}>
                    Usa la misma cuenta y el mismo negocio configurado en el dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}