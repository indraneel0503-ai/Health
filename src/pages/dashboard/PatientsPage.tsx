import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { supabase } from '../../lib/auth';
import type { Patient } from '../../lib/types';

export default function PatientsPage() {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState({
    full_name: '', date_of_birth: '', gender: 'male', blood_group: '',
    phone: '', email: '', address: '', emergency_contact: '', medical_history: '', allergies: '',
  });

  const load = async () => {
    const { data } = await supabase.from('patients').select('*').order('full_name');
    setPatients(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, date_of_birth: form.date_of_birth || null };
    if (editing) {
      const { error } = await supabase.from('patients').update(payload).eq('id', editing.id);
      if (error) { toast(error.message, 'error'); return; }
      toast('Patient updated', 'success');
    } else {
      const { error } = await supabase.from('patients').insert(payload);
      if (error) { toast(error.message, 'error'); return; }
      toast('Patient registered', 'success');
    }
    setModalOpen(false);
    setEditing(null);
    load();
  };

  const handleEdit = (p: Patient) => {
    setEditing(p);
    setForm({
      full_name: p.full_name, date_of_birth: p.date_of_birth ?? '', gender: p.gender ?? 'male',
      blood_group: p.blood_group ?? '', phone: p.phone ?? '', email: p.email ?? '',
      address: p.address ?? '', emergency_contact: p.emergency_contact ?? '',
      medical_history: p.medical_history ?? '', allergies: p.allergies ?? '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (p: Patient) => {
    if (!confirm(`Delete patient "${p.full_name}"?`)) return;
    const { error } = await supabase.from('patients').delete().eq('id', p.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Patient deleted', 'success');
    load();
  };

  return (
    <DashboardLayout title="Manage Patients">
      <DataTable
        data={patients}
        loading={loading}
        columns={[
          { key: 'full_name', label: 'Name' },
          { key: 'phone', label: 'Phone' },
          { key: 'gender', label: 'Gender' },
          { key: 'blood_group', label: 'Blood' },
          { key: 'email', label: 'Email' },
          { key: 'created_at', label: 'Registered', render: (p) => new Date(p.created_at).toLocaleDateString() },
        ]}
        searchKey="full_name"
        onAdd={() => { setEditing(null); setForm({ full_name: '', date_of_birth: '', gender: 'male', blood_group: '', phone: '', email: '', address: '', emergency_contact: '', medical_history: '', allergies: '' }); setModalOpen(true); }}
        addLabel="Register Patient"
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Patient' : 'Register Patient'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Blood Group</label>
              <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} className="input">
                <option value="">Unknown</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
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
              <label className="label">Emergency Contact</label>
              <input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Medical History</label>
              <textarea rows={2} value={form.medical_history} onChange={(e) => setForm({ ...form, medical_history: e.target.value })} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Allergies</label>
              <input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="input" />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">{editing ? 'Update' : 'Register'}</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
