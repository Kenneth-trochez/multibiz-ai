"use client";

import { useEffect, useState } from "react";

type Theme = {
  input: string;
  label: string;
  textMuted: string;
};

function formatHondurasPhone(value: string) {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("504")) {
    digits = digits.slice(3);
  }

  digits = digits.slice(0, 8);

  if (!digits) return "";
  if (digits.length <= 4) return `+504 ${digits}`;

  return `+504 ${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export default function CustomerContactFields({
  theme,
  initialPhone = "",
  initialEmail = "",
}: {
  theme: Theme;
  initialPhone?: string;
  initialEmail?: string;
}) {
  const [phone, setPhone] = useState(formatHondurasPhone(initialPhone));
  const [email, setEmail] = useState(initialEmail);

  useEffect(() => {
    setPhone(formatHondurasPhone(initialPhone));
  }, [initialPhone]);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  return (
    <>
      <div>
        <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
          Teléfono
        </label>
        <input
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(formatHondurasPhone(e.target.value))}
          placeholder="+504 9856-6789"
          pattern="^\+504 \d{4}-\d{4}$"
          title="Usa un número de Honduras con formato +504 9856-6789"
          className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
        />
        <p className={`mt-1 text-xs ${theme.textMuted}`}>
          Formato Honduras: +504 9856-6789
        </p>
      </div>

      <div>
        <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
          Correo
        </label>
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmail((prev) => prev.trim().toLowerCase())}
          placeholder="cliente@correo.com"
          className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
        />
      </div>
    </>
  );
}