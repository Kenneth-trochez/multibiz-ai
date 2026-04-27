import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Users,
  Sparkles,
  BellRing,
  BarChart3,
  Bot,
} from "lucide-react";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";

export const metadata = {
  title: "Sistema para tiendas y ventas | MultiBiz AI",
  description:
    "Controla ventas, productos y clientes en tu tienda con multibiz AI",
};

export default function Page() {
  const theme = getThemeClasses("warm");

  const features = [
    { icon: CalendarDays, title: "Agenda de citas", text: "Organiza reservas por día, cliente y servicio." },
    { icon: Users, title: "Clientes", text: "Registra clientes y guarda historial." },
    { icon: Sparkles, title: "Servicios", text: "Administra tratamientos, precios y duración." },
    { icon: BellRing, title: "Notificaciones", text: "Recibe alertas de citas nuevas o cambios." },
    { icon: BarChart3, title: "Balance", text: "Consulta ingresos del negocio." },
    { icon: Bot, title: "IA", text: "Automatiza reservas con inteligencia artificial." },
  ];

  return (
    <main className={`min-h-screen px-4 py-10 ${theme.pageBg}`}>
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="mb-6 inline-flex gap-2">
          <ArrowLeft /> Volver
        </Link>

        <h1 className="text-4xl font-black">
          Software para tiendas con gestion de productos y balance final de mes.
        </h1>

        <p className="mt-4">
          MultiBiz AI permite administrar citas, clientes, servicios y ventas en un solo sistema.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="border p-4 rounded-2xl">
                <Icon />
                <h2 className="font-bold">{f.title}</h2>
                <p>{f.text}</p>
              </div>
            );
          })}
        </div>

        <Link href="/signup" className="mt-6 inline-block">
          Crear cuenta
        </Link>
      </div>
    </main>
  );
}