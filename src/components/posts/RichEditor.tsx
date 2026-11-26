import { useEffect, useRef, useState, type ReactNode } from 'react'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Color, FontFamily, FontSize, TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { Placeholder } from '@tiptap/extension-placeholder'
import { ChevronDown, Link as LinkIcon } from '../ui/icons'
import Select from '../ui/Select'

export const TEXT_COLORS = [
  { name: 'Default', value: '' },
  { name: 'Flame pink', value: '#ff5c8a' },
  { name: 'Ember', value: '#ffb36b' },
  { name: 'Gold', value: '#ffd479' },
  { name: 'Lilac', value: '#d7b8ff' },
  { name: 'Sky', value: '#8fd3ff' },
  { name: 'Mint', value: '#8ff0c4' },
  { name: 'Soft white', value: '#f7eeea' },
  { name: 'Muted', value: '#a1939a' },
]

const HIGHLIGHTS = [
  { name: 'Pink', value: 'rgba(255, 92, 138, 0.3)' },
  { name: 'Gold', value: 'rgba(255, 212, 121, 0.3)' },
  { name: 'Lilac', value: 'rgba(215, 184, 255, 0.28)' },
  { name: 'Sky', value: 'rgba(143, 211, 255, 0.26)' },
]

const FONTS = [
  { name: 'Sans', value: '' },
  { name: 'Serif', value: 'Literata, Georgia, serif' },
  { name: 'Display', value: '"Space Grotesk", Montserrat, sans-serif' },
]

const SIZES = [
  { name: 'Small', value: '14px' },
  { name: 'Normal', value: '' },
  { name: 'Large', value: '21px' },
  { name: 'Huge', value: '28px' },
]

type Props = { initialHtml?: string; placeholder?: string; onChange: (value: { html: string; text: string }) => void }

/** The post editor: headings, fonts, sizes, bold, italic, underline, colour, highlight, lists, quotes, alignment and links. */
export default function RichEditor({ initialHtml = '', placeholder = 'Write your post…', onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false, autolink: true, protocols: ['https', 'mailto'] }, code: false, codeBlock: false }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialHtml,
    editorProps: { attributes: { class: 'rich-text min-h-[280px] px-5 py-4 outline-none sm:px-6', 'aria-label': 'Post text' } },
    onUpdate: ({ editor: instance }) => onChange({ html: instance.isEmpty ? '' : instance.getHTML(), text: instance.getText({ blockSeparator: '\n\n' }).trim() }),
    immediatelyRender: true,
  })

  // Report the starting content (e.g. a shared verse) once.
  useEffect(() => {
    if (editor && initialHtml) onChange({ html: editor.getHTML(), text: editor.getText({ blockSeparator: '\n\n' }).trim() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  if (!editor) return null
  return (
    <div className="rounded-[22px] border border-white/[0.09] bg-white/[0.02] transition-colors focus-within:border-primary/45">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      block: instance.isActive('heading', { level: 1 }) ? 'h1' : instance.isActive('heading', { level: 2 }) ? 'h2' : instance.isActive('heading', { level: 3 }) ? 'h3' : 'p',
      bold: instance.isActive('bold'),
      italic: instance.isActive('italic'),
      underline: instance.isActive('underline'),
      strike: instance.isActive('strike'),
      bullet: instance.isActive('bulletList'),
      ordered: instance.isActive('orderedList'),
      quote: instance.isActive('blockquote'),
      link: instance.isActive('link'),
      color: (instance.getAttributes('textStyle').color as string | undefined) ?? '',
      font: (instance.getAttributes('textStyle').fontFamily as string | undefined) ?? '',
      size: (instance.getAttributes('textStyle').fontSize as string | undefined) ?? '',
      align: (['center', 'right'] as const).find(value => instance.isActive({ textAlign: value })) ?? 'left',
      canUndo: instance.can().undo(),
      canRedo: instance.can().redo(),
    }),
  })
  const chain = () => editor.chain().focus()

  function setLink() {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link address (https://…)', previous ?? 'https://')
    if (url === null) return
    if (!url || url === 'https://') { chain().extendMarkRange('link').unsetLink().run(); return }
    if (!/^(https?:\/\/|mailto:)/i.test(url)) return
    chain().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="sticky top-14 z-10 flex flex-wrap items-center gap-1 rounded-t-[21px] border-b border-white/[0.07] bg-surface-raised p-2" role="toolbar" aria-label="Formatting">
      <Select
        size="sm"
        keepFocus
        label="Text style"
        value={state.block}
        onChange={value => (value === 'p' ? chain().setParagraph().run() : chain().toggleHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 }).run())}
        menuWidth={200}
        options={[
          { value: 'p', label: 'Paragraph', description: 'Body text' },
          { value: 'h1', label: 'Heading 1', description: 'Large title', preview: { fontFamily: '"Space Grotesk", sans-serif', fontSize: 17 } },
          { value: 'h2', label: 'Heading 2', description: 'Section title', preview: { fontFamily: '"Space Grotesk", sans-serif', fontSize: 15 } },
          { value: 'h3', label: 'Heading 3', description: 'Small heading', preview: { fontFamily: '"Space Grotesk", sans-serif', color: 'rgb(var(--primary-soft))' } },
        ]}
      />
      <Select size="sm" keepFocus label="Font" value={state.font} onChange={value => (value ? chain().setFontFamily(value).run() : chain().unsetFontFamily().run())} options={FONTS.map(font => ({ value: font.value, label: font.name, preview: font.value ? { fontFamily: font.value } : undefined }))} />
      <Select size="sm" keepFocus label="Text size" value={state.size} onChange={value => (value ? chain().setFontSize(value).run() : chain().unsetFontSize().run())} options={SIZES.map(size => ({ value: size.value, label: size.name, description: size.value || '17px' }))} />
      <Divider />
      <Tool label="Bold (Ctrl+B)" active={state.bold} onClick={() => chain().toggleBold().run()}><b className="font-heading text-sm">B</b></Tool>
      <Tool label="Italic (Ctrl+I)" active={state.italic} onClick={() => chain().toggleItalic().run()}><i className="font-scripture text-sm">I</i></Tool>
      <Tool label="Underline (Ctrl+U)" active={state.underline} onClick={() => chain().toggleUnderline().run()}><span className="text-sm underline underline-offset-2">U</span></Tool>
      <Tool label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()}><span className="text-sm line-through">S</span></Tool>
      <Palette
        label="Text colour"
        swatch={state.color || '#f7eeea'}
        options={TEXT_COLORS}
        onPick={value => (value ? chain().setColor(value).run() : chain().unsetColor().run())}
        icon={<span className="font-heading text-sm font-bold" style={{ color: state.color || undefined }}>A</span>}
      />
      <Palette
        label="Highlight"
        swatch={HIGHLIGHTS[0].value}
        options={[{ name: 'None', value: '' }, ...HIGHLIGHTS]}
        onPick={value => (value ? chain().setHighlight({ color: value }).run() : chain().unsetHighlight().run())}
        icon={<span className="rounded px-1 font-heading text-[11px] font-bold" style={{ background: HIGHLIGHTS[1].value }}>H</span>}
      />
      <Divider />
      <Tool label="Bulleted list" active={state.bullet} onClick={() => chain().toggleBulletList().run()}><ListGlyph /></Tool>
      <Tool label="Numbered list" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}><span className="font-heading text-[11px] font-bold">1.</span></Tool>
      <Tool label="Quote" active={state.quote} onClick={() => chain().toggleBlockquote().run()}><span className="font-scripture text-lg leading-none">“</span></Tool>
      <Tool label="Divider line" onClick={() => chain().setHorizontalRule().run()}><span className="h-[2px] w-4 rounded bg-current" /></Tool>
      <Divider />
      {(['left', 'center', 'right'] as const).map(align => (
        <Tool key={align} label={`Align ${align}`} active={state.align === align} onClick={() => chain().setTextAlign(align).run()}><AlignGlyph align={align} /></Tool>
      ))}
      <Tool label="Link" active={state.link} onClick={setLink}><LinkIcon className="h-4 w-4" /></Tool>
      <Divider />
      <Tool label="Undo" disabled={!state.canUndo} onClick={() => chain().undo().run()}><span className="text-sm">↶</span></Tool>
      <Tool label="Redo" disabled={!state.canRedo} onClick={() => chain().redo().run()}><span className="text-sm">↷</span></Tool>
    </div>
  )
}

