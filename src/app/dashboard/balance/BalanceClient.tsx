"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  X,
  Download,
  Search,
  Lock,
} from "lucide-react";
import * as XLSX from "xlsx";
import { time } from "console";

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

type MetricCard = {
  title: string;
  value: string;
  subtitle: string;
  icon: "money" | "calendar" | "users" | "briefcase" | "sales";
};

type DayRevenue = {
  key: string;
  label: string;
  appointmentsRevenue: number;
  salesRevenue: number;
  totalRevenue: number;
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

type SaleRecord = {
  id: string;
  sale_at: string;
  subtotal: number;
  discount: number;
  total: number;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  staff: {
    id: string;
    display_name: string;
  } | null;
};

type SaleItemRecord = {
  id: string;
  sale_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  product: {
    id: string;
    name: string;
    sku: string | null;
  } | null;
};

function formatMoney(value: number) {
  return `L ${value.toFixed(2)}`;
}

function formatDateTime(dateStr: string, timezone: string) {
  return new Intl.DateTimeFormat("es-HN", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateStr));
}

function LockedFeatureCard({
  theme,
  title,
  description,
}: {
  theme: Theme;
  title: string;
  description: string;
}) {
  return (
    <div className={`rounded-3xl border p-6 shadow-sm ${theme.card}`}>
      <div className="flex items-start gap-4">
        <div className={`rounded-2xl border p-3 ${theme.cardSoft}`}>
          <Lock className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className={`mt-2 text-sm ${theme.textMuted}`}>{description}</p>
            </div>

            <a
              href="/dashboard/upgrade?feature=balance"
              className={`inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition ${theme.buttonPrimary}`}
            >
              Desbloquear
            </a>
          </div>

          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${theme.cardSoft}`}>
            Disponible en planes <span className="font-semibold">Bronze</span> y{" "}
            <span className="font-semibold">Premium</span>.
          </div>
        </div>
      </div>
    </div>
  );
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
  topProducts,
  maxProductRevenue,
  completedAppointments,
  sales,
  saleItems,
  customersCount,
  servicesCount,
  staffCount,
  productsCount,
  appointmentRevenue,
  salesRevenue,
  totalRevenue,
  canSeeAdvancedBalance,
  canExportBalance,
  timezone,
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
  topProducts: RankedItem[];
  maxProductRevenue: number;
  completedAppointments: CompletedAppointment[];
  sales: SaleRecord[];
  saleItems: SaleItemRecord[];
  customersCount: number;
  servicesCount: number;
  staffCount: number;
  productsCount: number;
  appointmentRevenue: number;
  salesRevenue: number;
  totalRevenue: number;
  canSeeAdvancedBalance: boolean;
  canExportBalance: boolean;
  timezone: string;
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

  const filteredAppointments = useMemo(() => {
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

  const filteredSales = useMemo(() => {
    const term = recordsSearch.trim().toLowerCase();
    if (!term) return sales;

    return sales.filter((sale) => {
      const customer = sale.customer?.name?.toLowerCase() || "";
      const staff = sale.staff?.display_name?.toLowerCase() || "";
      const phone = sale.customer?.phone?.toLowerCase() || "";
      const notes = sale.notes?.toLowerCase() || "";
      const id = sale.id.toLowerCase();

      return (
        customer.includes(term) ||
        staff.includes(term) ||
        phone.includes(term) ||
        notes.includes(term) ||
        id.includes(term)
      );
    });
  }, [sales, recordsSearch]);

  const filteredSaleItems = useMemo(() => {
    const visibleSaleIds = new Set(filteredSales.map((sale) => sale.id));
    return saleItems.filter((item) => visibleSaleIds.has(item.sale_id));
  }, [saleItems, filteredSales]);

  const canGoPrev = chartPage > 0;
  const canGoNext = chartPage < totalChartPages - 1;

  const exportRecords = () => {
    if (!canExportBalance) return;

    const summaryData = [
      {
        Periodo: rangeLabel,
        IngresosTotales: totalRevenue,
        IngresosCitas: appointmentRevenue,
        IngresosVentas: salesRevenue,
        ClientesRegistrados: customersCount,
        ServiciosConfigurados: servicesCount,
        StaffRegistrado: staffCount,
        ProductosRegistrados: productsCount,
        CitasCompletadas: completedAppointments.length,
        VentasRegistradas: sales.length,
      },
    ];

    const appointmentsData = filteredAppointments.map((apt) => ({
      Fecha: formatDateTime(apt.appointment_at, timezone),
      Cliente: apt.customer?.name || "Cliente no disponible",
      Staff: apt.staff?.display_name || "Sin asignar",
      Servicio: apt.service?.name || "Sin servicio",
      Teléfono: apt.customer?.phone || "Sin teléfono",
      Monto: Number(apt.service?.price || 0),
      Tipo: "Cita",
    }));

    const salesData = filteredSales.map((sale) => ({
      IDVenta: sale.id,
      Fecha: formatDateTime(sale.sale_at, timezone),
      Cliente: sale.customer?.name || "Sin cliente",
      Staff: sale.staff?.display_name || "Sin asignar",
      Teléfono: sale.customer?.phone || "Sin teléfono",
      Subtotal: Number(sale.subtotal || 0),
      Descuento: Number(sale.discount || 0),
      Total: Number(sale.total || 0),
      Notas: sale.notes || "",
      Tipo: "Venta",
    }));

    const saleItemsData = filteredSaleItems.map((item) => ({
      IDVenta: item.sale_id,
      Producto: item.product?.name || "Sin producto",
      SKU: item.product?.sku || "",
      Cantidad: Number(item.quantity || 0),
      PrecioUnitario: Number(item.unit_price || 0),
      TotalLinea: Number(item.line_total || 0),
    }));

    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary["!cols"] = [
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
    ];

    const wsAppointments = XLSX.utils.json_to_sheet(appointmentsData);
    wsAppointments["!cols"] = [
      { wch: 20 },
      { wch: 28 },
      { wch: 24 },
      { wch: 24 },
      { wch: 18 },
      { wch: 14 },
      { wch: 12 },
    ];

    const wsSales = XLSX.utils.json_to_sheet(salesData);
    wsSales["!cols"] = [
      { wch: 38 },
      { wch: 20 },
      { wch: 28 },
      { wch: 24 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 28 },
      { wch: 12 },
    ];

    const wsSaleItems = XLSX.utils.json_to_sheet(saleItemsData);
    wsSaleItems["!cols"] = [
      { wch: 38 },
      { wch: 28 },
      { wch: 18 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");
    XLSX.utils.book_append_sheet(wb, wsAppointments, "Citas");
    XLSX.utils.book_append_sheet(wb, wsSales, "Ventas");
    XLSX.utils.book_append_sheet(wb, wsSaleItems, "ItemsVenta");

    XLSX.writeFile(wb, `balance-consolidado-${currentMonthKey}.xlsx`);
  };

  return (
    <>
      <section className={`rounded-3xl border p-6 shadow-sm ${theme.card}`}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className={`text-sm ${theme.textMuted}`}>Balance del negocio</p>
            <h1 className="mt-1 text-3xl font-bold">Resumen financiero y operativo</h1>
            <p className={`mt-2 max-w-3xl text-sm ${theme.textMuted}`}>
              Consulta ingresos por citas y ventas, desempeño del staff,
              productos y registros detallados del período seleccionado.
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
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${theme.buttonPrimary}`}
            >
              <ReceiptText className="h-4 w-4" />
              Ver registros
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                Consolidado de citas completadas + ventas de {rangeLabel}.
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
                  <span className={theme.textMuted}>
                    {formatMoney(day.totalRevenue)} · Citas {formatMoney(day.appointmentsRevenue)} · Ventas {formatMoney(day.salesRevenue)}
                  </span>
                </div>
                <div className={`h-3 overflow-hidden rounded-full ${theme.subtle}`}>
                  <div
                    className={`h-full rounded-full ${theme.softAccent}`}
                    style={{
                      width: `${maxDailyRevenue > 0 ? (day.totalRevenue / maxDailyRevenue) * 100 : 0}%`,
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
                    className={`h-full rounded-full ${theme.softAccent}`}
                    style={{
                      width: `${maxStatus > 0 ? (item.value / maxStatus) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {canSeeAdvancedBalance ? (
        <>
          <section className="grid gap-6 xl:grid-cols-3">
            <div className={`rounded-3xl border p-6 shadow-sm ${theme.card}`}>
              <div className="mb-5">
                <h2 className="text-xl font-semibold">Servicios con más ingresos</h2>
                <p className={`text-sm ${theme.textMuted}`}>
                  Top por citas del período.
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
                          className={`h-full rounded-full ${theme.softAccent}`}
                          style={{
                            width: `${maxServiceRevenue > 0 ? (service.revenue / maxServiceRevenue) * 100 : 0}%`,
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
                  Según ingresos por citas del período.
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
                          className={`h-full rounded-full ${theme.softAccent}`}
                          style={{
                            width: `${maxStaffRevenue > 0 ? (member.revenue / maxStaffRevenue) * 100 : 0}%`,
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
                <h2 className="text-xl font-semibold">Productos con más ingresos</h2>
                <p className={`text-sm ${theme.textMuted}`}>
                  Top por ventas del período.
                </p>
              </div>

              {topProducts.length === 0 ? (
                <p className={theme.textMuted}>Aún no hay datos suficientes.</p>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product) => (
                    <div key={product.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{product.name}</span>
                        <span className={theme.textMuted}>
                          {formatMoney(product.revenue)} · {product.count} unidad(es)
                        </span>
                      </div>
                      <div className={`h-3 overflow-hidden rounded-full ${theme.subtle}`}>
                        <div
                          className={`h-full rounded-full ${theme.softAccent}`}
                          style={{
                            width: `${maxProductRevenue > 0 ? (product.revenue / maxProductRevenue) * 100 : 0}%`,
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
              <h2 className="text-xl font-semibold">Últimos registros del período</h2>
              <p className={`mt-1 text-sm ${theme.textMuted}`}>
                Vista rápida de citas completadas y ventas recientes.
              </p>

              <div className="mt-5 space-y-3">
                {completedAppointments.slice(0, 4).map((apt) => (
                  <div
                    key={`apt-${apt.id}`}
                    className={`rounded-2xl border p-4 ${theme.cardSoft}`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-semibold">
                          Cita · {apt.customer?.name || "Cliente no disponible"}
                        </p>
                        <div className={`mt-1 flex flex-wrap gap-3 text-sm ${theme.textMuted}`}>
                          <span>{apt.service?.name || "Sin servicio"}</span>
                          <span>{apt.staff?.display_name || "Sin staff"}</span>
                          <span>{formatDateTime(apt.appointment_at, timezone)}</span>
                        </div>
                      </div>

                      <div className="text-sm font-semibold">
                        {formatMoney(Number(apt.service?.price || 0))}
                      </div>
                    </div>
                  </div>
                ))}

                {sales.slice(0, 4).map((sale) => (
                  <div
                    key={`sale-${sale.id}`}
                    className={`rounded-2xl border p-4 ${theme.cardSoft}`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-semibold">
                          Venta · {sale.customer?.name || "Sin cliente"}
                        </p>
                        <div className={`mt-1 flex flex-wrap gap-3 text-sm ${theme.textMuted}`}>
                          <span>{sale.staff?.display_name || "Sin staff"}</span>
                          <span>{formatDateTime(sale.sale_at, timezone)}</span>
                          <span>Descuento: {formatMoney(Number(sale.discount || 0))}</span>
                        </div>
                      </div>

                      <div className="text-sm font-semibold">
                        {formatMoney(Number(sale.total || 0))}
                      </div>
                    </div>
                  </div>
                ))}

                {completedAppointments.length === 0 && sales.length === 0 && (
                  <div className={`rounded-2xl border p-6 ${theme.cardSoft}`}>
                    <p className={theme.textMuted}>Aún no hay movimientos en este período.</p>
                  </div>
                )}
              </div>
            </div>

            <div className={`rounded-3xl border p-6 shadow-sm ${theme.card}`}>
              <h2 className="text-xl font-semibold">Resumen general</h2>
              <div className="mt-5 space-y-3">
                {[
                  { label: "Clientes registrados", value: customersCount || 0 },
                  { label: "Servicios configurados", value: servicesCount || 0 },
                  { label: "Productos registrados", value: productsCount || 0 },
                  { label: "Miembros de staff", value: staffCount || 0 },
                  { label: "Ingresos por citas", value: formatMoney(appointmentRevenue) },
                  { label: "Ingresos por ventas", value: formatMoney(salesRevenue) },
                  { label: "Ingresos del período", value: formatMoney(totalRevenue) },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${theme.cardSoft}`}
                  >
                    <span className="text-sm">{item.label}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          <LockedFeatureCard
            theme={theme}
            title="Análisis de servicios, staff y productos"
            description="Aquí podrás ver cuáles servicios generan más ingresos, qué miembros del staff rinden mejor y qué productos venden más durante el período seleccionado."
          />

          <LockedFeatureCard
            theme={theme}
            title="Registros detallados y resumen ampliado"
            description="Esta sección te permite revisar movimientos recientes del período, consultar detalles operativos y acceder a un resumen más completo del negocio."
          />
        </>
      )}

      {showRecordsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRecordsModal(false)}
          />
          <div
            className={`relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border shadow-xl ${theme.glassCard}`}
          >
            <div className={`flex flex-col gap-4 border-b px-6 py-4 lg:flex-row lg:items-center lg:justify-between ${theme.headerBg}`}>
              <div>
                <h3 className="text-xl font-semibold">Registros del período</h3>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Citas completadas y ventas registradas en {rangeLabel}.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {canSeeAdvancedBalance ? (
                  <div
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${theme.input}`}
                  >
                    <Search className={`h-4 w-4 ${theme.textMuted}`} />
                    <input
                      value={recordsSearch}
                      onChange={(e) => setRecordsSearch(e.target.value)}
                      placeholder="Buscar cliente, staff, servicio, teléfono o ID..."
                      className="w-full bg-transparent text-sm outline-none placeholder:opacity-70"
                    />
                  </div>
                ) : null}

                {canExportBalance ? (
                  <button
                    type="button"
                    onClick={exportRecords}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${theme.buttonPrimary}`}
                  >
                    <Download className="h-4 w-4" />
                    Exportar a Excel
                  </button>
                ) : (
                  <div className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium opacity-80 ${theme.cardSoft}`}>
                    <Lock className="h-4 w-4" />
                    Excel bloqueado en Basic
                  </div>
                )}

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
              {canSeeAdvancedBalance ? (
                <div className="space-y-8">
                  <div>
                    <h4 className="mb-3 text-lg font-semibold">Citas completadas</h4>
                    {filteredAppointments.length === 0 ? (
                      <div className={`rounded-2xl border p-6 ${theme.cardSoft}`}>
                        <p className={theme.textMuted}>
                          No hay citas que coincidan con la búsqueda.
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
                          {filteredAppointments.map((apt) => (
                            <tr key={apt.id} className="border-t">
                              <td className="px-4 py-3 text-sm">
                                {formatDateTime(apt.appointment_at, timezone)}
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

                  <div>
                    <h4 className="mb-3 text-lg font-semibold">Ventas</h4>
                    {filteredSales.length === 0 ? (
                      <div className={`rounded-2xl border p-6 ${theme.cardSoft}`}>
                        <p className={theme.textMuted}>
                          No hay ventas que coincidan con la búsqueda.
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
                              Teléfono
                            </th>
                            <th className={`px-4 py-3 text-right text-xs uppercase tracking-wider ${theme.textMuted}`}>
                              Subtotal
                            </th>
                            <th className={`px-4 py-3 text-right text-xs uppercase tracking-wider ${theme.textMuted}`}>
                              Descuento
                            </th>
                            <th className={`px-4 py-3 text-right text-xs uppercase tracking-wider ${theme.textMuted}`}>
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSales.map((sale) => (
                            <tr key={sale.id} className="border-t">
                              <td className="px-4 py-3 text-sm">
                                {formatDateTime(sale.sale_at, timezone)}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium">
                                {sale.customer?.name || "Sin cliente"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {sale.staff?.display_name || "Sin asignar"}
                              </td>
                              <td className={`px-4 py-3 text-sm ${theme.textMuted}`}>
                                {sale.customer?.phone || "Sin teléfono"}
                              </td>
                              <td className="px-4 py-3 text-right text-sm">
                                {formatMoney(Number(sale.subtotal || 0))}
                              </td>
                              <td className="px-4 py-3 text-right text-sm">
                                {formatMoney(Number(sale.discount || 0))}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-semibold">
                                {formatMoney(Number(sale.total || 0))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`rounded-3xl border p-6 ${theme.cardSoft}`}>
                  <div className="flex items-start gap-4">
                    <div className={`rounded-2xl border p-3 ${theme.card}`}>
                      <Lock className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                      <h4 className="text-lg font-semibold">
                        Registros detallados bloqueados en Basic
                      </h4>
                      <p className={`mt-2 text-sm ${theme.textMuted}`}>
                        En Bronze y Premium podrás buscar citas y ventas del período,
                        revisar movimientos detallados y exportar la información a Excel.
                      </p>

                      <div className="mt-4">
                        <a
                          href="/dashboard/upgrade?feature=balance"
                          className={`inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition ${theme.buttonPrimary}`}
                        >
                          Mejorar plan
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}