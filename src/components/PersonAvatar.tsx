import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/initials";
import { cn } from "@/lib/utils";

/** Foto de perfil (p. ej. la de Google) o iniciales de nombre y apellido. */
export function PersonAvatar({ name, url, className }: { name: string; url?: string | null | undefined; className?: string }) {
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      {url && <AvatarImage src={url} alt={name} referrerPolicy="no-referrer" />}
      <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
