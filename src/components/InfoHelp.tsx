import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function InfoHelp({ label, children }: { label: string; children: React.ReactNode }) {
  return <Popover><PopoverTrigger asChild><Button type="button" variant="ghost" size="icon" className="inline-flex h-7 w-7 shrink-0 align-middle text-muted-foreground" aria-label={`Información: ${label}`}><Info className="h-4 w-4" /></Button></PopoverTrigger><PopoverContent className="max-w-[calc(100vw-2rem)] text-sm" side="top"><p className="mb-1 font-semibold">{label}</p><div className="text-muted-foreground">{children}</div></PopoverContent></Popover>;
}