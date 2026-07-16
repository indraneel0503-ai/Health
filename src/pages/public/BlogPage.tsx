import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { CmsBlog } from '../../lib/types';

export default function BlogPage() {
  const [blogs, setBlogs] = useState<CmsBlog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('cms_blogs')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBlogs(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="bg-primary-700 py-16 text-center">
        <h1 className="text-3xl lg:text-4xl font-bold text-white">Health Blog</h1>
        <p className="mt-3 text-primary-100">Latest health tips and medical insights from our experts</p>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : blogs.length === 0 ? (
          <p className="text-center text-gray-400">No blog posts yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Link key={blog.id} to={`/blog/${blog.slug}`} className="card overflow-hidden group hover:shadow-md transition-all">
                <div className="aspect-video bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30">
                  {blog.image_url && <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover" />}
                </div>
                <div className="p-4">
                  <span className="badge-primary mb-2">{blog.category}</span>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors">{blog.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{blog.excerpt}</p>
                  <p className="text-xs text-gray-400 mt-2">By {blog.author}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
