import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiUrl() {
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL || 'http://backend:3000';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

export function getSocketUrl() {
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL || 'http://backend:3000';
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
}
