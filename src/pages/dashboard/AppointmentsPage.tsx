import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/auth';
import type { Appointment, Patient, Doctor } from '../../lib/types';

export default function AppointmentsPage() {
  const { profile } = useAuth();
  const role = profile?.role ?? 'patient';
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', appointment_date: '', appointment_time: '09:00', reason: '' });

  const load = async () => {
    let query = supabase.from('appointments').select('*, patient:patients(*), doctor:doctors(*)').order('appointment_date', { ascending: false });
    if (role === 'patient') {
      const { data: myPatient } = await supabase.from('patients').select('id').eq('user_id', profile?.id).maybeSingle();
      if (myPatient) query = query.eq('patient_id', myPatient.id);
    } else if (role === 'doctor') {
      const { data: myDoc } = await supabase.from('doctors').select('id').eq('user_id', profile?.id).maybeSingle();
      if (myDoc) query = query.eq('doctor_id', myDoc.id);
    }
    const { data } = await query;
    setAppointments((data as Appointment[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: d }] = await Promise.all([
        supabase.from('patients').select('*').order('full_name'),
        supabase.from('doctors').select('*').eq('is_active', true).order('full_name'),
      ]);
      setPatients(p ?? []);
      setDoctors(d ?? []);
      load();
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      patient_id: form.patient_id,
      doctor_id: form.doctor_id,
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time,
      reason: form.reason,
      created_by: profile?.id,
    };
    // If patient is booking for themselves
    if (role === 'patient' && !form.patient_id) {
      const { data: myPatient } = await supabase.from('patients').select('id').eq('user_id', profile?.id).maybeSingle();
      if (myPatient) payload.patient_id = myPatient.id;
    }
    if (!payload.patient_id) { toast('Please select a patient', 'error'); return; }
    if (!payload.doctor_id) { toast('Please select a doctor', 'error'); return; }
    const { error } = await supabase.from('appointments').insert(payload);
    if (error) { toast(error.message, 'error'); return; }
    toast('Appointment booked', 'success');
    setModalOpen(false);
    setForm({ patient_id: '', doctor_id: '', appointment_date: '', appointment_time: '09:00', reason: '' });
    load();
  };

  const updateStatus = async (appt: Appointment, status: string) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', appt.id);
    if (error) { toast(error.message, 'error'); return; }
    toast(`Appointment marked as ${status}`, 'success');
    load();
  };

  const canBook = ['admin', 'receptionist', 'patient'].includes(role);

  return (
    <DashboardLayout title="Appointments">
      <DataTable
        data={appointments}
        loading={loading}
        columns={[
          { key: 'appointment_date', label: 'Date', render: (a) => new Date(a.appointment_date).toLocaleDateString() },
          { key: 'appointment_time', label: 'Time', render: (a) => a.appointment_time?.slice(0, 5) },
          { key: 'patient', label: 'Patient', render: (a) => a.patient?.full_name ?? '—' },
          { key: 'doctor', label: 'Doctor', render: (a) => a.doctor?.full_name ?? '—' },
          { key: 'reason', label: 'Reason' },
          {
            key: 'status', label: 'Status', render: (a) => (
              <span className={`badge-${a.status === 'completed' ? 'success' : a.status === 'cancelled' ? 'error' : a.status === 'no_show' ? 'warning' : 'primary'}`}>
                {a.status}
              </span>
            )
          },
          {
            key: 'actions', label: 'Actions', render: (a) => a.status === 'scheduled' ? (
              <div className="flex gap-1">
                <button onClick={() => updateStatus(a, 'completed')} className="btn-ghost p-1 text-success-600" title="Complete">✓</button>
                <button onClick={() => updateStatus(a, 'cancelled')} className="btn-ghost p-1 text-error-600" title="Cancel">✕</button>
              </div>
            ) : null
          },
        ]}
        searchKey="reason"
        onAdd={canBook ? () => setModalOpen(true) : undefined}
        addLabel="Book Appointment"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Book Appointment">
        <form onSubmit={handleSave} className="space-y-4">
          {role !== 'patient' && (
            <div>
              <label className="label">Patient</label>
              <select required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="input">
                <option value="">Select Patient</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Doctor</label>
            <select required value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} className="input">
              <option value="">Select Doctor</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name} - {d.specialization}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" required value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Time</label>
              <input type="time" required value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Reason</label>
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input" />
          </div>
          <button type="submit" className="btn-primary w-full">Book Appointment</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
