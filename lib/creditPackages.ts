export const CREDIT_PACKAGES = [
  { key: "c5", credits: 5, price: "5.00" },
  { key: "c10", credits: 10, price: "9.50" },
  { key: "c15", credits: 15, price: "13.50" },
  { key: "c20", credits: 20, price: "17.00" },
  { key: "c25", credits: 25, price: "20.00" },
] as const;

export type CreditPackage = (typeof CREDIT_PACKAGES)[number];

export function findCreditPackage(key: unknown) {
  return CREDIT_PACKAGES.find((p) => p.key === key) || null;
}
