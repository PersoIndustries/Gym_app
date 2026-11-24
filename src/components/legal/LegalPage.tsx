import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";

export const LEGAL_EMAIL = "carlos@jardiper.es";
export const LEGAL_ENTITY = "Jardiper S.C.";
export const LEGAL_ADDRESS = "Carretera A131, km 1.8 S/N, 22520 Fraga (Huesca), España";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border"><div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4"><Link to="/"><Logo /></Link><nav className="flex gap-4 text-sm text-muted-foreground"><Link to="/terminos" className="hover:text-foreground">Términos</Link><Link to="/privacidad" className="hover:text-foreground">Privacidad</Link></nav></div></header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última actualización: {updated}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline">{children}</div>
      </main>
    </div>
  );
}
