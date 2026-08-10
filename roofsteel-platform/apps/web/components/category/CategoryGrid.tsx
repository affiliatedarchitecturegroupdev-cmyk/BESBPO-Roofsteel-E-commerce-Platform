import Link from "next/link";
import type { CategorySummary } from "@roofsteel/shared-types";
import { Icon } from "../Icon";

export interface CategoryGridProps {
  categories: CategorySummary[];
  variant?: "mobile" | "desktop";
}

// Same 13 categories, same icons, as the corporate site's category section
// — see guidelines/12-storefront-ux-and-ia.md's Home breakdown, point 2.
// `variant` controls the grid column CSS class only; the tile markup itself
// doesn't change, matching ProductCard's pattern of one component with a
// layout variant rather than two near-duplicate components.
export function CategoryGrid({ categories, variant = "mobile" }: CategoryGridProps) {
  const gridClass = variant === "desktop" ? "cat-grid-desktop" : "cat-grid-mobile";
  const tileClass = variant === "desktop" ? "cat-tile cat-tile--desktop" : "cat-tile";

  return (
    <div className={gridClass}>
      {categories.map((cat) => (
        <Link key={cat.slug} href={`/category/${cat.slug}`} className={tileClass}>
          <div className="cat-tile-icon">
            <Icon name={cat.icon} size={variant === "desktop" ? 24 : 22} color="#E8631C" />
          </div>
          <div className="cat-tile-name">{cat.name}</div>
          <div className="cat-tile-count">{cat.lineCount} LINES</div>
        </Link>
      ))}
    </div>
  );
}
