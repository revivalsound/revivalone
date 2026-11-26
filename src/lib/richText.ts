import DOMPurify from 'dompurify'

/** The only markup a post can carry: what the editor produces, nothing else. */
const ALLOWED_TAGS = ['p', 'br', 'h1', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'span', 'a', 'ul', 'ol', 'li', 'blockquote', 'hr', 'code']
const ALLOWED_ATTR = ['style', 'href', 'target', 'rel', 'data-color', 'class', 'data-mention', 'data-mention-id']
// Inline styles may only set these properties.
const ALLOWED_STYLES = /^(color|background-color|font-size|font-family|text-align)$/

DOMPurify.addHook('afterSanitizeAttributes', node => {
  if (node.tagName === 'A') {
    const href = node.getAttribute('href') ?? ''
    const mention = node.getAttribute('data-mention')
    // Tagged people and Bible references link inside the app; everything else opens in a new tab.
    if (mention === 'user' || mention === 'verse') {
      if (!/^\/(u|bible)\/[\w/#.-]+$/.test(href)) node.removeAttribute('href')
      node.removeAttribute('target')
      node.setAttribute('class', 'mention')
    } else {
      node.removeAttribute('data-mention')
      node.removeAttribute('data-mention-id')
      node.removeAttribute('class')
      if (!/^(https?:|mailto:)/i.test(href)) node.removeAttribute('href')
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer nofollow')
    }
  } else {
    node.removeAttribute('class')
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

/**
 * A short preview of a formatted post for feed cards: plain text, but tagged
 * people and Bible references keep their pink highlight.
 */
export function excerptHtml(html: string, max = 260) {
  const doc = new DOMParser().parseFromString(sanitizePostHtml(html), 'text/html')
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  let out = ''
  let length = 0
  const walk = (node: Node) => {
    if (length >= max) return
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? '').replace(/\s+/g, ' ')
      const piece = text.slice(0, max - length)
      out += escape(piece); length += piece.length
      return
    }
    if (node instanceof HTMLElement) {
      if (node.dataset.mention) {
        out += `<span class="mention">${escape(node.textContent ?? '')}</span>`
        length += (node.textContent ?? '').length
        return
      }
      if (/^(P|H1|H2|H3|LI|BLOCKQUOTE|BR)$/.test(node.tagName) && out && !out.endsWith(' ')) { out += ' '; length += 1 }
      node.childNodes.forEach(walk)
    }
  }
  doc.body.childNodes.forEach(walk)
  return out.trim() + (length >= max ? '…' : '')
}
