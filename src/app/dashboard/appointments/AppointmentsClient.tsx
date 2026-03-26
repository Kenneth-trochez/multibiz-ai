"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  CalendarDays,
  User,
  Briefcase,
  Scissors,
  PhoneCall,
  Pencil,
} from "lucide-react";
import {
  createAppointmentAction,
  deleteAppointmentAction,
  updateAppointmentAction,
  updateAppointmentStatusAction,
} from "../../actions/appointments";

type AppointmentRow = {
  id: string;
  appointment_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  source: "manual" | "ai_voice";
  notes: string | null;
  created_at: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  service: {
    id: string;
    name: string;
    price: number | null;
    duration_minutes: number | null;
  } | null;
  staff: {
    id: string;
    display_name: string;
    specialty: string | null;
  } | null;
};

type CustomerOption = {
  id: string;
  name: string;
  phone: string | null;
};

type ServiceOption = {
  id: string;
  name: string;
  price: number | null;
  duration_minutes: number | null;
};

type StaffOption = {
  id: string;
  display_name: string;
  specialty: string | null;
};

type Theme = {
  pageBg: string;
  sidebarBg: string;
  sidebarCard: string;
  card: string;
  cardSoft: string;
  subtle: string;
  input: string;
  select: string;
  option: string;
  textMuted: string;
  label: string;
  hover: string;
  active: string;
  accent: string;
  softAccent: string;
  buttonPrimary: string;
  buttonSecondary: string;
  logoutButton: string;
  danger: string;
  glassCard: string;
  headerBg: string;
};

const TZ = "America/Tegucigalpa";

function formatHour(dateStr: string) {
  return new Intl.DateTimeFormat("es-HN", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateStr));
}

function formatDateTime(dateStr: string) {
  return new Intl.DateTimeFormat("es-HN", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateStr));
}

function dateKeyInTz(dateStr: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(dateStr));

  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function toDateTimeLocalValue(dateStr: string) {
  const date = new Date(dateStr);

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const formatted = formatter.format(date);
  return formatted.replace(" ", "T");
}

function getSourceConfig(source: AppointmentRow["source"]) {
  switch (source) {
    case "ai_voice":
      return {
        label: "IA voz",
        className: "bg-violet-100 text-violet-700",
      };
    case "manual":
    default:
      return {
        label: "Manual",
        className: "bg-zinc-100 text-zinc-700",
      };
  }
}

const statusConfig = {
  confirmed: {
    label: "Confirmada",
    className: "bg-blue-100 text-blue-700",
  },
  completed: {
    label: "Completada",
    className: "bg-green-100 text-green-700",
  },
  pending: {
    label: "Pendiente",
    className: "bg-yellow-100 text-yellow-700",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-red-100 text-red-700",
  },
};

