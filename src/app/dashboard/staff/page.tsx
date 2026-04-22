import {
  createAndInviteStaffAction,
  createStaffAction,
  createStaffUserAction,
} from "../../actions/staff";
import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { createClient } from "@/lib/supabase/server";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import Link from "next/link";
import StaffList from "./StaffList";

type RoleOption = {
  id: string;
  name: string;
};

type StaffMember = {
  id: string;
  display_name: string;
  specialty: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
  role_id: string | null;
  invite_status: string | null;
  role: {
    id: string;
    name: string;
  } | null;
};

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; page?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireSectionAccess("staff");

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");
  const supabase = await createClient();

  const currentPage = Math.max(1, Number(params.page || "1") || 1);
  const pageSize = 10;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const [
    { count, error: countError },
    { data: staff, error },
    { data: roles, error: rolesError },
  ] = await Promise.all([
    supabase
      .from("staff")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id),

    supabase
      .from("staff")
      .select(`
        id,
        display_name,
        specialty,
        email,
        active,
        created_at,
        role_id,
        invite_status,
        role:roles(id,name)
      `)
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .range(from, to),

    supabase
      .from("roles")
      .select("id, name")
      .eq("business_id", business.id)
      .order("name", { ascending: true }),
  ]);

  if (error || countError || rolesError) {
    return (
      <main className={`min-h-screen p-6 ${theme.pageBg}`}>
        <div className={`rounded-2xl border p-6 ${theme.card}`}>
          Error cargando staff:{" "}
          {error?.message || countError?.message || rolesError?.message}
        </div>
      </main>
    );
  }

  const totalStaff = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalStaff / pageSize));

  const normalizedStaff: StaffMember[] = (staff || []).map((member: any) => ({
    id: member.id,
    display_name: member.display_name,
    specialty: member.specialty,
    email: member.email ?? null,
    active: member.active,
    created_at: member.created_at,
    role_id: member.role_id ?? null,
    invite_status: member.invite_status ?? null,
    role: Array.isArray(member.role)
      ? member.role[0] || null
      : member.role || null,
  }));

  return (
    <main className={`min-h-screen p-6 ${theme.pageBg}`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Staff</h1>
          <p className={`mt-1 text-sm ${theme.textMuted}`}>
            Administra el personal del negocio actual.
          </p>
        </div>

        {params.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error}
          </p>
        )}

        {params.success === "created" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Miembro creado correctamente.
          </p>
        )}

        {params.success === "updated" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Miembro actualizado correctamente.
          </p>
        )}

        {params.success === "deleted" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Miembro eliminado correctamente.
          </p>
        )}

        {params.success === "invited" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Invitación enviada correctamente.
          </p>
        )}

        {params.success === "user_created" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Cuenta de empleado creada correctamente.
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            <StaffList
              staff={normalizedStaff}
              roles={(roles || []) as RoleOption[]}
              theme={theme}
            />

            <div className="flex items-center justify-between">
              <p className={`text-sm ${theme.textMuted}`}>
                Página {currentPage} de {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/staff?page=${currentPage - 1}`}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${currentPage <= 1
                    ? "pointer-events-none opacity-50"
                    : theme.buttonSecondary
                    }`}
                >
                  ← Anterior
                </Link>

                <Link
                  href={`/dashboard/staff?page=${currentPage + 1}`}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${currentPage >= totalPages
                    ? "pointer-events-none opacity-50"
                    : theme.buttonSecondary
                    }`}
                >
                  Siguiente →
                </Link>
              </div>
            </div>
          </section>

          <section
            className={`h-fit rounded-2xl border p-6 shadow-sm ${theme.card}`}
          >
            <h2 className="mb-4 text-xl font-semibold">Nuevo miembro</h2>

            <form action={createStaffAction} className="grid gap-4">
              <input type="hidden" name="businessId" value={business.id} />

              <div>
                <label
                  className={`mb-1 block text-sm font-medium ${theme.label}`}
                >
                  Nombre
                </label>
                <input
                  name="display_name"
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                  required
                />
              </div>

              <div>
                <label
                  className={`mb-1 block text-sm font-medium ${theme.label}`}
                >
                  Correo
                </label>
                <input
                  type="email"
                  name="email"
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                  placeholder="ejemplo@correo.com"
                />
                <p className={`mt-1 text-xs ${theme.textMuted}`}>
                  Déjalo vacío si solo quieres crear el staff sin acceso al
                  sistema.
                </p>
              </div>

              <div>
                <label
                  className={`mb-1 block text-sm font-medium ${theme.label}`}
                >
                  Contraseña temporal
                </label>
                <input
                  type="password"
                  name="password"
                  minLength={6}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                  placeholder="Solo para crear cuenta manual"
                />
              </div>

              <div>
                <label
                  className={`mb-1 block text-sm font-medium ${theme.label}`}
                >
                  Rol de acceso al sistema
                </label>
                <select
                  name="access_role"
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.select}`}
                  defaultValue="staff"
                >
                  <option className={theme.option} value="staff">
                    Staff
                  </option>
                  <option className={theme.option} value="manager">
                    Manager
                  </option>
                </select>
                <p className={`mt-1 text-xs ${theme.textMuted}`}>
                  Staff: dashboard, clientes y citas. Manager: casi todo menos
                  configuración y staff.
                </p>
              </div>

              <div>
                <label
                  className={`mb-1 block text-sm font-medium ${theme.label}`}
                >
                  Rol interno / puesto
                </label>
                <select
                  name="role_id"
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.select}`}
                  defaultValue=""
                >
                  <option className={theme.option} value="">
                    Sin rol asignado
                  </option>
                  {(roles || []).map((role) => (
                    <option
                      key={role.id}
                      value={role.id}
                      className={theme.option}
                    >
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className={`mb-1 block text-sm font-medium ${theme.label}`}
                >
                  Puesto / Sección
                </label>
                <input
                  name="specialty"
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                  placeholder="Ej. Barbero, Recepcionista, Administrador"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="active_new_staff"
                  type="checkbox"
                  name="active"
                  defaultChecked
                />
                <label
                  htmlFor="active_new_staff"
                  className={`text-sm font-medium ${theme.label}`}
                >
                  Miembro activo
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  formAction={createStaffUserAction}
                  className={`rounded-xl border px-4 py-2 font-medium transition ${theme.buttonSecondary}`}
                >
                  Crear cuenta manual
                </button>

                <button
                  type="button"
                  aria-disabled="true"
                  title="Guardar e invitar está desactivado por el momento"
                  onClick={(e) => {
                    e.preventDefault();
                    window.alert("Guardar e invitar está desactivado por el momento.");
                  }}
                  className={`rounded-xl border px-4 py-2 font-medium opacity-50 cursor-not-allowed transition ${theme.buttonSecondary}`}
                >
                  Guardar e invitar
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}