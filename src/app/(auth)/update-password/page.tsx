import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import { updatePasswordAction } from "@/app/actions/password";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
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
            <Lock className="h-6 w-6" />
          </div>

          <h1 className="text-3xl font-black">Crear nueva contraseña</h1>
          <p className={`mt-2 text-sm leading-6 ${theme.textMuted}`}>
            Ingresa una nueva contraseña para recuperar el acceso a tu cuenta.
          </p>

          {params.error && (
            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {params.error}
            </p>
          )}

          <form action={updatePasswordAction} className="mt-6 space-y-4">
            <div>
              <label className={`mb-1.5 block text-sm font-semibold ${theme.label}`}>
                Nueva contraseña
              </label>
              <div className="relative">
                <Lock className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`} />
                <input
                  type="password"
                  name="password"
                  minLength={8}
                  className={`w-full rounded-2xl border py-3 pl-10 pr-4 outline-none transition ${theme.input}`}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>
            </div>

            <div>
              <label className={`mb-1.5 block text-sm font-semibold ${theme.label}`}>
                Confirmar contraseña
              </label>
              <div className="relative">
                <ShieldCheck className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`} />
                <input
                  type="password"
                  name="confirmPassword"
                  minLength={8}
                  className={`w-full rounded-2xl border py-3 pl-10 pr-4 outline-none transition ${theme.input}`}
                  placeholder="Repite la contraseña"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full rounded-2xl px-4 py-3 font-bold transition ${theme.buttonPrimary}`}
            >
              Actualizar contraseña
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
