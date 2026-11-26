import BrandMark from './brand/BrandMark'

/** The opening screen: the flame in liquid chrome inside a glass orb (Spyda's splash). */
export default function RevivalSplash({ message = 'Gathering the flame', leaving = false }: { message?: string; leaving?: boolean }) {
  return (
    <div className={`theme-dark revival-splash ${leaving ? 'revival-splash--leaving' : ''}`} role="status" aria-live="polite">
      <div className="revival-splash__aurora revival-splash__aurora--rose" aria-hidden="true" />
      <div className="revival-splash__aurora revival-splash__aurora--ember" aria-hidden="true" />
      <div className="revival-splash__grain" aria-hidden="true" />

      <div className="revival-splash__stage">
        <div className="revival-splash__orb" aria-hidden="true">
          <div className="revival-splash__halo" />
          <div className="revival-splash__ring" />
          <div className="revival-splash__glass" />
          <div className="revival-splash__mark">
            <span className="flame-chrome" />
            <BrandMark animated fallback="none" tint="#ffc2d3" className="absolute inset-0 h-full w-full" />
          </div>
        </div>

        <p className="revival-splash__word">Revival One</p>
        <span className="revival-splash__message">{message}</span>
        <div className="revival-splash__track" aria-hidden="true"><i /></div>
      </div>
    </div>
  )
}
