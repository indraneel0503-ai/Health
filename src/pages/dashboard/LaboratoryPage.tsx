import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/auth';
import type { LabOrder, LabTest, Patient, Doctor } from '../../lib/types';

export default function LaboratoryPage() {
  const { profile } = useAuth();
  const role = profile?.role ?? 'patient';
  const { toast } = useToast();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<LabOrder | null>(null);
  const [form, setForm] = useState({ patient_id: '', test_id: '', doctor_id: '' });
  const [resultForm, setResultForm] = useState({ result: '', report_url: '' });

  const load = async () => {
    let query = supabase.from('lab_orders').select('*, patient:patients(*), test:lab_tests(*), doctor:doctors(*)').order('ordered_at', { ascending: false });
    if (role === 'patient') {
      const { data: myPatient } = await supabase.from('patients').select('id').eq('user_id', profile?.id).maybeSingle();
      if (myPatient) query = query.eq('patient_id', myPatient.id);
    }
    const { data } = await query;
    setOrders((data as LabOrder[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: p }, { data: d }] = await Promise.all([
        supabase.from('lab_tests').select('*').order('name'),
        supabase.from('patients').select('*').order('full_name'),
        supabase.from('doctors').select('*').order('full_name'),
      ]);
      setTests(t ?? []);
      setPatients(p ?? []);
      setDoctors(d ?? []);
      load();
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let patientId = form.patient_id;
    if (role === 'patient' && !patientId) {
      const { data: myPatient } = await supabase.from('patients').select('id').eq('user_id', profile?.id).maybeSingle();
      if (myPatient) patientId = myPatient.id;
    }
    if (!patientId || !form.test_id) { toast('Please select patient and test', 'error'); return; }
    const { error } = await supabase.from('lab_orders').insert({
      patient_id: patientId,
      test_id: form.test_id,
      doctor_id: form.doctor_id || null,
    });
    if (error) { toast(error.message, 'error'); return; }
    toast('Lab test ordered', 'success');
    setModalOpen(false);
    setForm({ patient_id: '', test_id: '', doctor_id: '' });
    load();
  };

  const handleResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    const { error } = await supabase.from('lab_orders').update({
      status: 'completed',
      result: resultForm.result,
      report_url: resultForm.report_url || null,
      completed_at: new Date().toISOString(),
    }).eq('id', editingOrder.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Test result uploaded', 'success');
    setResultModalOpen(false);
    setResultForm({ result: '', report_url: '' });
    setEditingOrder(null);
    load();
  };

  const canOrder = ['admin', 'lab_technician', 'doctor', 'receptionist', 'patient'].includes(role);
  const canUpload = ['admin', 'lab_technician'].includes(role);

  return (
    <DashboardLayout title="Laboratory">
      <DataTable
        data={orders}
        loading={loading}
        columns={[
          { key: 'patient', label: 'Patient', render: (o) => o.patient?.full_name ?? '—' },
          { key: 'test', label: 'Test', render: (o) => o.test?.name ?? '—' },
          { key: 'ordered_at', label: 'Ordered', render: (o) => new Date(o.ordered_at).toLocaleDateString() },
          { key: 'status', label: 'Status', render: (o) => <span className={`badge-${o.status === 'completed' ? 'success' : o.status === 'cancelled' ? 'error' : 'warning'}`}>{o.status}</span> },
          { key: 'result', label: 'Result', render: (o) => o.result ? <span className="line-clamp-1 max-w-xs">{o.result}</span> : '—' },
          { key: 'actions', label: 'Actions', render: (o) => (
            <div className="flex gap-1">
              {canUpload && o.status === 'pending' && (
                <button onClick={() => { setEditingOrder(o); setResultForm({ result: '', report_url: '' }); setResultModalOpen(true); }} className="btn-ghost p-1.5 text-sm">Upload Result</button>
              )}
              {o.report_url && (
                <a href={o.report_url} target="_blank" rel="noreferrer" className="btn-ghost p-1.5 text-sm">View Report</a>
              )}
            </div>
          )},
        ]}
        searchKey="patient_id"
        onAdd={canOrder ? () => setModalOpen(true) : undefined}
        addLabel="Order Test"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Order Lab Test">
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
            <label className="label">Test</label>
            <select required value={form.test_id} onChange={(e) => setForm({ ...form, test_id: e.target.value })} className="input">
              <option value="">Select Test</option>
              {tests.map((t) => <option key={t.id} value={t.id}>{t.name} - ${t.price}</option>)}
            </select>
          </div>
          {role !== 'doctor' && (
            <div>
              <label className="label">Referring Doctor (optional)</label>
              <select value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} className="input">
                <option value="">None</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </div>
          )}
          <button type="submit" className="btn-primary w-full">Order Test</button>
        </form>
      </Modal>

      <Modal open={resultModalOpen} onClose={() => setResultModalOpen(false)} title="Upload Test Result">
        <form onSubmit={handleResult} className="space-y-4">
          <div>
            <label className="label">Result</label>
            <textarea rows={4} required value={resultForm.result} onChange={(e) => setResultForm({ ...resultForm, result: e.target.value })} className="input" placeholder="Enter test results..." />
          </div>
          <div>
            <label className="label">Report URL (optional)</label>
            <input value={resultForm.report_url} onChange={(e) => setResultForm({ ...resultForm, report_url: e.target.value })} className="input" placeholder="https://..." />
          </div>
          <button type="submit" className="btn-primary w-full">Upload Result</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
