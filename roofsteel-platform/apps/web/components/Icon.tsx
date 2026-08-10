import { ICON_PATHS } from "../lib/icon-paths";

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

// Single Icon component wrapping the corporate site's validated icon set —
// see guidelines/03-frontend.md ("port tokens, don't reinvent") and
// docs/DEVELOPMENT-LOG.md's UX validation session.
export function Icon({ name, size = 20, color = "currentColor", className }: IconProps) {
  const path = ICON_PATHS[name] ?? ICON_PATHS.grid;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}