function Tool({ label, active = false, disabled = false, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled} onMouseDown={event => event.preventDefault()} onClick={onClick} className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 transition-colors disabled:opacity-30 ${active ? 'bg-primary text-primary-foreground' : 'text-foreground/85 hover:bg-white/[0.07]'}`}>
      {children}
    </button>
  )
}

function Palette({ label, swatch, options, onPick, icon }: { label: string; swatch: string; options: { name: string; value: string }[]; onPick: (value: string) => void; icon: ReactNode }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return (
    <div ref={root} className="relative">
      <button type="button" title={label} aria-label={label} aria-expanded={open} onMouseDown={event => event.preventDefault()} onClick={() => setOpen(value => !value)} className="flex h-9 items-center gap-0.5 rounded-xl px-2 text-foreground/85 hover:bg-white/[0.07]">
        <span className="flex flex-col items-center">{icon}<span className="mt-0.5 h-[3px] w-4 rounded-full" style={{ background: swatch }} /></span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 top-11 z-20 grid w-44 grid-cols-5 gap-1.5 rounded-2xl border border-white/[0.1] bg-surface-raised p-2.5 shadow-[0_18px_40px_rgba(0,0,0,0.5)]">
          {options.map(option => (
            <button key={option.name} type="button" title={option.name} aria-label={option.name} onMouseDown={event => event.preventDefault()} onClick={() => { onPick(option.value); setOpen(false) }} className="h-7 w-7 rounded-full border border-white/15 transition-transform hover:scale-110" style={{ background: option.value || 'linear-gradient(135deg, transparent 45%, #ff5c8a 46%, #ff5c8a 54%, transparent 55%)' }} />
          ))}
        </div>
      )}
    </div>
  )
}

function Divider() {
  return <span className="mx-0.5 h-6 w-px bg-white/[0.08]" aria-hidden />
}

function ListGlyph() {
  return <span className="flex flex-col gap-[3px]">{[0, 1, 2].map(row => <span key={row} className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-current" /><span className="h-[2px] w-3 rounded bg-current" /></span>)}</span>
}

function AlignGlyph({ align }: { align: 'left' | 'center' | 'right' }) {
  const widths = [14, 9, 12]
  return <span className={`flex w-[14px] flex-col gap-[3px] ${align === 'center' ? 'items-center' : align === 'right' ? 'items-end' : 'items-start'}`}>{widths.map((width, row) => <span key={row} className="h-[2px] rounded bg-current" style={{ width }} />)}</span>
}
