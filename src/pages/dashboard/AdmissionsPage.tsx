import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { supabase } from '../../lib/auth';
import type { Admission, Patient, Doctor, Bed } from '../../lib/types';

export default function AdmissionsPage() {
  const { toast } = useToast();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ patient_id: '', bed_id: '', doctor_id: '', reason: '' });

  const load = async () => {
    const { data } = await supabase
      .from('admissions')
      .select('*, patient:patients(*), bed:beds(*), doctor:doctors(*)')
      .order('admission_date', { ascending: false });
    setAdmissions((data as Admission[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: d }, { data: b }] = await Promise.all([
        supabase.from('patients').select('*').order('full_name'),
        supabase.from('doctors').select('*').order('full_name'),
        supabase.from('beds').select('*, room:rooms(*)').eq('status', 'available').order('bed_number'),
      ]);
      setPatients(p ?? []);
      setDoctors(d ?? []);
      setBeds((b as Bed[]) ?? []);
      load();
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_id || !form.bed_id) { toast('Select patient and bed', 'error'); return; }
    const { error } = await supabase.from('admissions').insert({
      patient_id: form.patient_id,
      bed_id: form.bed_id,
      doctor_id: form.doctor_id || null,
      reason: form.reason,
    });
    if (error) { toast(error.message, 'error'); return; }
    await supabase.from('beds').update({ status: 'occupied' }).eq('id', form.bed_id);
    toast('Patient admitted', 'success');
    setModalOpen(false);
    setForm({ patient_id: '', bed_id: '', doctor_id: '', reason: '' });
    load();
  };

  const discharge = async (adm: Admission) => {
    if (!confirm('Discharge this patient?')) return;
    const { error } = await supabase.from('admissions').update({
      status: 'discharged',
      discharge_date: new Date().toISOString(),
    }).eq('id', adm.id);
    if (error) { toast(error.message, 'error'); return; }
    if (adm.bed_id) {
      await supabase.from('beds').update({ status: 'available' }).eq('id', adm.bed_id);
    }
    toast('Patient discharged', 'success');
    load();
  };

  return (
    <DashboardLayout title="Patient Admissions">
      <DataTable
        data={admissions}
        loading={loading}
        columns={[
          { key: 'patient', label: 'Patient', render: (a) => a.patient?.full_name ?? '—' },
          { key: 'doctor', label: 'Doctor', render: (a) => a.doctor?.full_name ?? '—' },
          { key: 'admission_date', label: 'Admitted', render: (a) => new Date(a.admission_date).toLocaleDateString() },
          { key: 'discharge_date', label: 'Discharged', render: (a) => a.discharge_date ? new Date(a.discharge_date).toLocaleDateString() : '—' },
          { key: 'reason', label: 'Reason' },
          { key: 'status', label: 'Status', render: (a) => <span className={`badge-${a.status === 'admitted' ? 'primary' : 'success'}`}>{a.status}</span> },
          { key: 'actions', label: 'Actions', render: (a) => a.status === 'admitted' ? (
            <button onClick={() => discharge(a)} className="btn-ghost p-1.5 text-sm text-warning-600">Discharge</button>
          ) : null },
        ]}
        searchKey="reason"
        onAdd={() => setModalOpen(true)}
        addLabel="Admit Patient"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Admit Patient">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Patient</label>
            <select required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="input">
              <option value="">Select Patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Available Bed</label>
            <select required value={form.bed_id} onChange={(e) => setForm({ ...form, bed_id: e.target.value })} className="input">
              <option value="">Select Bed</option>
              {beds.map((b) => <option key={b.id} value={b.id}>{b.bed_number}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Assign Doctor</label>
            <select value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} className="input">
              <option value="">None</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Reason for Admission</label>
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input" />
          </div>
          <button type="submit" className="btn-primary w-full">Admit Patient</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
