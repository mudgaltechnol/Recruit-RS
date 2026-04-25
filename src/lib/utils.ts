import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupeeAmount(value: unknown) {
  const normalized = String(value ?? '')
    .replace(/\bRs\.?\s*/gi, '')
    .replace(/[₹$£€]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return '';
  }

  return `₹ ${normalized}`;
}
