import DOMPurify from 'dompurify'

/** The only markup a post can carry: what the editor produces, nothing else. */
const ALLOWED_TAGS = ['p', 'br', 'h1', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'span', 'a', 'ul', 'ol', 'li', 'blockquote', 'hr', 'code']
const ALLOWED_ATTR = ['style', 'href', 'target', 'rel', 'data-color']
// Inline styles may only set these properties.
const ALLOWED_STYLES = /^(color|background-color|font-size|font-family|text-align)$/

DOMPurify.addHook('afterSanitizeAttributes', node => {
  if (node.tagName === 'A') {
    const href = node.getAttribute('href') ?? ''
    if (!/^(https?:|mailto:)/i.test(href)) node.removeAttribute('href')
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer nofollow')
  }
  const style = node.getAttribute('style')
  if (style !== null) {
    const kept = style.split(';').map(rule => rule.trim()).filter(rule => {
      const [property, ...value] = rule.split(':')
      return property && ALLOWED_STYLES.test(property.trim().toLowerCase()) && !/url\(|expression|javascript:/i.test(value.join(':'))
    })
    if (kept.length) node.setAttribute('style', kept.join('; '))
    else node.removeAttribute('style')
  }
})

export function sanitizePostHtml(html: string) {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}

/** Plain text → paragraphs, for prefilled drafts and older posts. */
export function textToHtml(text: string) {
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return text.split(/\n{2,}/).map(block => block.trim()).filter(Boolean).map(block => `<p>${escape(block).replace(/\n/g, '<br>')}</p>`).join('')
}
