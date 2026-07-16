import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { CmsBlog } from '../../lib/types';

export default function BlogPostPage({ slug }: { slug: string }) {
  const [blog, setBlog] = useState<CmsBlog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('cms_blogs')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
      .then(({ data }) => {
        setBlog(data as CmsBlog | null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="py-20 text-center text-gray-400">Loading...</div>;
  if (!blog) return <div className="py-20 text-center text-gray-400">Article not found.</div>;

  return (
    <div>
      <div className="aspect-[2/1] bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30">
        {blog.image_url && <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover" />}
      </div>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <span className="badge-primary mb-4">{blog.category}</span>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{blog.title}</h1>
        <p className="text-sm text-gray-400 mt-2">By {blog.author} · {new Date(blog.created_at).toLocaleDateString()}</p>
        <div className="mt-6 text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{blog.content}</div>
        <Link to="/blog" className="btn-secondary mt-8">Back to Blog</Link>
      </div>
    </div>
  );
}
