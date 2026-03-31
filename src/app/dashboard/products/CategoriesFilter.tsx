import Link from "next/link";

type CategoryRow = {
  id: string;
  name: string;
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

export default function CategoriesFilter({
  categories,
  selectedCategory,
  theme,
}: {
  categories: CategoryRow[];
  selectedCategory: string;
  theme: Theme;
}) {
  return (
    <section className={`rounded-2xl border p-4 shadow-sm ${theme.card}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Filtrar por categoría</h2>
          <p className={`mt-1 text-sm ${theme.textMuted}`}>
            Explora el catálogo según la categoría seleccionada.
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        <Link
          href="/dashboard/products"
          className={`min-w-[150px] rounded-2xl border px-4 py-4 text-left shadow-sm transition ${
            !selectedCategory ? theme.buttonPrimary : theme.cardSoft
          }`}
        >
          <p className="text-sm font-semibold">Todas</p>
          <p
            className={`mt-1 text-xs ${
              !selectedCategory ? "text-white/80" : theme.textMuted
            }`}
          >
            Ver todos los productos
          </p>
        </Link>

        {categories.map((category) => {
          const isActive = selectedCategory === category.id;

          return (
            <Link
              key={category.id}
              href={`/dashboard/products?category=${category.id}`}
              className={`min-w-[170px] rounded-2xl border px-4 py-4 text-left shadow-sm transition ${
                isActive ? theme.buttonPrimary : theme.cardSoft
              }`}
            >
              <p className="text-sm font-semibold">{category.name}</p>
              <p
                className={`mt-1 text-xs ${
                  isActive ? "text-white/80" : theme.textMuted
                }`}
              >
                Filtrar por esta categoría
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}   