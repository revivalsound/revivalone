import { NavLink } from 'react-router-dom'
import { HandHeart, Users } from '../ui/icons'

/** Switches between the two Community sections, each on its own page. */
export default function CommunityTabs() {
  return (
    <nav className="mt-6 inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] p-1" aria-label="Community sections">
      {([['/community/cells', 'Revival cells', Users], ['/community/prayer', 'Prayer wall', HandHeart]] as const).map(([to, label, Icon]) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `inline-flex h-10 items-center gap-2 rounded-full px-5 text-[13px] font-semibold transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(255,92,138,0.25)]' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Icon className="h-4 w-4" /> {label}
        </NavLink>
      ))}
    </nav>
  )
}
