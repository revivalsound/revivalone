import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light'
const KEY = 'revival.theme'

type ThemeValue = { theme: Theme; setTheme: (theme: Theme) => void; toggle: () => void }
const ThemeContext = createContext<ThemeValue>({ theme: 'dark', setTheme: () => undefined, toggle: () => undefined })

/** The theme index.html applied before React loaded (saved choice, else the device setting). */
function current(): Theme {
  return document.documentElement.classList.contains('light') ? 'light' : 'dark'
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('light', theme === 'light')
  root.classList.toggle('dark', theme === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#faf6f4' : '#070405')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(current)

  const setTheme = useCallback((next: Theme) => {
    // A short cross-fade so the switch feels deliberate rather than a flash.
    document.documentElement.classList.add('theme-switching')
    applyTheme(next)
    setThemeState(next)
    try { window.localStorage.setItem(KEY, next) } catch { /* storage unavailable */ }
    window.setTimeout(() => document.documentElement.classList.remove('theme-switching'), 320)
  }, [])

  // Follow the device setting until the member picks a theme themselves.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => {
      let saved: string | null = null
      try { saved = window.localStorage.getItem(KEY) } catch { /* storage unavailable */ }
      if (!saved) { const next: Theme = media.matches ? 'light' : 'dark'; applyTheme(next); setThemeState(next) }
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return <ThemeContext.Provider value={{ theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
