import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { recoverPassword } from '@/lib/data/passwords';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/layout/Logo';
import { pageHead } from '@/lib/seo';
export const Route = createFileRoute('/reset-password')({ head: pageHead('Restablecer contraseña', 'Elige una contraseña nueva para tu cuenta de Meowscle.'), component: ResetPassword });
function ResetPassword() {
  const [ready, setReady] = useState(false); const [checked, setChecked] = useState(false); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState('');
  useEffect(() => {
    const recoveryHash = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
    const { data } = supabase.auth.onAuthStateChange((event, session) => { if (event === 'PASSWORD_RECOVERY' && session) { setReady(true); setChecked(true); } });
    void supabase.auth.getUser().then(({ data: user }) => { if (recoveryHash && user.user) setReady(true); setChecked(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  return <main className="grid min-h-screen place-items-center px-5"><div className="w-full max-w-sm"><Logo /><h1 className="my-6 text-2xl font-bold">Restablecer contraseña</h1>{done ? <><p>Contraseña actualizada.</p><Button asChild className="mt-4"><Link to="/auth">Entrar</Link></Button></> : !checked ? <p>Comprobando enlace…</p> : !ready ? <><p role="alert">El enlace no es válido o ha caducado.</p><Button asChild variant="outline" className="mt-4"><Link to="/auth">Solicitar otro enlace</Link></Button></> : <form className="space-y-4" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(''); try { await recoverPassword(password, confirmation); setDone(true); } catch (err) { setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'No se pudo cambiar la contraseña'); } finally { setBusy(false); } }}><div><Label htmlFor="new-password">Nueva contraseña</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)}/></div><div><Label htmlFor="confirm-password">Repetir contraseña</Label><Input id="confirm-password" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)}/></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button className="w-full" disabled={busy}>{busy ? 'Guardando…' : 'Guardar contraseña'}</Button></form>}</div></main>;
}
