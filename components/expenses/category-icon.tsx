import { CATEGORY_ICON_MAP, CategoryIconSp, type SpIcon } from "@/components/spine-ui";
import { cn } from "@/lib/utils";

/**
 * Category icons by DB key (Lucide-style names): the same 50 names as the
 * backend's allowlist (GET /api/categories/icons). Drawn with the kit's
 * icon set (iconsax Bulk); an unknown name shows "tag".
 */
export const CATEGORY_ICONS: Record<string, SpIcon> = CATEGORY_ICON_MAP;

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  return <CategoryIconSp name={name} className={cn("size-5 shrink-0", className)} />;
}
