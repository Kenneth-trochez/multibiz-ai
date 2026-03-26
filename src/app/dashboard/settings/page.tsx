import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import { updateBusinessAction } from "../../actions/business";

export default async function SettingsPage() {
  const ctx = await requireSectionAccess("settings");

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");

  return (
    <main className={theme.pageBg}>
      <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl items-center justify-center px-4 py-8 md:px-6">
        <section className={`w-full rounded-[28px] p-6 md:p-8 ${theme.glassCard}`}>
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold">Configuración del negocio</h1>
            <p className={`mt-2 text-sm ${theme.textMuted}`}>
              Personaliza la información visual y general de tu negocio.
            </p>
          </div>

          <form action={updateBusinessAction} className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
                Nombre del negocio
              </label>
              <input
                type="text"
                name="name"
                defaultValue={business.name || ""}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.input}`}
                required
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
                Tipo de negocio
              </label>
              <input
                type="text"
                name="business_type"
                defaultValue={business.business_type || ""}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.input}`}
                placeholder="Ej. Barbería, Clínica, Restaurante"
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
                Teléfono
              </label>
              <input
                type="text"
                name="phone"
                defaultValue={business.phone || ""}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.input}`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
                Dirección
              </label>
              <input
                type="text"
                name="address"
                defaultValue={business.address || ""}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.input}`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
                Tema
              </label>
              <select
                name="theme"
                defaultValue={business.theme || "warm"}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.select}`}
              >
                <option value="warm" className={theme.option}>
                  Cálido clásico
                </option>
                <option value="elegant" className={theme.option}>
                  Elegante suave
                </option>
                <option value="minimal" className={theme.option}>
                  Minimalista claro
                </option>

                <option value="blush_pop" className={theme.option}>
                  Rosa moderno
                </option>
                <option value="cotton_candy" className={theme.option}>
                  Rosa pastel
                </option>
                <option value="pearl_rose" className={theme.option}>
                  Rosa elegante
                </option>
                <option value="mint_day" className={theme.option}>
                  Verde menta
                </option>
                <option value="sky_breeze" className={theme.option}>
                  Azul cielo
                </option>

                <option value="dark" className={theme.option}>
                  Oscuro clásico
                </option>
                <option value="rose_glam" className={theme.option}>
                  Rose Glam
                </option>
                <option value="sunset_pop" className={theme.option}>
                  Sunset Pop
                </option>
                <option value="violet_neon" className={theme.option}>
                  Violet Neon
                </option>
                <option value="aqua_lux" className={theme.option}>
                  Aqua Lux
                </option>
                <option value="ruby_night" className={theme.option}>
                  Ruby Night
                </option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={`mb-2 block text-sm font-medium ${theme.label}`}>
                Logo del negocio
              </label>
              <input
                type="file"
                name="logo"
                accept="image/*"
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:px-4 file:py-2 file:font-medium ${theme.input}`}
              />
            </div>

            {business.logo_url && (
              <div className="md:col-span-2">
                <p className={`mb-3 text-sm ${theme.textMuted}`}>Logo actual</p>
                <img
                  src={business.logo_url}
                  alt="Logo del negocio"
                  className="h-24 w-24 rounded-2xl border object-cover"
                />
              </div>
            )}

            <div className="md:col-span-2 flex justify-center pt-2">
              <button
                type="submit"
                className={`rounded-2xl px-6 py-3 text-sm font-semibold transition ${theme.buttonPrimary}`}
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}