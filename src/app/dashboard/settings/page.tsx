import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import { formatMoneyByTimezone } from "@/lib/money/currency";
import { createClient } from "@/lib/supabase/server";
import { updateBusinessAction } from "../../actions/business";
import LogoUploader from "../components/LogoUploader";
import {
  updateBusinessGoalsAction,
  updateBusinessScheduleAction,
} from "../../actions/business-settings";

type BusinessSettingsRow = {
  daily_sales_goal: number;
  monthly_sales_goal: number;
  daily_appointments_goal: number;
  timezone: string;
  workday_start_time: string;
  workday_end_time: string;
  workdays: string[];
};

const WEEKDAY_OPTIONS = [
  { value: "monday", label: "Lunes" },
  { value: "tuesday", label: "Martes" },
  { value: "wednesday", label: "Miércoles" },
  { value: "thursday", label: "Jueves" },
  { value: "friday", label: "Viernes" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

const TIMEZONE_OPTIONS = [
  { value: "America/Tegucigalpa", label: "América/Tegucigalpa (Honduras)" },
  { value: "America/Mexico_City", label: "América/Ciudad de México" },
  { value: "America/Bogota", label: "América/Bogotá" },
  { value: "America/New_York", label: "América/New York" },
  { value: "America/Los_Angeles", label: "América/Los Angeles" },
  { value: "Europe/Madrid", label: "Europa/Madrid" },
];

function normalizeTimeValue(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  return String(value).slice(0, 5);
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const ctx = await requireSectionAccess("settings");

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");
  const supabase = await createClient();

  const { data: businessSettings } = await supabase
    .from("business_settings")
    .select(
      "daily_sales_goal, monthly_sales_goal, daily_appointments_goal, timezone, workday_start_time, workday_end_time, workdays"
    )
    .eq("business_id", business.id)
    .maybeSingle();

  const settings: BusinessSettingsRow = {
    daily_sales_goal: Number(businessSettings?.daily_sales_goal || 3000),
    monthly_sales_goal: Number(businessSettings?.monthly_sales_goal || 60000),
    daily_appointments_goal: Number(
      businessSettings?.daily_appointments_goal || 8
    ),
    timezone: businessSettings?.timezone || "America/Tegucigalpa",
    workday_start_time: normalizeTimeValue(
      businessSettings?.workday_start_time,
      "08:00"
    ),
    workday_end_time: normalizeTimeValue(
      businessSettings?.workday_end_time,
      "17:00"
    ),
    workdays: Array.isArray(businessSettings?.workdays)
      ? businessSettings.workdays
      : ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  };

  const timezone = settings.timezone;

  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-6">
        <section className={`rounded-[28px] p-6 md:p-8 ${theme.glassCard}`}>
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold">Configuración del negocio</h1>
            <p className={`mt-2 text-sm ${theme.textMuted}`}>
              Personaliza la información visual, general y las metas operativas
              de tu negocio.
            </p>
          </div>

          {params?.error && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {params.error}
            </p>
          )}

          {params?.success === "goals_updated" && (
            <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Metas del negocio actualizadas correctamente.
            </p>
          )}

          {params?.success === "updated" && (
            <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Configuración general actualizada correctamente.
            </p>
          )}

          {params?.success === "schedule_updated" && (
            <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Horario del negocio actualizado correctamente.
            </p>
          )}

          <div className="grid gap-6">
            <section className={`rounded-[24px] border p-6 ${theme.card}`}>
              <div className="mb-5">
                <h2 className="text-2xl font-semibold">Información general</h2>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Edita los datos principales y la apariencia visual del negocio.
                </p>
              </div>

              <form
                action={updateBusinessAction}
                className="grid gap-5 md:grid-cols-2"
              >
                <div className="md:col-span-2">
                  <label
                    className={`mb-2 block text-sm font-medium ${theme.label}`}
                  >
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
                  <label
                    className={`mb-2 block text-sm font-medium ${theme.label}`}
                  >
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
                  <label
                    className={`mb-2 block text-sm font-medium ${theme.label}`}
                  >
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
                  <label
                    className={`mb-2 block text-sm font-medium ${theme.label}`}
                  >
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
                  <label
                    className={`mb-2 block text-sm font-medium ${theme.label}`}
                  >
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

                <LogoUploader
                  businessId={business.id}
                  currentLogoUrl={business.logo_url}
                  themeInput={theme.input}
                  themeTextMuted={theme.textMuted}
                  themeButtonPrimary={theme.buttonPrimary}
                  themeCard={theme.card}
                />

                <div className="md:col-span-2 flex justify-center pt-2">
                  <button
                    type="submit"
                    className={`rounded-2xl px-6 py-3 text-sm font-semibold transition ${theme.buttonPrimary}`}
                  >
                    Guardar cambios generales
                  </button>
                </div>
              </form>
            </section>

            <section className={`rounded-[24px] border p-6 ${theme.card}`}>
              <div className="mb-5">
                <h2 className="text-2xl font-semibold">Metas del negocio</h2>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Estas metas se usan en el resumen inteligente para mostrar
                  progreso y rendimiento.
                </p>
              </div>

              <form
                action={updateBusinessGoalsAction}
                className="grid gap-5 md:grid-cols-2"
              >
                <input type="hidden" name="businessId" value={business.id} />

                <div>
                  <label
                    className={`mb-2 block text-sm font-medium ${theme.label}`}
                  >
                    Meta de ventas diarias
                  </label>
                  <input
                    type="number"
                    name="daily_sales_goal"
                    min="0"
                    step="0.01"
                    defaultValue={settings.daily_sales_goal}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.input}`}
                  />
                  <p className={`mt-2 text-xs ${theme.textMuted}`}>
                    Ejemplo: 3000 significa que esperas vender el equivalente a tu moneda por día.
                  </p>
                </div>

                <div>
                  <label
                    className={`mb-2 block text-sm font-medium ${theme.label}`}
                  >
                    Meta de ventas mensuales
                  </label>
                  <input
                    type="number"
                    name="monthly_sales_goal"
                    min="0"
                    step="0.01"
                    defaultValue={settings.monthly_sales_goal}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.input}`}
                  />
                  <p className={`mt-2 text-xs ${theme.textMuted}`}>
                    Ejemplo: 60000 significa una meta mensual en tu moneda.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label
                    className={`mb-2 block text-sm font-medium ${theme.label}`}
                  >
                    Meta de citas diarias
                  </label>
                  <input
                    type="number"
                    name="daily_appointments_goal"
                    min="0"
                    step="1"
                    defaultValue={settings.daily_appointments_goal}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.input}`}
                  />
                  <p className={`mt-2 text-xs ${theme.textMuted}`}>
                    Esta meta se usa para comparar la carga esperada de citas y
                    el ritmo del negocio.
                  </p>
                </div>

                <div className="md:col-span-2 grid gap-4 sm:grid-cols-3">
                  <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                    <p className={`text-xs ${theme.textMuted}`}>
                      Ventas diarias actuales
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {formatMoneyByTimezone(settings.daily_sales_goal, timezone)}
                    </p>
                  </div>

                  <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                    <p className={`text-xs ${theme.textMuted}`}>
                      Ventas mensuales actuales
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {formatMoneyByTimezone(settings.monthly_sales_goal, timezone)}
                    </p>
                  </div>

                  <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                    <p className={`text-xs ${theme.textMuted}`}>
                      Citas diarias actuales
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {Number(settings.daily_appointments_goal || 0)}
                    </p>
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-center pt-2">
                  <button
                    type="submit"
                    className={`rounded-2xl px-6 py-3 text-sm font-semibold transition ${theme.buttonPrimary}`}
                  >
                    Guardar metas del negocio
                  </button>
                </div>
              </form>
            </section>

            <section className={`rounded-[24px] border p-6 ${theme.card}`}>
              <div className="mb-5">
                <h2 className="text-2xl font-semibold">Horario del negocio</h2>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Este horario será usado por la IA para ofrecer espacios de
                  cita reales.
                </p>
              </div>

              <form
                action={updateBusinessScheduleAction}
                className="grid gap-5 md:grid-cols-2"
              >
                <input type="hidden" name="businessId" value={business.id} />

                <div className="md:col-span-2">
                  <label
                    className={`mb-2 block text-sm font-medium ${theme.label}`}
                  >
                    Zona horaria
                  </label>
                  <select
                    name="timezone"
                    defaultValue={settings.timezone}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.select}`}
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option
                        key={tz.value}
                        value={tz.value}
                        className={theme.option}
                      >
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`mb-2 block text-sm font-medium ${theme.label}`}
                  >
                    Hora de apertura
                  </label>
                  <input
                    type="time"
                    name="workday_start_time"
                    defaultValue={settings.workday_start_time}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.input}`}
                    required
                  />
                </div>

                <div>
                  <label
                    className={`mb-2 block text-sm font-medium ${theme.label}`}
                  >
                    Hora de cierre
                  </label>
                  <input
                    type="time"
                    name="workday_end_time"
                    defaultValue={settings.workday_end_time}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${theme.input}`}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    className={`mb-3 block text-sm font-medium ${theme.label}`}
                  >
                    Días de atención
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {WEEKDAY_OPTIONS.map((day) => (
                      <label
                        key={day.value}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${theme.subtle}`}
                      >
                        <input
                          type="checkbox"
                          name="workdays"
                          value={day.value}
                          defaultChecked={settings.workdays.includes(day.value)}
                        />
                        <span className="text-sm font-medium">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 grid gap-4 sm:grid-cols-3">
                  <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                    <p className={`text-xs ${theme.textMuted}`}>
                      Zona horaria actual
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {settings.timezone}
                    </p>
                  </div>

                  <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                    <p className={`text-xs ${theme.textMuted}`}>
                      Apertura actual
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {settings.workday_start_time}
                    </p>
                  </div>

                  <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                    <p className={`text-xs ${theme.textMuted}`}>
                      Cierre actual
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {settings.workday_end_time}
                    </p>
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-center pt-2">
                  <button
                    type="submit"
                    className={`rounded-2xl px-6 py-3 text-sm font-semibold transition ${theme.buttonPrimary}`}
                  >
                    Guardar horario del negocio
                  </button>
                </div>
              </form>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}