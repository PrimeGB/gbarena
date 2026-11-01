export const CREDIT_PACKAGES = [
  { key: "c5", credits: 5, price: "2.00" },
  { key: "c10", credits: 10, price: "3.50" },
  { key: "c15", credits: 15, price: "5.00" },
  { key: "c20", credits: 20, price: "6.50" },
  { key: "c25", credits: 25, price: "8.00" },
] as const;

export type CreditPackage = (typeof CREDIT_PACKAGES)[number];

export function findCreditPackage(key: unknown) {
  return CREDIT_PACKAGES.find((p) => p.key === key) || null;
}
