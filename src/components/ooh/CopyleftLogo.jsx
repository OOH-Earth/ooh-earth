export default function CopyleftLogo({ className = '' }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      aria-hidden
      style={{ filter: 'drop-shadow(0 0 4px rgba(237,255,0,0.45))' }}
    >
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 11 a 7 7 0 1 1 0 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
