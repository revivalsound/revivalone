/**
 * Revival One's icon set: Solar, line-duotone, drawn from the SVGs in Font/ —
 * the same library and wrapper Spyda uses.
 *
 * The markup lives in solar-icons.generated.ts, built by
 * scripts/build-solar-icons.mjs (`npm run icons`); add new icons there, not
 * here by hand. strokeWidth 2.2+ draws the same glyph with a heavier line.
 */
import { forwardRef, type ComponentType, type SVGProps } from 'react'
import { SOLAR_ICONS, type SolarIconName } from './solar-icons.generated'

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'ref' | 'children' | 'dangerouslySetInnerHTML'> & {
  size?: number | string
  /** 2.2 and up draws a heavier line. */
  strokeWidth?: number | string
}

export type Icon = ComponentType<IconProps>

function icon(name: SolarIconName) {
  const markup = { __html: SOLAR_ICONS[name] }
  const Wrapped = forwardRef<SVGSVGElement, IconProps>(function RevivalIcon({ strokeWidth, size = 24, className, ...rest }, ref) {
    const classes = ['solar-icon', Number(strokeWidth) >= 2.2 && 'solar-icon--bold', className].filter(Boolean).join(' ')
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden={rest['aria-label'] ? undefined : true}
        focusable="false"
        {...rest}
        className={classes}
        dangerouslySetInnerHTML={markup}
      />
    )
  })
  Wrapped.displayName = name
  return Wrapped
}

// ── exports (generated) ──
export const AlertTriangle = icon('AlertTriangle')
export const ArrowDown = icon('ArrowDown')
export const ArrowLeft = icon('ArrowLeft')
export const ArrowRight = icon('ArrowRight')
export const ArrowUpRight = icon('ArrowUpRight')
export const Bell = icon('Bell')
export const Bible = icon('Bible')
export const BookOpen = icon('BookOpen')
export const Bookmark = icon('Bookmark')
export const Bolt = icon('Bolt')
export const CalendarAdd = icon('CalendarAdd')
export const CalendarDays = icon('CalendarDays')
export const CalendarMark = icon('CalendarMark')
export const Camera = icon('Camera')
export const Chat = icon('Chat')
export const Check = icon('Check')
export const CheckCircle = icon('CheckCircle')
export const ChevronDown = icon('ChevronDown')
export const ChevronLeft = icon('ChevronLeft')
export const ChevronRight = icon('ChevronRight')
export const Clock = icon('Clock')
export const Compass = icon('Compass')
export const Copy = icon('Copy')
export const Cup = icon('Cup')
export const Eye = icon('Eye')
export const EyeOff = icon('EyeOff')
export const ExternalLink = icon('ExternalLink')
export const Fire = icon('Fire')
export const FireSquare = icon('FireSquare')
export const Gift = icon('Gift')
export const Globe = icon('Globe')
export const GraduationCap = icon('GraduationCap')
export const HandHeart = icon('HandHeart')
export const HandShake = icon('HandShake')
export const HandStars = icon('HandStars')
export const Heart = icon('Heart')
export const HeartShine = icon('HeartShine')
export const Hearts = icon('Hearts')
export const History = icon('History')
export const Home = icon('Home')
export const Library = icon('Library')
export const Lightbulb = icon('Lightbulb')
export const Link = icon('Link')
export const Loader = icon('Loader')
export const Lock = icon('Lock')
export const LogOut = icon('LogOut')
export const Mail = icon('Mail')
export const MapPin = icon('MapPin')
export const MapPinWave = icon('MapPinWave')
export const Medal = icon('Medal')
export const Mic = icon('Mic')
export const MusicNote = icon('MusicNote')
export const PanelLeft = icon('PanelLeft')
export const PeopleNearby = icon('PeopleNearby')
export const Pen = icon('Pen')
export const Play = icon('Play')
export const Plus = icon('Plus')
export const PlusCircle = icon('PlusCircle')
export const RefreshCw = icon('RefreshCw')
export const Search = icon('Search')
export const Settings = icon('Settings')
export const Share = icon('Share')
export const ShieldCheck = icon('ShieldCheck')
export const Sparkles = icon('Sparkles')
export const Star = icon('Star')
export const Sun = icon('Sun')
export const Sunrise = icon('Sunrise')
export const Target = icon('Target')
export const Upload = icon('Upload')
export const User = icon('User')
export const UserHands = icon('UserHands')
export const UserHandUp = icon('UserHandUp')
export const Users = icon('Users')
export const Video = icon('Video')
export const Widget = icon('Widget')
export const X = icon('X')
export const Zap = icon('Zap')
export const Briefcase = icon('Briefcase')
export const Question = icon('Question')
export const Notebook = icon('Notebook')
export const PenNew = icon('PenNew')
export const Trash = icon('Trash')
export const HandMoney = icon('HandMoney')
export const GraphUp = icon('GraphUp')
export const EndCall = icon('EndCall')
export const Headphones = icon('Headphones')
export const Pause = icon('Pause')
export const PlayCircle = icon('PlayCircle')
export const PauseCircle = icon('PauseCircle')
export const Back15 = icon('Back15')
export const Forward15 = icon('Forward15')
export const SkipNext = icon('SkipNext')
export const SkipPrevious = icon('SkipPrevious')
export const Hourglass = icon('Hourglass')
export const UserPlus = icon('UserPlus')
export const Volume = icon('Volume')
export const Playlist = icon('Playlist')
export const LockKeyhole = icon('LockKeyhole')
export const GalleryAdd = icon('GalleryAdd')
export const VideoFrame = icon('VideoFrame')
export const CloudUpload = icon('CloudUpload')
export const Moon = icon('Moon')
