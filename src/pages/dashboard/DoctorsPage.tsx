import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { supabase } from '../../lib/auth';
import type { Doctor, Department } from '../../lib/types';

export default function DoctorsPage() {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState({
    full_name: '', specialization: '', qualifications: '', consultation_fee: 0,
    experience_years: 0, bio: '', phone: '', email: '', department_id: '',
    start_time: '09:00', end_time: '17:00', is_active: true,
  });

  const load = async () => {
    const [{ data: docs }, { data: depts }] = await Promise.all([
      supabase.from('doctors').select('*, department:departments(*)').order('full_name'),
      supabase.from('departments').select('*'),
    ]);
    setDoctors((docs as Doctor[]) ?? []);
    setDepartments(depts ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, consultation_fee: Number(form.consultation_fee), experience_years: Number(form.experience_years), department_id: form.department_id || null };
    if (editing) {
      const { error } = await supabase.from('doctors').update(payload).eq('id', editing.id);
      if (error) { toast(error.message, 'error'); return; }
      toast('Doctor updated', 'success');
    } else {
      const { error } = await supabase.from('doctors').insert(payload);
      if (error) { toast(error.message, 'error'); return; }
      toast('Doctor added', 'success');
    }
    setModalOpen(false);
    setEditing(null);
    load();
  };

  const handleEdit = (doc: Doctor) => {
    setEditing(doc);
    setForm({
      full_name: doc.full_name, specialization: doc.specialization ?? '', qualifications: doc.qualifications ?? '',
      consultation_fee: doc.consultation_fee, experience_years: doc.experience_years, bio: doc.bio ?? '',
      phone: doc.phone ?? '', email: doc.email ?? '', department_id: doc.department_id ?? '',
      start_time: doc.start_time ?? '09:00', end_time: doc.end_time ?? '17:00', is_active: doc.is_active,
    });
    setModalOpen(true);
  };

  const handleDelete = async (doc: Doctor) => {
    if (!confirm(`Delete doctor "${doc.full_name}"?`)) return;
    const { error } = await supabase.from('doctors').delete().eq('id', doc.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Doctor deleted', 'success');
    load();
  };

  return (
    <DashboardLayout title="Manage Doctors">
      <DataTable
        data={doctors}
        loading={loading}
        columns={[
          { key: 'full_name', label: 'Name' },
          { key: 'specialization', label: 'Specialization' },
          { key: 'department', label: 'Department', render: (d) => d.department?.name ?? '—' },
          { key: 'consultation_fee', label: 'Fee', render: (d) => `$${d.consultation_fee}` },
          { key: 'experience_years', label: 'Experience', render: (d) => `${d.experience_years} yrs` },
          { key: 'is_active', label: 'Status', render: (d) => d.is_active ? <span className="badge-success">Active</span> : <span className="badge-gray">Inactive</span> },
        ]}
        searchKey="full_name"
        onAdd={() => { setEditing(null); setForm({ full_name: '', specialization: '', qualifications: '', consultation_fee: 0, experience_years: 0, bio: '', phone: '', email: '', department_id: '', start_time: '09:00', end_time: '17:00', is_active: true }); setModalOpen(true); }}
        addLabel="Add Doctor"
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Doctor' : 'Add Doctor'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Specialization</label>
              <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Department</label>
              <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="input">
                <option value="">Select Department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Qualifications</label>
              <input value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Consultation Fee ($)</label>
              <input type="number" value={form.consultation_fee} onChange={(e) => setForm({ ...form, consultation_fee: Number(e.target.value) })} className="input" />
            </div>
            <div>
              <label className="label">Experience (years)</label>
              <input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })} className="input" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Start Time</label>
              <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">End Time</label>
              <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
            Active
          </label>
          <button type="submit" className="btn-primary w-full">{editing ? 'Update' : 'Add'}</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
