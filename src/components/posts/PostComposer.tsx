import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader, PenNew, X } from '../ui/icons'
import { Notice, inputClass } from '../ui/kit'
import { useAuth } from '../../lib/AuthContext'
import { createPost, OPPORTUNITY_TYPES, parseTags, POST_KINDS, type OpportunityType, type Post, type PostKind } from '../../lib/posts'
import { KIND_META, OPPORTUNITY_META } from './PostCard'

const PROMPTS: Record<PostKind, { title: string; body: string }> = {
  word: { title: 'What is God speaking to you?', body: 'Share the word, what it means to you and how it can encourage someone today.' },
  study: { title: 'What are you studying?', body: 'Walk through the passage, the context and what you are learning.' },
  question: { title: 'What would you like to ask?', body: 'Give a little background so people can answer well.' },
  opportunity: { title: 'Name the opportunity', body: 'Who is it for, what does it involve, where is it and how do people respond?' },
}

export type ComposerDraft = { kind?: PostKind; title?: string; body?: string; scripture?: string; tags?: string }

export default function PostComposer({ onClose, onPosted, initial }: { onClose: () => void; onPosted: (post: Post) => void; initial?: ComposerDraft }) {
  const { session } = useAuth()
  const dialog = useRef<HTMLDialogElement>(null)
  const [kind, setKind] = useState<PostKind>(initial?.kind ?? 'word')
  const [opportunityType, setOpportunityType] = useState<OpportunityType>('job')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { dialog.current?.showModal() }, [])
  const close = () => { if (!saving) dialog.current?.close() }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const form = new FormData(event.currentTarget)
    const field = (name: string) => String(form.get(name) ?? '').trim()
    const link = field('link_url')
    if (link && !/^https?:\/\//i.test(link)) { setError('Links need to start with https://'); return }
    setSaving(true)
    setError('')
    try {
      const post = await createPost({
        kind,
        opportunity_type: kind === 'opportunity' ? opportunityType : null,
        title: field('title'),
        body: field('body'),
        scripture: field('scripture'),
        link_url: kind === 'opportunity' ? link : '',
        tags: parseTags(field('tags')),
      })
      onPosted(post)
      dialog.current?.close()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We couldn’t share your post. Try again.')
      setSaving(false)
    }
  }

  const prompt = PROMPTS[kind]

  return (
    <dialog ref={dialog} className="revival-dialog" aria-labelledby="composer-title" onClose={onClose} onCancel={event => { if (saving) event.preventDefault() }}>
      <div className="dialog-in fixed inset-x-0 bottom-0 m-auto max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[28px] border glass glass-strong p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:inset-0 sm:h-fit sm:rounded-[28px] sm:p-7">
        <button type="button" onClick={close} disabled={saving} aria-label="Close" className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground">
          <X className="h-4 w-4" />
        </button>

        {!session ? (
          <div className="py-4 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><PenNew className="h-6 w-6" /></span>
            <h2 id="composer-title" className="mt-5 font-heading text-2xl font-semibold">Sign in to post</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">Share a word, a study, a question or an opportunity with the community.</p>
            <Link to="/auth?next=/home" onClick={close} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90">Sign in <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">New post</p>
            <h2 id="composer-title" className="mt-2 pr-10 font-heading text-2xl font-semibold">{prompt.title}</h2>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Post type">
              {POST_KINDS.map(option => {
                const meta = KIND_META[option]
                const active = option === kind
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setKind(option)}
                    className={`bolt-card flex flex-col items-start gap-2 rounded-[16px] border p-3 text-left transition-colors ${active ? 'bolt-card--on border-transparent bg-surface-raised' : 'border-white/[0.07] bg-surface hover:bg-surface-raised'}`}
                  >
                    <meta.icon className="h-5 w-5" style={{ color: meta.accent }} />
                    <span className="font-heading text-[13px] font-semibold">{meta.label}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{KIND_META[kind].copy}.</p>

            {kind === 'opportunity' && (
              <div className="mt-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Opportunity type">
                {OPPORTUNITY_TYPES.map(type => {
                  const meta = OPPORTUNITY_META[type]
                  const active = type === opportunityType
                  return (
                    <button key={type} type="button" role="radio" aria-checked={active} onClick={() => setOpportunityType(type)} className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${active ? 'border-[#ffd479]/50 bg-[#ffd479]/15 text-[#ffd479]' : 'border-white/[0.08] text-muted-foreground hover:text-foreground'}`}>
                      <meta.icon className="h-3.5 w-3.5" /> {meta.label}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <label className="block text-xs font-medium text-foreground/90">Title<input required name="title" defaultValue={initial?.title} minLength={3} maxLength={140} placeholder={kind === 'question' ? 'Ask in one line' : 'Give it a title'} className={`${inputClass} mt-2 px-4`} /></label>
              <label className="block text-xs font-medium text-foreground/90">{kind === 'question' ? 'Details' : 'Your post'}<textarea required name="body" defaultValue={initial?.body} minLength={10} maxLength={10000} rows={7} placeholder={prompt.body} className={`${inputClass} mt-2 h-auto px-4 py-3 leading-6`} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-medium text-foreground/90">Scripture <span className="text-muted-foreground">(optional)</span><input name="scripture" defaultValue={initial?.scripture} maxLength={80} placeholder="Isaiah 40:31" className={`${inputClass} mt-2 px-4`} /></label>
                <label className="block text-xs font-medium text-foreground/90">Topics <span className="text-muted-foreground">(up to 5)</span><input name="tags" defaultValue={initial?.tags} maxLength={120} placeholder="prayer, leadership" className={`${inputClass} mt-2 px-4`} /></label>
              </div>
              {kind === 'opportunity' && (
                <label className="block text-xs font-medium text-foreground/90">Link to apply or learn more <span className="text-muted-foreground">(optional)</span><input name="link_url" type="url" maxLength={500} placeholder="https://" className={`${inputClass} mt-2 px-4`} /></label>
              )}
            </div>

            {error && <div className="mt-4"><Notice tone="error">{error}</Notice></div>}
            <button type="submit" disabled={saving} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60">
              {saving ? <><Loader className="h-4 w-4 animate-spin" /> Posting…</> : <>Share post <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        )}
      </div>
    </dialog>
  )
}
