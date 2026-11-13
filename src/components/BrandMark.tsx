// ABOUTME: The hexagon-D brand mark as inline SVG, drawn in currentColor only.
// ABOUTME: The D's counter is cut with fill-rule evenodd (same geometry as before), so it shows the ground.
interface BrandMarkProps {
  size?: number;
}

export function BrandMark({ size = 24 }: BrandMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 12 L12 28 L24 28 L28 24 L28 16 L24 12 Z M14 18 L24 18 L24 22 L14 22 Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}
