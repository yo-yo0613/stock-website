import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      colors: [],
    },
  },
})
