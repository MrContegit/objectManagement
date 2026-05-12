import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiUrl() {
  const url = typeof window === 'undefined' 
    ? (process.env.INTERNAL_API_URL || 'http://backend:3000')
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
  return url.replace(/\/$/, '');
}

export function getSocketUrl() {
  const url = typeof window === 'undefined'
    ? (process.env.INTERNAL_API_URL || 'http://backend:3000')
    : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');
  return url.replace(/\/$/, '');
}

