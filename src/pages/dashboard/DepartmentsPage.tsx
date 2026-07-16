import { useEffect, useState } from 'react';

import DashboardLayout from '../../components/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { supabase } from '../../lib/auth';
import type { Department } from '../../lib/types';

const icons = ['heart', 'brain', 'bone', 'baby', 'eye', 'stethoscope', 'activity', 'hand', 'ear', 'users'];

export default function DepartmentsPage() {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', description: '', icon: 'stethoscope' });

  const load = async () => {
    const { data } = await supabase.from('departments').select('*').order('name');
    setDepartments(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const { error } = await supabase.from('departments').update(form).eq('id', editing.id);
      if (error) { toast(error.message, 'error'); return; }
      toast('Department updated', 'success');
    } else {
      const { error } = await supabase.from('departments').insert(form);
      if (error) { toast(error.message, 'error'); return; }
      toast('Department created', 'success');
    }
    setModalOpen(false);
    setEditing(null);
    setForm({ name: '', description: '', icon: 'stethoscope' });
    load();
  };

  const handleEdit = (dept: Department) => {
    setEditing(dept);
    setForm({ name: dept.name, description: dept.description ?? '', icon: dept.icon ?? 'stethoscope' });
    setModalOpen(true);
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Delete department "${dept.name}"?`)) return;
    const { error } = await supabase.from('departments').delete().eq('id', dept.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Department deleted', 'success');
    load();
  };

  return (
    <DashboardLayout title="Manage Departments">
      <DataTable
        data={departments}
        loading={loading}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description', render: (d) => <span className="line-clamp-1 max-w-xs">{d.description ?? '—'}</span> },
          { key: 'icon', label: 'Icon' },
        ]}
        searchKey="name"
        onAdd={() => { setEditing(null); setForm({ name: '', description: '', icon: 'stethoscope' }); setModalOpen(true); }}
        addLabel="Add Department"
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Icon</label>
            <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="input">
              {icons.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full">{editing ? 'Update' : 'Create'}</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