export default function AppointmentsClient({
  businessId,
  initialAppointments,
  customers,
  services,
  staff,
  theme,
  today,
}: {
  businessId: string;
  initialAppointments: AppointmentRow[];
  customers: CustomerOption[];
  services: ServiceOption[];
  staff: StaffOption[];
  theme: Theme;
  today: string;
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<AppointmentRow | null>(null);

  const [filterDate, setFilterDate] = useState(today);
  const [showAllDates, setShowAllDates] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return initialAppointments.filter((apt) => {
      const customerName = (apt.customer?.name || "").toLowerCase();
      const serviceName = (apt.service?.name || "").toLowerCase();
      const staffName = (apt.staff?.display_name || "").toLowerCase();
      const sourceLabel = apt.source === "ai_voice" ? "ia voz" : "manual";
      const term = search.toLowerCase().trim();

      const matchSearch =
        !term ||
        customerName.includes(term) ||
        serviceName.includes(term) ||
        staffName.includes(term) ||
        sourceLabel.includes(term);

      const matchStatus = !filterStatus || apt.status === filterStatus;
      const matchSource = !filterSource || apt.source === filterSource;
      const matchDate =
        showAllDates || dateKeyInTz(apt.appointment_at) === filterDate;

      return matchSearch && matchStatus && matchSource && matchDate;
    });
  }, [
    initialAppointments,
    search,
    filterStatus,
    filterSource,
    filterDate,
    showAllDates,
  ]);

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">Citas</h1>
          <p className={`mt-1 text-sm ${theme.textMuted}`}>
            Gestiona todas las citas del negocio.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${theme.buttonPrimary}`}
        >
          <Plus className="h-4 w-4" />
          Nueva cita
        </button>
      </div>

      <div className={`mb-6 rounded-2xl border p-4 shadow-sm ${theme.card}`}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-5">
          <div
            className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 sm:col-span-2 2xl:col-span-1 ${theme.input}`}
          >
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, servicio, staff u origen..."
              className="w-full min-w-0 bg-transparent text-sm outline-none"
            />
          </div>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            disabled={showAllDates}
            className={`w-full min-w-0 rounded-xl border px-3 py-2 text-sm outline-none ${
              showAllDates ? "cursor-not-allowed opacity-50" : ""
            } ${theme.input}`}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`w-full min-w-0 rounded-xl border px-4 py-3 text-sm outline-none ${theme.select}`}
          >
            <option className={theme.option} value="">
              Todos los estados
            </option>
            <option className={theme.option} value="confirmed">
              Confirmadas
            </option>
            <option className={theme.option} value="pending">
              Pendientes
            </option>
            <option className={theme.option} value="completed">
              Completadas
            </option>
            <option className={theme.option} value="cancelled">
              Canceladas
            </option>
          </select>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className={`w-full min-w-0 rounded-xl border px-4 py-3 text-sm outline-none ${theme.select}`}
          >
            <option className={theme.option} value="">
              Todos los orígenes
            </option>
            <option className={theme.option} value="manual">
              Manual
            </option>
            <option className={theme.option} value="ai_voice">
              IA voz
            </option>
          </select>

          <button
            type="button"
            onClick={() => setShowAllDates((prev) => !prev)}
            className={`w-full min-w-0 rounded-xl border px-4 py-3 text-sm font-medium transition ${theme.buttonSecondary}`}
          >
            {showAllDates ? "Viendo todas" : "Todas las fechas"}
          </button>
        </div>
      </div>

      <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.card}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th
                  className={`px-6 py-3 text-left text-xs uppercase tracking-wider ${theme.textMuted}`}
                >
                  {showAllDates ? "Fecha y hora" : "Hora"}
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs uppercase tracking-wider ${theme.textMuted}`}
                >
                  Cliente
                </th>
                <th
                  className={`hidden px-6 py-3 text-left text-xs uppercase tracking-wider ${theme.textMuted} md:table-cell`}
                >
                  Staff
                </th>
                <th
                  className={`hidden px-6 py-3 text-left text-xs uppercase tracking-wider ${theme.textMuted} lg:table-cell`}
                >
                  Servicio
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs uppercase tracking-wider ${theme.textMuted}`}
                >
                  Origen
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs uppercase tracking-wider ${theme.textMuted}`}
                >
                  Estado
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs uppercase tracking-wider ${theme.textMuted}`}
                >
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className={`px-6 py-12 text-center ${theme.textMuted}`}
                  >
                    No hay citas para este filtro.
                  </td>
                </tr>
              ) : (
                filtered.map((apt) => {
                  const status =
                    statusConfig[apt.status] ?? statusConfig.pending;
                  const source = getSourceConfig(apt.source);

                  return (
                    <tr
                      key={apt.id}
                      className="border-t transition-colors hover:bg-black/5"
                    >
                      <td className="px-6 py-4 font-semibold">
                        {showAllDates
                          ? formatDateTime(apt.appointment_at)
                          : formatHour(apt.appointment_at)}
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">
                          {apt.customer?.name || "Sin cliente"}
                        </p>
                        <p className={`text-xs ${theme.textMuted}`}>
                          {apt.customer?.phone || "Sin teléfono"}
                        </p>
                      </td>

                      <td className="hidden px-6 py-4 text-sm md:table-cell">
                        {apt.staff?.display_name || "Sin asignar"}
                      </td>

                      <td className="hidden px-6 py-4 text-sm lg:table-cell">
                        {apt.service?.name || "Sin servicio"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${source.className}`}
                        >
                          {source.label}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingAppointment(apt)}
                            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-blue-500/10 hover:text-blue-600"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {apt.status !== "completed" &&
                            apt.status !== "cancelled" && (
                              <>
                                <form action={updateAppointmentStatusAction}>
                                  <input
                                    type="hidden"
                                    name="appointmentId"
                                    value={apt.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="status"
                                    value="completed"
                                  />
                                  <button
                                    type="submit"
                                    className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-green-500/10 hover:text-green-600"
                                    title="Completar"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </button>
                                </form>

                                <form action={updateAppointmentStatusAction}>
                                  <input
                                    type="hidden"
                                    name="appointmentId"
                                    value={apt.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="status"
                                    value="cancelled"
                                  />
                                  <button
                                    type="submit"
                                    className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-600"
                                    title="Cancelar"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </form>
                              </>
                            )}

                          <form action={deleteAppointmentAction}>
                            <input
                              type="hidden"
                              name="appointmentId"
                              value={apt.id}
                            />
                            <button
                              type="submit"
                              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-600"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div
            className={`relative w-full max-w-md rounded-2xl border p-6 shadow-xl ${theme.card}`}
          >
            <h3 className="mb-5 text-lg font-bold">Nueva cita manual</h3>

            <form action={createAppointmentAction} className="space-y-3">
              <input type="hidden" name="businessId" value={businessId} />
              <input type="hidden" name="source" value="manual" />

              <div>
                <label
                  className={`mb-1 block text-xs uppercase tracking-wider ${theme.textMuted}`}
                >
                  Cliente
                </label>
                <div className="relative">
                  <User
                    className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`}
                  />
                  <select
                    name="customer_id"
                    required
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ${theme.select}`}
                  >
                    <option className={theme.option} value="">
                      Seleccionar cliente
                    </option>
                    {customers.map((customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                        className={theme.option}
                      >
                        {customer.name}
                        {customer.phone ? ` — ${customer.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className={`mb-1 block text-xs uppercase tracking-wider ${theme.textMuted}`}
                >
                  Staff
                </label>
                <div className="relative">
                  <Briefcase
                    className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`}
                  />
                  <select
                    name="staff_id"
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ${theme.select}`}
                  >
                    <option className={theme.option} value="">
                      Sin asignar
                    </option>
                    {staff.map((member) => (
                      <option
                        key={member.id}
                        value={member.id}
                        className={theme.option}
                      >
                        {member.display_name}
                        {member.specialty ? ` — ${member.specialty}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className={`mb-1 block text-xs uppercase tracking-wider ${theme.textMuted}`}
                >
                  Servicio
                </label>
                <div className="relative">
                  <Scissors
                    className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`}
                  />
                  <select
                    name="service_id"
                    required
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ${theme.select}`}
                  >
                    <option className={theme.option} value="">
                      Seleccionar servicio
                    </option>
                    {services.map((service) => (
                      <option
                        key={service.id}
                        value={service.id}
                        className={theme.option}
                      >
                        {service.name}
                        {service.price != null
                          ? ` — L ${Number(service.price).toFixed(2)}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className={`mb-1 block text-xs uppercase tracking-wider ${theme.textMuted}`}
                >
                  Fecha y hora
                </label>
                <div className="relative">
                  <CalendarDays
                    className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`}
                  />
                  <input
                    type="datetime-local"
                    name="appointment_at"
                    required
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ${theme.input}`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`mb-1 block text-xs uppercase tracking-wider ${theme.textMuted}`}
                >
                  Origen
                </label>
                <div className="relative">
                  <PhoneCall
                    className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`}
                  />
                  <input
                    type="text"
                    value="Manual"
                    readOnly
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ${theme.input}`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`mb-1 block text-xs uppercase tracking-wider ${theme.textMuted}`}
                >
                  Notas
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Opcional..."
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${theme.input}`}
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm transition ${theme.buttonSecondary}`}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${theme.buttonPrimary}`}
                >
                  Crear cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingAppointment(null)}
          />
          <div
            className={`relative w-full max-w-md rounded-2xl border p-6 shadow-xl ${theme.card}`}
          >
            <h3 className="mb-5 text-lg font-bold">Editar cita</h3>

            <form action={updateAppointmentAction} className="space-y-3">
              <input
                type="hidden"
                name="appointmentId"
                value={editingAppointment.id}
              />
              <input type="hidden" name="businessId" value={businessId} />

              <div>
                <label
                  className={`mb-1 block text-xs uppercase tracking-wider ${theme.textMuted}`}
                >
                  Cliente
                </label>
                <div className="relative">
                  <User
                    className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`}
                  />
                  <select
                    name="customer_id"
                    required
                    defaultValue={editingAppointment.customer?.id || ""}
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ${theme.select}`}
                  >
                    <option className={theme.option} value="">
                      Seleccionar cliente
                    </option>
                    {customers.map((customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                        className={theme.option}
                      >
                        {customer.name}
                        {customer.phone ? ` — ${customer.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className={`mb-1 block text-xs uppercase tracking-wider ${theme.textMuted}`}
                >
                  Staff
                </label>
                <div className="relative">
                  <Briefcase
                    className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`}
                  />
                  <select
                    name="staff_id"
                    defaultValue={editingAppointment.staff?.id || ""}
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ${theme.select}`}
                  >
                    <option className={theme.option} value="">
                      Sin asignar
                    </option>
                    {staff.map((member) => (
                      <option
                        key={member.id}
                        value={member.id}
                        className={theme.option}
                      >
                        {member.display_name}
                        {member.specialty ? ` — ${member.specialty}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className={`mb-1 block text-xs uppercase tracking-wider ${theme.textMuted}`}
                >
                  Servicio
                </label>
                <div className="relative">
                  <Scissors
                    className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`}
                  />
                  <select
                    name="service_id"
                    required
                    defaultValue={editingAppointment.service?.id || ""}
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ${theme.select}`}
                  >
                    <option className={theme.option} value="">
                      Seleccionar servicio
                    </option>
                    {services.map((service) => (
                      <option
                        key={service.id}
                        value={service.id}
                        className={theme.option}
                      >
                        {service.name}
                        {service.price != null
                          ? ` — L ${Number(service.price).toFixed(2)}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className={`mb-1 block text-xs uppercase tracking-wider ${theme.textMuted}`}
                >
                  Fecha y hora
                </label>
                <div className="relative">
                  <CalendarDays
                    className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme.textMuted}`}
                  />
                  <input
                    type="datetime-local"
                    name="appointment_at"
                    required
                    defaultValue={toDateTimeLocalValue(
                      editingAppointment.appointment_at
                    )}
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ${theme.input}`}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    className={`mb-1 block text-xs uppercase tracking-wider ${theme.textMuted}`}
                  >
                    Estado
                  </label>
                  <select
                    name="status"
                    defaultValue={editingAppointment.status}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${theme.select}`}
                  >
                    <option className={theme.option} value="confirmed">
                      Confirmada
                    </option>
                    <option className={theme.option} value="pending">
                      Pendiente
                    </option>
                    <option className={theme.option} value="completed">
                      Completada
                    </option>
                    <option className={theme.option} value="cancelled">
                      Cancelada
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    className={`mb-1 block text-xs uppercase tracking-wider ${theme.textMuted}`}
                  >
                    Origen
                  </label>
                  <select
                    name="source"
                    defaultValue={editingAppointment.source}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${theme.select}`}
                  >
                    <option className={theme.option} value="manual">
                      Manual
                    </option>
                    <option className={theme.option} value="ai_voice">
                      IA voz
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  className={`mb-1 block text-xs uppercase tracking-wider ${theme.textMuted}`}
                >
                  Notas
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={editingAppointment.notes || ""}
                  placeholder="Opcional..."
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${theme.input}`}
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm transition ${theme.buttonSecondary}`}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${theme.buttonPrimary}`}
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}