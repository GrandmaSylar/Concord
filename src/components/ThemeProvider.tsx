'use client'

import { ReactNode, useEffect } from 'react'
import type { SystemSettings } from '@/app/actions/settings'

function isPurpleOrIndigo(hex: string): boolean {
  if (!hex) return false
  let c = hex.replace('#', '').trim()
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]
  }
  if (c.length !== 6) return false
  
  const r = parseInt(c.substring(0, 2), 16) / 255
  const g = parseInt(c.substring(2, 4), 16) / 255
  const b = parseInt(c.substring(4, 6), 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  
  if (max !== min) {
    const d = max - min
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h = h * 60
  }
  
  // Hue between 235 and 335 corresponds to indigo, purple, and magenta/pink
  return h >= 235 && h <= 335
}

function sanitizeColor(colorHex: string, fallback: string): string {
  if (isPurpleOrIndigo(colorHex)) {
    return fallback
  }
  return colorHex
}

export default function ThemeProvider({ 
  children, 
  settings 
}: { 
  children: ReactNode, 
  settings: SystemSettings | null 
}) {
  useEffect(() => {
    if (settings) {
      document.documentElement.style.setProperty('--color-primary', settings.primary_color)
      document.documentElement.style.setProperty('--color-secondary', settings.secondary_color)
    }
  }, [settings])

  const primary = settings?.primary_color || '#2563eb'
  const secondary = settings?.secondary_color || '#4f46e5'

  const safePrimary = sanitizeColor(primary, '#2563eb')
  const safeSecondary = sanitizeColor(secondary, '#38bdf8') // Fallback to sky-400 if purple/indigo

  return (
    <>
      {/* Global CSS Variable Injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --theme-primary: ${settings?.primary_color || '#2563eb'};
            --theme-secondary: ${settings?.secondary_color || '#4f46e5'};
            --theme-watermark: url('${settings?.watermark_url || ''}');
            --theme-watermark-opacity: ${settings?.watermark_opacity ?? 0.03};
            --theme-login-bg: url('${settings?.login_bg_url || ''}');
            
            /* Safe colors for logo / text gradients to avoid purple */
            --theme-sms-color-1: ${safePrimary};
            --theme-sms-color-2: ${safeSecondary};
          }
          
          /* Utility classes we can use anywhere */
          .bg-theme-primary { background-color: var(--theme-primary) !important; }
          .text-theme-primary { color: var(--theme-primary) !important; }
          .border-theme-primary { border-color: var(--theme-primary) !important; }
          .ring-theme-primary { --tw-ring-color: var(--theme-primary) !important; }
          
          .bg-theme-secondary { background-color: var(--theme-secondary) !important; }
          .text-theme-secondary { color: var(--theme-secondary) !important; }
          
          /* Dynamic gradient text without purple */
          .text-theme-sms-gradient {
            background-image: linear-gradient(to right, var(--theme-sms-color-1), var(--theme-sms-color-2)) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            display: inline-block;
          }
        `
      }} />
      {children}
    </>
  )
}

