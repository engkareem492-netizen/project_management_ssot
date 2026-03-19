export const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar ($)" },
  { code: "EUR", label: "EUR — Euro (€)" },
  { code: "GBP", label: "GBP — British Pound (£)" },
  { code: "SAR", label: "SAR — Saudi Riyal (﷼)" },
  { code: "AED", label: "AED — UAE Dirham (د.إ)" },
  { code: "EGP", label: "EGP — Egyptian Pound (E£)" },
  { code: "KWD", label: "KWD — Kuwaiti Dinar (KD)" },
  { code: "QAR", label: "QAR — Qatari Riyal (QR)" },
  { code: "BHD", label: "BHD — Bahraini Dinar (BD)" },
  { code: "OMR", label: "OMR — Omani Rial (RO)" },
  { code: "JOD", label: "JOD — Jordanian Dinar (JD)" },
  { code: "CAD", label: "CAD — Canadian Dollar (CA$)" },
  { code: "AUD", label: "AUD — Australian Dollar (A$)" },
  { code: "JPY", label: "JPY — Japanese Yen (¥)" },
  { code: "CHF", label: "CHF — Swiss Franc (CHF)" },
  { code: "CNY", label: "CNY — Chinese Yuan (¥)" },
  { code: "INR", label: "INR — Indian Rupee (₹)" },
  { code: "TRY", label: "TRY — Turkish Lira (₺)" },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]["code"];
