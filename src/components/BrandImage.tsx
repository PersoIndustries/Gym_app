import { useQuery } from '@tanstack/react-query';
import { resolveLogo } from '@/lib/data/media';
export function BrandImage({ url, alt, className = '' }: { url: string | null | undefined; alt: string; className?: string }) {
  const { data } = useQuery({ queryKey: ['logo', url], enabled: !!url, staleTime: 30 * 60 * 1000, queryFn: () => resolveLogo(url) });
  return data ? <img src={data} alt={alt} className={className} onError={e => { e.currentTarget.hidden = true; }} /> : null;
}
