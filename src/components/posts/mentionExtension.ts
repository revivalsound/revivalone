import Mention from '@tiptap/extension-mention'
import { ReactRenderer } from '@tiptap/react'
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import MentionList, { type MentionItem, type MentionListHandle } from './MentionList'
import { mentionHref, peopleSuggestions, verseSuggestions } from '../../lib/mentions'

/**
 * "@" in the editor: suggest Bible references and people you follow. A chosen
 * item becomes a pink link: to the verse in the reader, or to the person's profile.
 */
export function mentionExtension(getUserId: () => string | undefined) {
  return Mention.configure({
    HTMLAttributes: { class: 'mention' },
    deleteTriggerWithBackspace: true,
    renderText: ({ node }) => (String(node.attrs.id ?? '').startsWith('user:') ? `@${node.attrs.label}` : String(node.attrs.label ?? '')),
    renderHTML: ({ node }) => {
      const id = String(node.attrs.id ?? '')
      const kind = id.startsWith('user:') ? 'user' : 'verse'
      return ['a', { href: mentionHref(id), class: 'mention', 'data-mention': kind, 'data-mention-id': id }, kind === 'user' ? `@${node.attrs.label}` : String(node.attrs.label ?? '')]
    },
    suggestion: {
      char: '@',
      allowSpaces: true,
      items: async ({ query }): Promise<MentionItem[]> => {
        const verses = verseSuggestions(query)
        const people = await peopleSuggestions(getUserId(), query)
        return [...verses, ...people].slice(0, 9)
      },
      render: () => {
        let component: ReactRenderer<MentionListHandle> | null = null
        let holder: HTMLDivElement | null = null

        const place = (props: SuggestionProps<MentionItem>) => {
          const rect = props.clientRect?.()
          if (!rect || !holder) return
          const width = 300
          const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
          const below = window.innerHeight - rect.bottom
          holder.style.left = `${left}px`
          if (below < 260 && rect.top > below) { holder.style.top = ''; holder.style.bottom = `${window.innerHeight - rect.top + 8}px` }
          else { holder.style.bottom = ''; holder.style.top = `${rect.bottom + 8}px` }
        }

        return {
          onStart: props => {
            component = new ReactRenderer(MentionList, { props: { items: props.items, command: props.command, query: props.query }, editor: props.editor })
            holder = document.createElement('div')
            holder.style.position = 'fixed'
            holder.style.zIndex = '80'
            holder.appendChild(component.element)
            document.body.appendChild(holder)
            place(props)
          },
          onUpdate: props => {
            component?.updateProps({ items: props.items, command: props.command, query: props.query })
            place(props)
          },
          onKeyDown: (props: SuggestionKeyDownProps) => {
            if (props.event.key === 'Escape') { holder?.remove(); return true }
            return component?.ref?.onKeyDown(props.event) ?? false
          },
          onExit: () => {
            holder?.remove()
            component?.destroy()
            holder = null
            component = null
          },
        }
      },
    },
  })
}
