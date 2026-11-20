# Publicar en Netlify (manteniendo Supabase)

1. En Netlify: **Add new site → Import from Git** y elige este repositorio. Netlify lee `netlify.toml` (no cambies comando ni carpeta).
2. **Site configuration → Environment variables**: copia los mismos valores del archivo `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   - `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` (mismos valores, para el servidor)
   - `SUPABASE_SERVICE_ROLE_KEY` solo si usas funciones de administración (nunca la publiques en el código).
3. Despliega. Copia la dirección final (p. ej. `https://boxflow.netlify.app`).
4. En Supabase → **Authentication → URL Configuration**:
   - **Site URL**: tu dirección de Netlify.
   - **Redirect URLs**: añade `https://TU-SITIO.netlify.app/**`.
5. La cancelación automática de clases ya corre dentro de Supabase (pg_cron); no hay que configurar nada en Netlify.
