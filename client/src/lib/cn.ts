import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merges conditional classes, letting a caller override a utility cleanly. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
