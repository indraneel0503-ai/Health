import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { supabase } from '../../lib/auth';
import type { CmsPage, CmsBanner, CmsTestimonial, CmsBlog } from '../../lib/types';

type Tab = 'pages' | 'banners' | 'testimonials' | 'blogs';

export default function CmsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('pages');
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [testimonials, setTestimonials] = useState<CmsTestimonial[]>([]);
  const [blogs, setBlogs] = useState<CmsBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ type: Tab; id?: string; data: Record<string, unknown> } | null>(null);

  const load = async () => {
    const [{ data: p }, { data: b }, { data: t }, { data: bl }] = await Promise.all([
      supabase.from('cms_pages').select('*').order('title'),
      supabase.from('cms_banners').select('*').order('sort_order'),
      supabase.from('cms_testimonials').select('*').order('created_at', { ascending: false }),
      supabase.from('cms_blogs').select('*').order('created_at', { ascending: false }),
    ]);
    setPages(p ?? []);
    setBanners(b ?? []);
    setTestimonials(t ?? []);
    setBlogs(bl ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const { type, id, data } = editing;
    const table = type === 'pages' ? 'cms_pages' : type === 'banners' ? 'cms_banners' : type === 'testimonials' ? 'cms_testimonials' : 'cms_blogs';
    if (id) {
      const { error } = await supabase.from(table).update(data).eq('id', id);
      if (error) { toast(error.message, 'error'); return; }
      toast('Updated successfully', 'success');
    } else {
      const { error } = await supabase.from(table).insert(data);
      if (error) { toast(error.message, 'error'); return; }
      toast('Created successfully', 'success');
    }
    setModalOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (type: Tab, id: string) => {
    const table = type === 'pages' ? 'cms_pages' : type === 'banners' ? 'cms_banners' : type === 'testimonials' ? 'cms_testimonials' : 'cms_blogs';
    if (!confirm('Delete this item?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Deleted', 'success');
    load();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pages', label: 'Pages' },
    { key: 'banners', label: 'Banners' },
    { key: 'testimonials', label: 'Testimonials' },
    { key: 'blogs', label: 'Blog Posts' },
  ];

  const renderForm = () => {
    if (!editing) return null;
    const { type, data } = editing;
    const d = data as Record<string, string>;

    if (type === 'pages') {
      return (
        <>
          <div><label className="label">Title</label><input required value={d.title ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, title: e.target.value } })} className="input" /></div>
          <div><label className="label">Slug</label><input required value={d.slug ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, slug: e.target.value } })} className="input" /></div>
          <div><label className="label">Content</label><textarea rows={6} value={d.content ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, content: e.target.value } })} className="input" /></div>
          <div><label className="label">Meta Description</label><input value={d.meta_description ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, meta_description: e.target.value } })} className="input" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.is_active === 'true'} onChange={(e) => setEditing({ ...editing, data: { ...data, is_published: e.target.checked } })} className="rounded" />Published</label>
        </>
      );
    }
    if (type === 'banners') {
      return (
        <>
          <div><label className="label">Title</label><input required value={d.title ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, title: e.target.value } })} className="input" /></div>
          <div><label className="label">Subtitle</label><input value={d.subtitle ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, subtitle: e.target.value } })} className="input" /></div>
          <div><label className="label">Image URL</label><input value={d.image_url ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, image_url: e.target.value } })} className="input" /></div>
          <div><label className="label">Link</label><input value={d.link ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, link: e.target.value } })} className="input" /></div>
          <div><label className="label">Sort Order</label><input type="number" value={d.sort_order ?? '0'} onChange={(e) => setEditing({ ...editing, data: { ...data, sort_order: Number(e.target.value) } })} className="input" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.is_active === 'true'} onChange={(e) => setEditing({ ...editing, data: { ...data, is_active: e.target.checked } })} className="rounded" />Active</label>
        </>
      );
    }
    if (type === 'testimonials') {
      return (
        <>
          <div><label className="label">Patient Name</label><input required value={d.patient_name ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, patient_name: e.target.value } })} className="input" /></div>
          <div><label className="label">Rating</label><select value={d.rating ?? '5'} onChange={(e) => setEditing({ ...editing, data: { ...data, rating: Number(e.target.value) } })} className="input">{[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} Stars</option>)}</select></div>
          <div><label className="label">Message</label><textarea rows={3} value={d.message ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, message: e.target.value } })} className="input" /></div>
          <div><label className="label">Avatar URL</label><input value={d.avatar_url ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, avatar_url: e.target.value } })} className="input" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.is_published === 'true'} onChange={(e) => setEditing({ ...editing, data: { ...data, is_published: e.target.checked } })} className="rounded" />Published</label>
        </>
      );
    }
    return (
      <>
        <div><label className="label">Title</label><input required value={d.title ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, title: e.target.value } })} className="input" /></div>
        <div><label className="label">Slug</label><input required value={d.slug ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, slug: e.target.value } })} className="input" /></div>
        <div><label className="label">Excerpt</label><input value={d.excerpt ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, excerpt: e.target.value } })} className="input" /></div>
        <div><label className="label">Content</label><textarea rows={6} value={d.content ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, content: e.target.value } })} className="input" /></div>
        <div><label className="label">Author</label><input value={d.author ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, author: e.target.value } })} className="input" /></div>
        <div><label className="label">Category</label><input value={d.category ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, category: e.target.value } })} className="input" /></div>
        <div><label className="label">Image URL</label><input value={d.image_url ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...data, image_url: e.target.value } })} className="input" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.is_published === 'true'} onChange={(e) => setEditing({ ...editing, data: { ...data, is_published: e.target.checked } })} className="rounded" />Published</label>
      </>
    );
  };

  const currentData = tab === 'pages' ? pages : tab === 'banners' ? banners : tab === 'testimonials' ? testimonials : blogs;

  const columns = tab === 'pages' ? [
    { key: 'title', label: 'Title' },
    { key: 'slug', label: 'Slug' },
    { key: 'is_published', label: 'Published', render: (r: CmsPage) => r.is_published ? <span className="badge-success">Yes</span> : <span className="badge-gray">No</span> },
  ] : tab === 'banners' ? [
    { key: 'title', label: 'Title' },
    { key: 'subtitle', label: 'Subtitle', render: (r: CmsBanner) => <span className="line-clamp-1 max-w-xs">{r.subtitle ?? '—'}</span> },
    { key: 'sort_order', label: 'Order' },
    { key: 'is_active', label: 'Active', render: (r: CmsBanner) => r.is_active ? <span className="badge-success">Yes</span> : <span className="badge-gray">No</span> },
  ] : tab === 'testimonials' ? [
    { key: 'patient_name', label: 'Name' },
    { key: 'rating', label: 'Rating', render: (r: CmsTestimonial) => `${r.rating}★` },
    { key: 'message', label: 'Message', render: (r: CmsTestimonial) => <span className="line-clamp-1 max-w-xs">{r.message ?? '—'}</span> },
  ] : [
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author' },
    { key: 'category', label: 'Category' },
    { key: 'is_published', label: 'Published', render: (r: CmsBlog) => r.is_published ? <span className="badge-success">Yes</span> : <span className="badge-gray">No</span> },
  ];

  return (
    <DashboardLayout title="CMS Content Management">
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.key ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        data={currentData as { id: string }[]}
        loading={loading}
        columns={columns as { key: string; label: string; render?: (row: { id: string }) => React.ReactNode }[]}
        searchKey="title"
        onAdd={() => {
          const emptyData: Record<string, unknown> = tab === 'pages' ? { title: '', slug: '', content: '', meta_description: '', is_published: true }
            : tab === 'banners' ? { title: '', subtitle: '', image_url: '', link: '', sort_order: 0, is_active: true }
            : tab === 'testimonials' ? { patient_name: '', rating: 5, message: '', avatar_url: '', is_published: true }
            : { title: '', slug: '', excerpt: '', content: '', author: '', category: '', image_url: '', is_published: true };
          setEditing({ type: tab, data: emptyData });
          setModalOpen(true);
        }}
        addLabel={`Add ${tab.slice(0, -1)}`}
        onEdit={(row) => {
          const item = currentData.find((r) => r.id === row.id) as unknown as Record<string, unknown>;
          setEditing({ type: tab, id: row.id, data: { ...item } });
          setModalOpen(true);
        }}
        onDelete={(row) => handleDelete(tab, row.id)}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing?.id ? 'Edit' : 'Add New'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {renderForm()}
          <button type="submit" className="btn-primary w-full">{editing?.id ? 'Update' : 'Create'}</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
