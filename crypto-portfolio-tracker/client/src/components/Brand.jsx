export function LogoMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g fill="#000000" transform="rotate(-35 12 12)">
        <rect x="2.5" y="7.4" width="14" height="5.4" rx="2.7" />
        <rect x="7.5" y="13.2" width="14" height="5.4" rx="2.7" />
      </g>
    </svg>
  );
}

export function BrandMark({ label = 'Crypto Tracker' }) {
  return (
    <span className="brand">
      <LogoMark />
      <span className="brand-text">{label}</span>
    </span>
  );
}
