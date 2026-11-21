import { useQuery } from "@tanstack/react-query";
import { coachProfileQuery } from "@/lib/data/gym";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { PersonAvatar } from "@/components/PersonAvatar";
export function CoachProfile({ id, name, avatar }: { id: string | null; name: string | null; avatar?: string | null | undefined }) {
  const { data } = useQuery(coachProfileQuery(id));
  if (!id && !name) return null;
  const fullName = data?.full_name ?? name ?? "Profesor";
  const image = data?.avatar_url ?? avatar;
  return <Dialog><DialogTrigger asChild><Button variant="ghost" size="icon" aria-label={`Ver perfil de ${fullName}`} title="Ver profesor" className="shrink-0 rounded-full"><PersonAvatar name={fullName} url={image} className="h-9 w-9"/></Button></DialogTrigger><DialogContent className="sm:max-w-sm"><DialogHeader><PersonAvatar name={fullName} url={image} className="mx-auto mb-3 h-32 w-32"/><DialogTitle className="text-center">{fullName}</DialogTitle><DialogDescription className="text-center">Profesor</DialogDescription></DialogHeader>{data?.bio && <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{data.bio}</p>}</DialogContent></Dialog>;
}