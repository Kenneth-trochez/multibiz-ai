export type CurrencyConfig = {
  code: string;
  symbol: string;
  label: string;
};

export function getCurrencyByTimezone(timezone?: string | null): CurrencyConfig {
  const tz = timezone || "America/Tegucigalpa";

  if (tz === "Europe/Madrid") {
    return { code: "EUR", symbol: "€", label: "Euro" };
  }

  if (tz === "America/Mexico_City") {
    return { code: "MXN", symbol: "$", label: "Peso mexicano" };
  }

  if (tz === "America/Bogota") {
    return { code: "COP", symbol: "$", label: "Peso colombiano" };
  }

  if (tz === "America/New_York" || tz === "America/Los_Angeles") {
    return { code: "USD", symbol: "$", label: "Dólar estadounidense" };
  }

  return { code: "HNL", symbol: "L", label: "Lempira hondureño" };
}

export function formatMoneyByTimezone(
  value: number | string | null | undefined,
  timezone?: string | null
) {
  const currency = getCurrencyByTimezone(timezone);
  const amount = Number(value || 0);

  return `${currency.symbol} ${amount.toFixed(2)}`;
}
