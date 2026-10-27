/** FieldCall mark: a field lens over a leaf on a forest tile, with an orange survey tag. */
export function BrandMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} role="img" aria-label="FieldCall">
      <rect width="32" height="32" rx="8" fill="#1F3B2D" />
      <circle cx="14" cy="14" r="7.6" fill="#EEF1E8" />
      <path d="M10.2 17.4c0-5 3.4-7.6 7.8-7.6 0 4.6-2.8 7.8-7.8 7.6Z" fill="#3D7A4E" />
      <path d="M10.2 17.4 15.6 12" stroke="#EEF1E8" strokeWidth="1" strokeLinecap="round" />
      <path d="m19.6 19.6 5.6 5.6" stroke="#EEF1E8" strokeWidth="3" strokeLinecap="round" />
      <path d="M19.8 3.4h7.6v4.6h-7.6l1.6-2.3Z" fill="#E8662C" />
    </svg>
  );
}
