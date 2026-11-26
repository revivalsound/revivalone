import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bible, CloudUpload, Loader, Play, Trash, X } from '../../components/ui/icons'
import { Notice, inputClass } from '../../components/ui/kit'
import RichEditor from '../../components/posts/RichEditor'
import { KIND_META, OPPORTUNITY_META } from '../../components/posts/PostCard'
import { useAuth } from '../../lib/AuthContext'
import { uploadMedia, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from '../../lib/community'
import { shrinkImage } from '../../lib/images'
import { createPost, MAX_POST_MEDIA, OPPORTUNITY_TYPES, parseTags, POST_KINDS, type OpportunityType, type PostKind } from '../../lib/posts'
import { sanitizePostHtml, textToHtml } from '../../lib/richText'
import { mentionedUsers } from '../../lib/mentions'

/** What another screen can prefill when it opens the editor (a shared verse, a journal entry). */
export type PostDraft = { kind?: PostKind; title?: string; body?: string; scripture?: string; tags?: string }

type Picked = { key: string; file: File; preview: string; type: 'image' | 'video' }

const PROMPTS: Record<PostKind, string> = {
  word: 'Share the word, what it means to you and how it can encourage someone today.',
  study: 'Walk through the passage, the context and what you are learning.',
  question: 'Give a little background so people can answer well.',
  opportunity: 'Who is it for, what does it involve, where is it and how do people respond?',
}

export default function CreatePost() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const draft = ((location.state as { draft?: PostDraft } | null)?.draft) ?? {}
  const [kind, setKind] = useState<PostKind>(draft.kind ?? 'word')
  const [opportunityType, setOpportunityType] = useState<OpportunityType>('job')
  const [title, setTitle] = useState(draft.title ?? '')
  const [content, setContent] = useState({ html: '', text: '' })
  const [scripture, setScripture] = useState(draft.scripture ?? '')
  const [tags, setTags] = useState(draft.tags ?? '')
  const [link, setLink] = useState('')
  const [media, setMedia] = useState<Picked[]>([])
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const [initialHtml] = useState(() => (draft.body ? textToHtml(draft.body) : ''))

  useEffect(() => () => media.forEach(item => URL.revokeObjectURL(item.preview)), []) // eslint-disable-line react-hooks/exhaustive-deps

  function addFiles(files: FileList | null) {
    if (!files) return
    setError('')
    const next: Picked[] = []
    for (const file of [...files]) {
      if (media.length + next.length >= MAX_POST_MEDIA) { setError(`A post can have up to ${MAX_POST_MEDIA} photos or videos.`); break }
      const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : null
      if (!type) { setError('Add photos (JPG, PNG, WebP, GIF) or videos (MP4, MOV, WebM).'); continue }
      if (type === 'video' && file.size > MAX_VIDEO_BYTES) { setError('Videos can be up to 50 MB.'); continue }
      next.push({ key: Math.random().toString(36).slice(2), file, preview: URL.createObjectURL(file), type })
    }
    setMedia(current => [...current, ...next])
  }

  function remove(key: string) {
    setMedia(current => {
      const item = current.find(entry => entry.key === key)
      if (item) URL.revokeObjectURL(item.preview)
      return current.filter(entry => entry.key !== key)
    })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    if (content.text.length < 10 && media.length === 0) { setError('Write a little more, or add a photo or video.'); return }
    if (link && !/^https?:\/\//i.test(link)) { setError('Links need to start with https://'); return }
    setError('')
    try {
      const uploaded = []
      for (const [index, item] of media.entries()) {
        setStatus(`Uploading ${item.type} ${index + 1} of ${media.length}…`)
        let file = item.file
        if (item.type === 'image' && file.type !== 'image/gif') file = await shrinkImage(file, { maxSize: 1800, quality: 0.85 })
        if (item.type === 'image' && file.size > MAX_IMAGE_BYTES) throw new Error('One of the photos is too large, even after shrinking.')
        const result = await uploadMedia(user.id, file)
        uploaded.push({ url: result.url, type: item.type })
      }
      setStatus('Publishing…')
      const post = await createPost({
        kind,
        opportunity_type: kind === 'opportunity' ? opportunityType : null,
        title: title.trim(),
        body: content.text,
        body_html: sanitizePostHtml(content.html),
        mentions: mentionedUsers(content.html),
        media: uploaded,
        scripture: scripture.trim(),
        link_url: kind === 'opportunity' ? link.trim() : '',
        tags: parseTags(tags),
      })
      navigate(`/post/${post.id}`, { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We couldn’t share your post. Try again.')
      setStatus('')
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</button>
        <button type="submit" disabled={Boolean(status)} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_12px_32px_rgba(255,92,138,0.28)] transition-all hover:-translate-y-0.5 disabled:opacity-60 lg:hidden">
          {status ? <Loader className="h-4 w-4 animate-spin" /> : <>Publish <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {/* Post type */}
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Post type">
            {POST_KINDS.map(option => {
              const meta = KIND_META[option]
              const active = option === kind
              return (
                <button key={option} type="button" role="radio" aria-checked={active} onClick={() => setKind(option)} className={`bolt-card inline-flex h-11 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-colors ${active ? 'bolt-card--on border-transparent bg-surface-raised' : 'border-white/[0.08] bg-surface text-muted-foreground hover:text-foreground'}`}>
                  <meta.icon className="h-4 w-4" style={{ color: meta.accent }} /> {meta.label}
                </button>
              )
            })}
          </div>
          {kind === 'opportunity' && (
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Opportunity type">
              {OPPORTUNITY_TYPES.map(type => {
                const meta = OPPORTUNITY_META[type]
                const active = type === opportunityType
                return <button key={type} type="button" role="radio" aria-checked={active} onClick={() => setOpportunityType(type)} className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors ${active ? 'border-[#ffd479]/50 bg-[#ffd479]/15 text-[#ffd479]' : 'border-white/[0.08] text-muted-foreground hover:text-foreground'}`}><meta.icon className="h-3.5 w-3.5" /> {meta.label}</button>
              })}
            </div>
          )}

          <textarea
            required
            rows={1}
            minLength={3}
            maxLength={140}
            value={title}
            onChange={event => setTitle(event.target.value.replace(/\n/g, ' '))}
            placeholder={kind === 'question' ? 'Ask your question' : 'Title'}
            aria-label="Title"
            className="w-full resize-none bg-transparent font-heading text-[2rem] font-semibold leading-[1.1] tracking-[-0.02em] outline-none [field-sizing:content] placeholder:text-muted-foreground/45 sm:text-[2.6rem]"
          />

          {/* Photos and videos */}
          <div>
            {media.length > 0 && (
              <div className={`grid gap-2 ${media.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                {media.map((item, index) => (
                  <div key={item.key} className={`group relative overflow-hidden rounded-[18px] border border-white/[0.08] bg-black ${media.length === 1 ? 'aspect-video' : 'aspect-square'}`}>
                    {item.type === 'image' ? <img src={item.preview} alt={`Attachment ${index + 1}`} className="h-full w-full object-cover" /> : <video src={item.preview} muted playsInline className="h-full w-full object-cover" />}
                    {item.type === 'video' && <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white"><Play className="h-3.5 w-3.5" /></span>}
                    <button type="button" onClick={() => remove(item.key)} aria-label="Remove" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-red-500/80"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
            {media.length < MAX_POST_MEDIA && (
              <button type="button" onClick={() => input.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addFiles(event.dataTransfer.files) }} className={`mt-2 flex w-full items-center gap-3 rounded-[18px] border border-dashed border-white/[0.14] px-4 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground ${media.length ? 'py-3' : 'py-6'}`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"><CloudUpload className="h-5 w-5" /></span>
                <span><b className="block font-semibold text-foreground">{media.length ? 'Add more' : 'Add photos or videos'}</b>Up to {MAX_POST_MEDIA} · drag them here or browse · videos up to 50 MB</span>
              </button>
            )}
            <input ref={input} type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime" className="sr-only" onChange={event => { addFiles(event.target.files); event.target.value = '' }} />
          </div>

          <RichEditor initialHtml={initialHtml} placeholder={PROMPTS[kind]} onChange={setContent} />
          <p className="-mt-2 flex items-center gap-1.5 px-1 text-xs text-muted-foreground"><span className="mention">@</span> Type @ to add a Bible reference, like <b className="font-semibold text-foreground/80">@John 3:16</b>, or to tag someone you follow.</p>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-20">
          <div className="rounded-[24px] border border-white/[0.07] bg-surface p-5">
            <label className="block text-xs font-medium text-foreground/90"><span className="flex items-center gap-1.5"><Bible className="h-3.5 w-3.5 text-primary" /> Scripture <span className="text-muted-foreground">(optional)</span></span><input maxLength={80} value={scripture} onChange={event => setScripture(event.target.value)} placeholder="Isaiah 40:31" className={`${inputClass} mt-2 px-4`} /></label>
            <label className="mt-4 block text-xs font-medium text-foreground/90">Topics <span className="text-muted-foreground">(up to 5)</span><input maxLength={120} value={tags} onChange={event => setTags(event.target.value)} placeholder="prayer, leadership" className={`${inputClass} mt-2 px-4`} /></label>
            {kind === 'opportunity' && <label className="mt-4 block text-xs font-medium text-foreground/90">Link to apply <span className="text-muted-foreground">(optional)</span><input type="url" maxLength={500} value={link} onChange={event => setLink(event.target.value)} placeholder="https://" className={`${inputClass} mt-2 px-4`} /></label>}
          </div>
          {error && <Notice tone="error">{error}</Notice>}
          <button type="submit" disabled={Boolean(status)} className="hidden h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_12px_32px_rgba(255,92,138,0.28)] transition-all hover:-translate-y-0.5 disabled:opacity-60 lg:inline-flex">
            {status ? <><Loader className="h-4 w-4 animate-spin" /> {status}</> : <>Publish post <ArrowRight className="h-4 w-4" /></>}
          </button>
          {status && <p className="text-center text-xs text-muted-foreground lg:hidden">{status}</p>}
          <p className="text-center text-[11px] text-muted-foreground">Posts appear in the Home feed and on your profile. <Link to={user ? `/u/${user.id}` : '/home'} className="text-primary">See yours</Link></p>
          {media.length > 0 && <button type="button" onClick={() => setMedia([])} className="mx-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><Trash className="h-3.5 w-3.5" /> Remove all media</button>}
        </aside>
      </div>
    </form>
  )
}
