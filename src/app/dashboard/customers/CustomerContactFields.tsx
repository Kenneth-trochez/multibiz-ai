"use client";

import { useEffect, useState } from "react";

type Theme = {
  input: string;
  label: string;
  textMuted: string;
};

function formatPhoneByTimezone(value: string, timezone: string) {
  let raw = value.trim();

  if (timezone === "America/Tegucigalpa") {
    let digits = raw.replace(/\D/g, "");

    if (digits.startsWith("504")) {
      digits = digits.slice(3);
    }

    digits = digits.slice(0, 8);

    if (!digits) return "";
    if (digits.length <= 4) return `+504 ${digits}`;

    return `+504 ${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  if (!raw) return "";

  if (raw.startsWith("+")) {
    raw = `+${raw.slice(1).replace(/\D/g, "").slice(0, 15)}`;
  } else {
    raw = `+${raw.replace(/\D/g, "").slice(0, 15)}`;
  }

  return raw;
}

function getPhoneUiConfig(timezone: string) {
  if (timezone === "America/Tegucigalpa") {
    return {
      placeholder: "+504 9856-6789",
      pattern: "^\\+504 \\d{4}-\\d{4}$",
      title: "Usa un número de Honduras con formato +504 9856-6789",
      helpText: "Formato Honduras: +504 9856-6789",
    };
  }

  return {
    placeholder: "+34123456789",
    pattern: "^\\+[1-9]\\d{7,14}$",
    title: "Usa un número internacional con formato +34123456789",
    helpText: "Formato internacional: + código de país + número",
  };
}

export default function CustomerContactFields({
  theme,
  timezone,
  initialPhone = "",
  initialEmail = "",
}: {
  theme: Theme;
  timezone: string;
  initialPhone?: string;
  initialEmail?: string;
}) {
  const [phone, setPhone] = useState(formatPhoneByTimezone(initialPhone, timezone));
  const [email, setEmail] = useState(initialEmail);

  useEffect(() => {
    setPhone(formatPhoneByTimezone(initialPhone, timezone));
  }, [initialPhone, timezone]);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const phoneUi = getPhoneUiConfig(timezone);

  return (
    <>
      <div>
        <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
          Teléfono
        </label>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhoneByTimezone(e.target.value, timezone))}
          placeholder={phoneUi.placeholder}
          pattern={phoneUi.pattern}
          title={phoneUi.title}
          className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
        />
        <p className={`mt-1 text-xs ${theme.textMuted}`}>
          {phoneUi.helpText}
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