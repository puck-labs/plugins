import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with clsx and merges Tailwind classes with tailwind-merge
 * This is the standard shadcn/ui pattern for handling className props
 *
 * @example
 * cn("px-4 py-2", "bg-blue-500", { "text-white": true }) // "px-4 py-2 bg-blue-500 text-white"
 * cn("px-4", "px-8") // "px-8" (tailwind-merge resolves conflicts)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
