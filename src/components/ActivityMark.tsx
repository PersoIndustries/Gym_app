import { Bike, Dumbbell, Flame, Footprints, Music2, PersonStanding, Trophy } from "lucide-react";
import { activitySymbol } from "@/lib/brand/activities";
import { cn } from "@/lib/utils";
import { BrandImage } from "./BrandImage";
const ICONS = { strength: Dumbbell, running: Footprints, cycling: Bike, hyrox: Flame, pilates: PersonStanding, dance: Music2, event: Trophy };
export function ActivityMark({ name, url, className }: { name: string; url?: string | null | undefined; className?: string }) {
  const Icon = ICONS[activitySymbol(name)];
  const fallback = <span role="img" aria-label={name} title={name} className={cn("inline-flex shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 p-1.5 text-primary", className)}><Icon className="h-full w-full" strokeWidth={1.8} /></span>;
  return url ? <BrandImage url={url} alt={name} className={cn("object-contain", className)} fallback={fallback} /> : fallback;
}