/** Non-destructive edits live alongside the original file in posts.media. */
export type MediaEdit = {
  width: number; height: number; rotation: number; aspect: number | null
  zoom: number; x: number; y: number; brightness: number; contrast: number
  start?: number; end?: number; muted?: boolean
}

export function defaultMediaEdit(width: number, height: number): MediaEdit {
  return { width, height, rotation: 0, aspect: null, zoom: 1, x: 0, y: 0, brightness: 100, contrast: 100 }
}

export function mediaGeometry(edit: MediaEdit) {
  const rotated = Math.abs(edit.rotation % 180) === 90
  const width = Math.max(1, edit.width), height = Math.max(1, edit.height)
  const rw = rotated ? height : width, rh = rotated ? width : height
  const aspect = edit.aspect && edit.aspect > 0 ? edit.aspect : rw / rh
  const scale = Math.max(aspect / rw, 1 / rh) * Math.max(1, Math.min(3, edit.zoom))
  return {
    aspect,
    width: `${width * scale / aspect * 100}%`,
    height: `${height * scale * 100}%`,
    left: `${50 - Math.max(0, rw * scale - aspect) / aspect * Math.max(-1, Math.min(1, edit.x)) * 50}%`,
    top: `${50 - Math.max(0, rh * scale - 1) * Math.max(-1, Math.min(1, edit.y)) * 50}%`,
  }
}
