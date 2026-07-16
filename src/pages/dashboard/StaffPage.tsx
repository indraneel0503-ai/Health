import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { supabase } from '../../lib/auth';
import type { Staff, Department, Role } from '../../lib/types';

const roles: { value: Role; label: string }[] = [
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'lab_technician', label: 'Lab Technician' },
  { value: 'admin', label: 'Admin' },
];

export default function StaffPage() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState({ full_name: '', role: 'receptionist' as Role, department_id: '', phone: '', email: '', shift: 'Morning', is_active: true });

  const load = async () => {
    const [{ data: s }, { data: d }] = await Promise.all([
      supabase.from('staff').select('*, department:departments(*)').order('full_name'),
      supabase.from('departments').select('*'),
    ]);
    setStaff((s as Staff[]) ?? []);
    setDepartments(d ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, department_id: form.department_id || null };
    if (editing) {
      const { error } = await supabase.from('staff').update(payload).eq('id', editing.id);
      if (error) { toast(error.message, 'error'); return; }
      toast('Staff updated', 'success');
    } else {
      const { error } = await supabase.from('staff').insert(payload);
      if (error) { toast(error.message, 'error'); return; }
      toast('Staff added', 'success');
    }
    setModalOpen(false);
    setEditing(null);
    load();
  };

  const handleEdit = (s: Staff) => {
    setEditing(s);
    setForm({ full_name: s.full_name, role: s.role, department_id: s.department_id ?? '', phone: s.phone ?? '', email: s.email ?? '', shift: s.shift, is_active: s.is_active });
    setModalOpen(true);
  };

  const handleDelete = async (s: Staff) => {
    if (!confirm(`Delete staff "${s.full_name}"?`)) return;
    const { error } = await supabase.from('staff').delete().eq('id', s.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Staff deleted', 'success');
    load();
  };

  return (
    <DashboardLayout title="Manage Staff">
      <DataTable
        data={staff}
        loading={loading}
        columns={[
          { key: 'full_name', label: 'Name' },
          { key: 'role', label: 'Role' },
          { key: 'department', label: 'Department', render: (s) => s.department?.name ?? '—' },
          { key: 'phone', label: 'Phone' },
          { key: 'shift', label: 'Shift' },
          { key: 'is_active', label: 'Status', render: (s) => s.is_active ? <span className="badge-success">Active</span> : <span className="badge-gray">Inactive</span> },
        ]}
        searchKey="full_name"
        onAdd={() => { setEditing(null); setForm({ full_name: '', role: 'receptionist', department_id: '', phone: '', email: '', shift: 'Morning', is_active: true }); setModalOpen(true); }}
        addLabel="Add Staff"
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Staff' : 'Add Staff'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className="input">
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Department</label>
            <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="input">
              <option value="">None</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Shift</label>
            <select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} className="input">
              {['Morning', 'Evening', 'Night'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
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
