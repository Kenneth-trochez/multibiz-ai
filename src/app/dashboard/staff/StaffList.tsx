"use client";

import { useState } from "react";
import {
  deleteStaffAction,
  updateStaffAction,
} from "../../actions/staff";

type RoleOption = {
  id: string;
  name: string;
};

type StaffMember = {
  id: string;
  display_name: string;
  specialty: string | null;
  active: boolean;
  created_at: string;
  role_id: string | null;
  role: {
    id: string;
    name: string;
  } | null;
};

type Theme = {
  pageBg: string;
  card: string;
  input: string;
  textMuted: string;
  label: string;
  buttonPrimary: string;
  buttonSecondary: string;
  danger: string;
};

export default function StaffList({
  staff,
  roles,
  theme,
}: {
  staff: StaffMember[];
  roles: RoleOption[];
  theme: Theme;
}) {
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Lista de staff</h2>
          <p className={`text-sm ${theme.textMuted}`}>
            {staff.length} en esta página
          </p>
        </div>

        {staff.length === 0 ? (
          <div className={`rounded-2xl border p-6 ${theme.card}`}>
            <p className={theme.textMuted}>Aún no hay miembros registrados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {staff.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedStaff(member)}
                className={`w-full rounded-2xl border p-4 text-left shadow-sm transition hover:scale-[1.01] ${theme.card}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">
                      {member.display_name}
                    </p>

                    <p className={`truncate text-sm ${theme.textMuted}`}>
                      {member.specialty?.trim()
                        ? member.specialty
                        : "Sin puesto o especialidad"}
                    </p>

                    <p className={`mt-1 truncate text-xs ${theme.textMuted}`}>
                      Rol: {member.role?.name || "Sin rol"}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className={`text-xs ${theme.textMuted}`}>
                      {member.active ? "Activo" : "Inactivo"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl border p-6 shadow-xl ${theme.card}`}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Editar miembro</h3>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Modifica la información del miembro o elimínalo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className={`rounded-xl px-3 py-2 text-sm transition ${theme.buttonSecondary}`}
              >
                Cerrar
              </button>
            </div>

            <form action={updateStaffAction} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="staffId" value={selectedStaff.id} />

              <div className="md:col-span-2">
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Nombre
                </label>
                <input
                  name="display_name"
                  defaultValue={selectedStaff.display_name}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                  required
                />
              </div>

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Rol
                </label>
                <select
                  name="role_id"
                  defaultValue={selectedStaff.role_id || ""}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                >
                  <option value="">Sin rol asignado</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Puesto / Sección
                </label>
                <input
                  name="specialty"
                  defaultValue={selectedStaff.specialty || ""}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                  placeholder="Ej. Barbero, Recepcionista, Administrador"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  id={`active_${selectedStaff.id}`}
                  type="checkbox"
                  name="active"
                  defaultChecked={selectedStaff.active}
                />
                <label
                  htmlFor={`active_${selectedStaff.id}`}
                  className={`text-sm font-medium ${theme.label}`}
                >
                  Miembro activo
                </label>
              </div>

              <div className="flex flex-wrap gap-3 md:col-span-2">
                <button
                  type="submit"
                  className={`rounded-xl px-4 py-2 font-medium transition ${theme.buttonPrimary}`}
                >
                  Guardar cambios
                </button>
              </div>
            </form>

            <form action={deleteStaffAction} className="mt-4">
              <input type="hidden" name="staffId" value={selectedStaff.id} />
              <button
                type="submit"
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${theme.danger}`}
              >
                Eliminar
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}