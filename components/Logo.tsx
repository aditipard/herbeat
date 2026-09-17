/**
 * HerBeat mark — the orbital ribbons from the logo, redrawn as SVG so it
 * scales crisply and inherits the theme. Swap in the real asset later by
 * dropping it in /public and pointing this at it.
 */
export function Logo({ size = 32, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="hb-ribbon" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--violet-deep)" />
            <stop offset="55%" stopColor="var(--violet)" />
            <stop offset="100%" stopColor="var(--violet-light)" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#hb-ribbon)" strokeWidth="6" strokeLinecap="round">
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx="50"
              cy="50"
              rx="17"
              ry="38"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
        </g>
        <circle cx="50" cy="50" r="5" fill="var(--violet-deep)" />
      </svg>
      {withWordmark && (
        <span className="font-display text-[1.35rem] font-semibold tracking-tight text-ink">
          HerBeat
        </span>
      )}
    </span>
  );
}
