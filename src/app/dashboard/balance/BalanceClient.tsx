"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  X,
  Download,
  Search,
} from "lucide-react";
import * as XLSX from "xlsx";

type Theme = {
  pageBg: string;
  card: string;
  subtle: string;
  textMuted: string;
  accent: string;
  buttonSecondary: string;
};

type MetricCard = {
  title: string;
  value: string;
  subtitle: string;
  icon: "money" | "calendar" | "users" | "briefcase";
};

type DayRevenue = {
  key: string;
  label: string;
  revenue: number;
};

type RankedItem = {
  name: string;
  count: number;
  revenue: number;
};

type CompletedAppointment = {
  id: string;
  appointment_at: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  service: {
    id: string;
    name: string;
    price: number | null;
  } | null;
  staff: {
    id: string;
    display_name: string;
  } | null;
};

function formatMoney(value: number) {
  return `L ${value.toFixed(2)}`;
}

function formatDateTime(dateStr: string) {
  return new Intl.DateTimeFormat("es-HN", {
    timeZone: "America/Tegucigalpa",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateStr));
}

export default function BalanceClient({
  theme,
  rangeLabel,
  currentMonthKey,
  prevMonth,
  nextMonth,
  metricCards,
  dailyRevenue,
  maxDailyRevenue,
  statusCounts,
  maxStatus,
  topServices,
  maxServiceRevenue,
  topStaff,
  maxStaffRevenue,
  completedAppointments,
  customersCount,
  servicesCount,
  staffCount,
  totalRevenue,
}: {
  theme: Theme;
  rangeLabel: string;
  currentMonthKey: string;
  prevMonth: string;
  nextMonth: string;
  metricCards: MetricCard[];
  dailyRevenue: DayRevenue[];
  maxDailyRevenue: number;
  statusCounts: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  maxStatus: number;
  topServices: RankedItem[];
  maxServiceRevenue: number;
  topStaff: RankedItem[];
  maxStaffRevenue: number;
  completedAppointments: CompletedAppointment[];
  customersCount: number;
  servicesCount: number;
  staffCount: number;
  totalRevenue: number;
}) {
  const [chartPage, setChartPage] = useState(0);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [recordsSearch, setRecordsSearch] = useState("");

  const pageSize = 5;
  const totalChartPages = Math.max(1, Math.ceil(dailyRevenue.length / pageSize));

  const visibleDays = useMemo(() => {
    const start = chartPage * pageSize;
    return dailyRevenue.slice(start, start + pageSize);
  }, [chartPage, dailyRevenue]);

  const filteredRecords = useMemo(() => {
    const term = recordsSearch.trim().toLowerCase();

    if (!term) return completedAppointments;

    return completedAppointments.filter((apt) => {
      const customer = apt.customer?.name?.toLowerCase() || "";
      const staff = apt.staff?.display_name?.toLowerCase() || "";
      const service = apt.service?.name?.toLowerCase() || "";
      const phone = apt.customer?.phone?.toLowerCase() || "";

      return (
        customer.includes(term) ||
        staff.includes(term) ||
        service.includes(term) ||
        phone.includes(term)
      );
    });
  }, [completedAppointments, recordsSearch]);

  const canGoPrev = chartPage > 0;
  const canGoNext = chartPage < totalChartPages - 1;

  const exportRecords = () => {
    const data = filteredRecords.map((apt) => ({
      Fecha: formatDateTime(apt.appointment_at),
      Cliente: apt.customer?.name || "Cliente no disponible",
      Staff: apt.staff?.display_name || "Sin asignar",
      Servicio: apt.service?.name || "Sin servicio",
      Teléfono: apt.customer?.phone || "Sin teléfono",
      Monto: Number(apt.service?.price || 0),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    ws["!cols"] = [
      { wch: 20 },
      { wch: 28 },
      { wch: 24 },
      { wch: 24 },
      { wch: 18 },
      { wch: 14 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Balance");

    XLSX.writeFile(wb, `balance-${currentMonthKey}.xlsx`);
  };

  return (
    <>
      <section className={`rounded-3xl border p-6 shadow-sm ${theme.card}`}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className={`text-sm ${theme.textMuted}`}>Balance del negocio</p>
            <h1 className="mt-1 text-3xl font-bold">Resumen financiero y operativo</h1>
            <p className={`mt-2 max-w-3xl text-sm ${theme.textMuted}`}>
              Consulta ingresos, rendimiento de servicios, desempeño del staff y
              registros detallados del período seleccionado.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={`/dashboard/balance?month=${prevMonth}`}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${theme.buttonSecondary}`}
            >
              <ChevronLeft className="h-4 w-4" />
              Mes anterior
            </a>

            <div className={`rounded-2xl px-4 py-2.5 text-sm font-semibold ${theme.accent}`}>
              {rangeLabel}
            </div>

            <a
              href={`/dashboard/balance?month=${nextMonth}`}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${theme.buttonSecondary}`}
            >
              Mes siguiente
              <ChevronRight className="h-4 w-4" />
            </a>

            <a
              href={`/dashboard/balance`}
              className={`inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${theme.buttonSecondary}`}
            >
              Mes actual
            </a>

            <button
              type="button"
              onClick={() => setShowRecordsModal(true)}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${theme.accent}`}
            >
              <ReceiptText className="h-4 w-4" />
              Ver registros
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((item) => (
          <div
            key={item.title}
            className={`rounded-3xl border p-5 shadow-sm ${theme.card}`}
          >
            <p className={`text-sm ${theme.textMuted}`}>{item.title}</p>
            <p className="mt-2 text-3xl font-bold">{item.value}</p>
            <p className={`mt-1 text-xs ${theme.textMuted}`}>{item.subtitle}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={`rounded-3xl border p-6 shadow-sm ${theme.card}`}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Ingresos diarios del período</h2>
              <p className={`mt-1 text-sm ${theme.textMuted}`}>
                Basado solo en citas completadas de {rangeLabel}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => canGoPrev && setChartPage((prev) => prev - 1)}
                disabled={!canGoPrev}
                className={`rounded-xl border px-3 py-2 text-sm transition ${
                  canGoPrev ? theme.buttonSecondary : "pointer-events-none opacity-50"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className={`text-sm ${theme.textMuted}`}>
                {chartPage + 1} / {totalChartPages}
              </span>

              <button
                type="button"
                onClick={() => canGoNext && setChartPage((prev) => prev + 1)}
                disabled={!canGoNext}
                className={`rounded-xl border px-3 py-2 text-sm transition ${
                  canGoNext ? theme.buttonSecondary : "pointer-events-none opacity-50"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {visibleDays.map((day) => (
              <div key={day.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>Día {day.label}</span>
                  <span className={theme.textMuted}>{formatMoney(day.revenue)}</span>
                </div>
                <div className={`h-3 overflow-hidden rounded-full ${theme.subtle}`}>
                  <div
                    className={`h-full rounded-full ${theme.accent}`}
                    style={{
                      width: `${(day.revenue / maxDailyRevenue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-3xl border p-6 shadow-sm ${theme.card}`}>
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Estados del período</h2>
            <p className={`mt-1 text-sm ${theme.textMuted}`}>
              Distribución de citas dentro del mes filtrado.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { label: "Pendientes", value: statusCounts.pending },
              { label: "Confirmadas", value: statusCounts.confirmed },
              { label: "Completadas", value: statusCounts.completed },
              { label: "Canceladas", value: statusCounts.cancelled },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className={theme.textMuted}>{item.value}</span>
                </div>
                <div className={`h-3 overflow-hidden rounded-full ${theme.subtle}`}>
                  <div
                    className={`h-full rounded-full ${theme.accent}`}
                    style={{
                      width: `${(item.value / maxStatus) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={`rounded-3xl border p-6 shadow-sm ${theme.card}`}>
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Servicios con más ingresos</h2>
            <p className={`text-sm ${theme.textMuted}`}>
              Top del período seleccionado.
            </p>
          </div>

          {topServices.length === 0 ? (
            <p className={theme.textMuted}>Aún no hay datos suficientes.</p>
          ) : (
            <div className="space-y-4">
              {topServices.map((service) => (
                <div key={service.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{service.name}</span>
                    <span className={theme.textMuted}>
                      {formatMoney(service.revenue)} · {service.count} cita(s)
                    </span>
                  </div>
                  <div className={`h-3 overflow-hidden rounded-full ${theme.subtle}`}>
                    <div
                      className={`h-full rounded-full ${theme.accent}`}
                      style={{
                        width: `${(service.revenue / maxServiceRevenue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`rounded-3xl border p-6 shadow-sm ${theme.card}`}>
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Staff con mejor rendimiento</h2>
            <p className={`text-sm ${theme.textMuted}`}>
              Según ingresos del período.
            </p>
          </div>

          {topStaff.length === 0 ? (
            <p className={theme.textMuted}>Aún no hay datos suficientes.</p>
          ) : (
            <div className="space-y-4">
              {topStaff.map((member) => (
                <div key={member.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{member.name}</span>
                    <span className={theme.textMuted}>
                      {formatMoney(member.revenue)} · {member.count} cita(s)
                    </span>
                  </div>
                  <div className={`h-3 overflow-hidden rounded-full ${theme.subtle}`}>
                    <div
                      className={`h-full rounded-full ${theme.accent}`}
                      style={{
                        width: `${(member.revenue / maxStaffRevenue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className={`rounded-3xl border p-6 shadow-sm ${theme.card}`}>
          <h2 className="text-xl font-semibold">Últimos registros completados</h2>
          <p className={`mt-1 text-sm ${theme.textMuted}`}>
            Vista rápida de las operaciones recientes dentro del rango.
          </p>

          {completedAppointments.length === 0 ? (
            <div className={`mt-5 rounded-2xl border p-6 ${theme.subtle}`}>
              <p className={theme.textMuted}>Aún no hay citas completadas.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {completedAppointments.slice(0, 8).map((apt) => (
                <div
                  key={apt.id}
                  className={`rounded-2xl border p-4 ${theme.subtle}`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold">
                        {apt.customer?.name || "Cliente no disponible"}
                      </p>
                      <div className={`mt-1 flex flex-wrap gap-3 text-sm ${theme.textMuted}`}>
                        <span>{apt.service?.name || "Sin servicio"}</span>
                        <span>{apt.staff?.display_name || "Sin staff"}</span>
                        <span>{formatDateTime(apt.appointment_at)}</span>
                      </div>
                    </div>

                    <div className="text-sm font-semibold">
                      {formatMoney(Number(apt.service?.price || 0))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`rounded-3xl border p-6 shadow-sm ${theme.card}`}>
          <h2 className="text-xl font-semibold">Resumen general</h2>
          <div className="mt-5 space-y-3">
            {[
              { label: "Clientes registrados", value: customersCount || 0 },
              { label: "Servicios configurados", value: servicesCount || 0 },
              { label: "Miembros de staff", value: staffCount || 0 },
              { label: "Ingresos del período", value: formatMoney(totalRevenue) },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${theme.subtle}`}
              >
                <span className="text-sm">{item.label}</span>
                <span className="text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showRecordsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRecordsModal(false)}
          />
          <div className={`relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border shadow-xl ${theme.card}`}>
            <div className="flex flex-col gap-4 border-b px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-semibold">Registros del período</h3>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Citas completadas en {rangeLabel} con cliente, staff y monto.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div
                  className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${theme.subtle}`}
                >
                  <Search className={`h-4 w-4 ${theme.textMuted}`} />
                  <input
                    value={recordsSearch}
                    onChange={(e) => setRecordsSearch(e.target.value)}
                    placeholder="Buscar cliente, staff, servicio o teléfono..."
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={exportRecords}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${theme.accent}`}
                >
                  <Download className="h-4 w-4" />
                  Exportar a Excel
                </button>

                <button
                  type="button"
                  onClick={() => setShowRecordsModal(false)}
                  className={`rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${theme.buttonSecondary}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-auto p-6">
              {filteredRecords.length === 0 ? (
                <div className={`rounded-2xl border p-6 ${theme.subtle}`}>
                  <p className={theme.textMuted}>
                    No hay registros que coincidan con la búsqueda.
                  </p>
                </div>
              ) : (
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className={`px-4 py-3 text-left text-xs uppercase tracking-wider ${theme.textMuted}`}>
                        Fecha
                      </th>
                      <th className={`px-4 py-3 text-left text-xs uppercase tracking-wider ${theme.textMuted}`}>
                        Cliente
                      </th>
                      <th className={`px-4 py-3 text-left text-xs uppercase tracking-wider ${theme.textMuted}`}>
                        Staff
                      </th>
                      <th className={`px-4 py-3 text-left text-xs uppercase tracking-wider ${theme.textMuted}`}>
                        Servicio
                      </th>
                      <th className={`px-4 py-3 text-left text-xs uppercase tracking-wider ${theme.textMuted}`}>
                        Teléfono
                      </th>
                      <th className={`px-4 py-3 text-right text-xs uppercase tracking-wider ${theme.textMuted}`}>
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((apt) => (
                      <tr key={apt.id} className="border-t">
                        <td className="px-4 py-3 text-sm">
                          {formatDateTime(apt.appointment_at)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {apt.customer?.name || "Cliente no disponible"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {apt.staff?.display_name || "Sin asignar"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {apt.service?.name || "Sin servicio"}
                        </td>
                        <td className={`px-4 py-3 text-sm ${theme.textMuted}`}>
                          {apt.customer?.phone || "Sin teléfono"}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold">
                          {formatMoney(Number(apt.service?.price || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}