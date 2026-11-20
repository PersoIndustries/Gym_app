import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { resolveLogo } from '@/lib/data/media';
import { useSession } from '@/lib/auth/session';
export function BrandImage({ url, alt, className = '', fallback = null }: { url: string | null | undefined; alt: string; className?: string; fallback?: ReactNode }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const { user } = useSession();
  const { data } = useQuery({ queryKey: ['logo', user?.id, url], enabled: !!url, staleTime: 30 * 60 * 1000, refetchInterval: 30 * 60 * 1000, queryFn: () => resolveLogo(url) });
  return data && data !== failedUrl ? <img src={data} alt={alt} className={className} onError={() => setFailedUrl(data)} /> : fallback;
}
