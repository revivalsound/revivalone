import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from './icons'

export type SelectOption<T extends string> = { value: T; label: string; description?: string; icon?: ReactNode; preview?: React.CSSProperties }

type Props<T extends string> = {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  label: string
  /** Visible text before the value, e.g. "Narrator". Defaults to just the value. */
  prefix?: string
  size?: 'sm' | 'md'
  className?: string
  menuWidth?: number
  /** Keep the text selection in an editor while the menu is used. */
  keepFocus?: boolean
}

type Place = { left: number; top: number; width: number; up: boolean; maxHeight: number }

/**
 * Revival One's dropdown: replaces the device's native picker with a menu that
 * opens from its button with a short spring, fits the screen, and works with
 * the keyboard (arrows, Home/End, Enter, Escape, type to jump).
 */
export default function Select<T extends string>({ value, options, onChange, label, prefix, size = 'md', className = '', menuWidth, keepFocus = false }: Props<T>) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [place, setPlace] = useState<Place | null>(null)
  const button = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const typed = useRef({ text: '', at: 0 })
  const id = useId()
  const current = options.find(option => option.value === value) ?? options[0]

  const measure = useCallback(() => {
    const rect = button.current?.getBoundingClientRect()
    if (!rect) return
    const width = Math.max(rect.width, menuWidth ?? 0, 180)
    const gap = 8
    const below = window.innerHeight - rect.bottom - gap * 2
    const above = rect.top - gap * 2
    const wanted = Math.min(options.length * 52 + 12, 360)
    const up = below < Math.min(wanted, 220) && above > below
    const left = Math.min(Math.max(gap, rect.left), window.innerWidth - width - gap)
    setPlace({ left, width, up, top: up ? rect.top - gap : rect.bottom + gap, maxHeight: Math.max(140, Math.min(wanted, up ? above : below)) })
  }, [menuWidth, options.length])

  const openMenu = () => {
    setActive(Math.max(0, options.findIndex(option => option.value === value)))
    measure()
    setOpen(true)
  }

  const choose = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    setOpen(false)
    if (!keepFocus) button.current?.focus()
  }

  useLayoutEffect(() => { if (open) measure() }, [open, measure])

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (!menu.current?.contains(target) && !button.current?.contains(target)) setOpen(false)
    }
    const reposition = () => measure()
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close, { passive: true })
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [open, measure])

  // Keep the highlighted option in view.
  useEffect(() => {
    if (open) menu.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  function onKey(event: React.KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); openMenu() }
      return
    }
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return }
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(index => Math.min(options.length - 1, index + 1)) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(index => Math.max(0, index - 1)) }
    else if (event.key === 'Home') { event.preventDefault(); setActive(0) }
    else if (event.key === 'End') { event.preventDefault(); setActive(options.length - 1) }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(active) }
    else if (event.key === 'Tab') setOpen(false)
    else if (event.key.length === 1) {
      const now = Date.now()
      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : '') + event.key.toLowerCase(), at: now }
      const match = options.findIndex(option => option.label.toLowerCase().startsWith(typed.current.text))
      if (match >= 0) setActive(match)
    }
  }

  const sizes = size === 'sm' ? 'h-9 rounded-xl px-2.5 text-xs gap-1.5' : 'h-11 rounded-full px-4 text-[13px] gap-2'

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onMouseDown={keepFocus ? event => event.preventDefault() : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKey}
        className={`inline-flex items-center justify-between border border-white/[0.09] bg-white/[0.04] font-semibold text-foreground transition-colors hover:bg-white/[0.08] ${open ? 'border-primary/50 bg-white/[0.08]' : ''} ${sizes} ${className}`}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {current?.icon}
          {prefix && <span className="text-muted-foreground">{prefix}</span>}
          <span className="truncate" style={current?.preview}>{current?.label}</span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {open && place && createPortal(
        <div
          ref={menu}
          id={id}
          role="listbox"
          aria-label={label}
          aria-activedescendant={`${id}-${active}`}
          tabIndex={-1}
          onKeyDown={onKey}
          onMouseDown={keepFocus ? event => event.preventDefault() : undefined}
          style={{ left: place.left, width: place.width, maxHeight: place.maxHeight, ...(place.up ? { bottom: window.innerHeight - place.top } : { top: place.top }) }}
          className={`select-menu ${place.up ? 'select-menu--up' : ''} fixed z-[70] overflow-y-auto overscroll-contain rounded-[20px] border border-white/[0.1] bg-surface-raised p-1.5 shadow-[0_22px_60px_rgba(0,0,0,0.45)]`}
        >
          {options.map((option, index) => {
            const selected = option.value === value
            return (
              <div
                key={option.value}
                id={`${id}-${index}`}
                data-index={index}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={`select-option flex cursor-pointer items-center gap-3 rounded-[14px] px-3 py-2.5 text-[13px] transition-colors ${index === active ? 'bg-white/[0.07]' : ''} ${selected ? 'text-foreground' : 'text-foreground/85'}`}
                style={{ animationDelay: `${Math.min(index, 8) * 18}ms` }}
              >
                {option.icon && <span className="shrink-0 text-primary">{option.icon}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold" style={option.preview}>{option.label}</span>
                  {option.description && <span className="block truncate text-[11px] text-muted-foreground">{option.description}</span>}
                </span>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${selected ? 'scale-100 bg-primary text-primary-foreground' : 'scale-50 opacity-0'}`}><Check className="h-3 w-3" strokeWidth={2.6} /></span>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </>
  )
}
