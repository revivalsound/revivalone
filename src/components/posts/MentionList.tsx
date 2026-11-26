import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Bible, User } from '../ui/icons'

export type MentionItem =
  | { kind: 'user'; id: string; label: string; avatar: string | null; detail: string }
  | { kind: 'verse'; id: string; label: string; detail: string }

export type MentionListHandle = { onKeyDown: (event: KeyboardEvent) => boolean }

/** The @ menu: Bible references first when the text looks like one, then people you follow. */
const MentionList = forwardRef<MentionListHandle, { items: MentionItem[]; command: (item: { id: string; label: string }) => void; query: string }>(
  function MentionList({ items, command, query }, ref) {
    const [active, setActive] = useState(0)
    useEffect(() => setActive(0), [items])

    const choose = (index: number) => {
      const item = items[index]
      if (item) command({ id: `${item.kind}:${item.id}`, label: item.label })
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: event => {
        if (!items.length) return false
        if (event.key === 'ArrowDown') { setActive(index => (index + 1) % items.length); return true }
        if (event.key === 'ArrowUp') { setActive(index => (index - 1 + items.length) % items.length); return true }
        if (event.key === 'Enter' || event.key === 'Tab') { choose(active); return true }
        return false
      },
    }), [items, active]) // eslint-disable-line react-hooks/exhaustive-deps

    const verses = items.filter(item => item.kind === 'verse')
    const people = items.filter(item => item.kind === 'user')

    return (
      <div className="select-menu w-[300px] overflow-hidden rounded-[20px] border border-white/[0.1] bg-surface-raised p-1.5 shadow-[0_22px_60px_rgba(0,0,0,0.45)]" role="listbox" aria-label="Mention">
        {!items.length && (
          <p className="px-3 py-3 text-xs text-muted-foreground">{query ? <>No matches for “{query}”. Try a book and chapter, like <b>John 3:16</b>, or the name of someone you follow.</> : <>Type a verse like <b>John 3:16</b> or the name of someone you follow.</>}</p>
        )}
        {[['Bible', verses], ['People you follow', people]].map(([title, group]) => (group as MentionItem[]).length > 0 && (
          <div key={title as string}>
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title as string}</p>
            {(group as MentionItem[]).map(item => {
              const index = items.indexOf(item)
              return (
                <button
                  key={`${item.kind}:${item.id}`}
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={event => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(index)}
                  className={`select-option flex w-full items-center gap-3 rounded-[14px] px-3 py-2 text-left transition-colors ${index === active ? 'bg-white/[0.07]' : ''}`}
                >
                  {item.kind === 'user'
                    ? <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#ff5c8a] to-[#e11d5c] text-primary-foreground">{item.avatar ? <img src={item.avatar} alt="" className="h-full w-full object-cover" /> : <User className="h-4 w-4" />}</span>
                    : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><Bible className="h-4 w-4" /></span>}
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[13px] font-semibold">{item.kind === 'user' ? `@${item.label}` : item.label}</b>
                    <small className="block truncate text-[11px] text-muted-foreground">{item.detail}</small>
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    )
  },
)

export default MentionList
