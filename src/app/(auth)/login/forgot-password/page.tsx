import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck, Store } from "lucide-react";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import { requestPasswordResetAction } from "@/app/actions/password";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const theme = getThemeClasses("warm");

  return (
    <main className={`relative min-h-screen overflow-hidden px-4 py-10 ${theme.pageBg}`}>
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#a56a3a]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-white/50 blur-3xl" />

      <div className="relative mx-auto flex min-h-[85vh] max-w-5xl items-center justify-center">
        <section className={`w-full max-w-xl rounded-[2rem] border p-6 shadow-xl sm:p-8 ${theme.glassCard}`}>
          <Link
            href="/login"
            className={`mb-6 inline-flex items-center gap-2 text-sm font-semibold ${theme.textMuted}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al login
          </Link>

          <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-3xl ${theme.accent}`}>
            <Store className="h-6 w-6" />
          </div>

          <h1 className="text-3xl font-black">Recuperar contraseña</h1>
          <p className={`mt-2 text-sm leading-6 ${theme.textMuted}`}>
            Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
          </p>

          {params.error && (
            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {params.error}
            </p>
          )}

          {params.success && (
            <p className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {params.success}
            </p>
          )}

          <form action={requestPasswordResetAction} className="mt-6 space-y-4">
            <div>
              <label className={`mb-1.5 block text-sm font-semibold ${theme.label}`}>
                Correo
              </label>
              <div className="relative">
                <Mail className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`} />
                <input
                  type="email"
                  name="email"
                  className={`w-full rounded-2xl border py-3 pl-10 pr-4 outline-none transition ${theme.input}`}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full rounded-2xl px-4 py-3 font-bold transition ${theme.buttonPrimary}`}
            >
              Enviar enlace de recuperación
            </button>
          </form>

          <div className={`mt-5 rounded-2xl border p-4 text-sm leading-6 ${theme.subtle}`}>
            <div className="mb-2 flex items-center gap-2 font-bold">
              <ShieldCheck className="h-4 w-4" />
              Revisa tu correo
            </div>
            También revisa spam o promociones. El enlace abrirá una página segura para cambiar tu contraseña.
          </div>
        </section>
      </div>
    </main>
  );
}
