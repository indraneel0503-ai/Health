import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { CmsPage } from '../../lib/types';

export default function CmsPageView({ slug }: { slug: string }) {
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('cms_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
      .then(({ data }) => {
        setPage(data as CmsPage | null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="py-20 text-center text-gray-400">Loading...</div>;
  if (!page) return <div className="py-20 text-center text-gray-400">Page not found.</div>;

  return (
    <div>
      <div className="bg-primary-700 py-16 text-center">
        <h1 className="text-3xl lg:text-4xl font-bold text-white">{page.title}</h1>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{page.content}</p>
        </div>
      </div>
    </div>
  );
}
