/**
 * Shrinks a photo in the browser before it uploads, so phone pictures (often
 * 3–12 MB) fit the storage limits and load fast. Returns a JPEG or WebP file.
 */
export async function shrinkImage(file: File, { maxSize = 800, quality = 0.86, square = false } = {}): Promise<File> {
  if (file.type === 'image/gif') return file
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('This photo’s format can’t be read here. Try a JPG or PNG.')
  }
  // A square crop from the centre for avatars; otherwise keep the shape.
  const side = Math.min(bitmap.width, bitmap.height)
  const sx = square ? (bitmap.width - side) / 2 : 0
  const sy = square ? (bitmap.height - side) / 2 : 0
  const sw = square ? side : bitmap.width
  const sh = square ? side : bitmap.height
  const scale = Math.min(1, maxSize / Math.max(sw, sh))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(sw * scale)
  canvas.height = Math.round(sh * scale)
  const context = canvas.getContext('2d')
  if (!context) return file
  context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const type = canvas.toDataURL('image/webp').startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg'
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality))
  if (!blob) return file
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + (type === 'image/webp' ? '.webp' : '.jpg'), { type })
}
