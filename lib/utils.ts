import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeUsername(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function slugify(value: string) {
  return normalizeUsername(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function formatCurrency(value: number, currency = "VND") {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export function getMessageParam(params: Record<string, string | string[] | undefined>, key: "success" | "error") {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}
