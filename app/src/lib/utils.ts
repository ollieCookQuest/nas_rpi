import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number | bigint): string {
  const bytesNum = typeof bytes === 'bigint' ? Number(bytes) : bytes
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytesNum === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytesNum) / Math.log(1024))
  return Math.round(bytesNum / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateShareToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

