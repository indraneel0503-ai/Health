import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/auth';
import type { Prescription, Patient, PrescriptionItem } from '../../lib/types';

export default function PrescriptionsPage() {
  const { profile } = useAuth();
  const role = profile?.role ?? 'patient';
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewing, setViewing] = useState<Prescription | null>(null);
  const [viewItems, setViewItems] = useState<PrescriptionItem[]>([]);
  const [form, setForm] = useState({ patient_id: '', diagnosis: '', instructions: '' });
  const [items, setItems] = useState<{ medicine_name: string; dosage: string; duration: string; frequency: string }[]>([{ medicine_name: '', dosage: '', duration: '', frequency: '' }]);

  const load = async () => {
    let query = supabase.from('prescriptions').select('*, patient:patients(*), doctor:doctors(*)').order('created_at', { ascending: false });
    if (role === 'patient') {
      const { data: myPatient } = await supabase.from('patients').select('id').eq('user_id', profile?.id).maybeSingle();
      if (myPatient) query = query.eq('patient_id', myPatient.id);
    } else if (role === 'doctor') {
      const { data: myDoc } = await supabase.from('doctors').select('id').eq('user_id', profile?.id).maybeSingle();
      if (myDoc) query = query.eq('doctor_id', myDoc.id);
    }
    const { data } = await query;
    setPrescriptions((data as Prescription[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from('patients').select('*').order('full_name');
      setPatients(p ?? []);
      load();
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_id) { toast('Select a patient', 'error'); return; }
    const validItems = items.filter((i) => i.medicine_name);
    if (validItems.length === 0) { toast('Add at least one medicine', 'error'); return; }

    let doctorId = null;
    if (role === 'doctor') {
      const { data: myDoc } = await supabase.from('doctors').select('id').eq('user_id', profile?.id).maybeSingle();
      doctorId = myDoc?.id ?? null;
    }

    const { data: presc, error } = await supabase.from('prescriptions').insert({
      patient_id: form.patient_id,
      doctor_id: doctorId,
      diagnosis: form.diagnosis || null,
      instructions: form.instructions || null,
    }).select().single();
    if (error) { toast(error.message, 'error'); return; }

    await supabase.from('prescription_items').insert(
      validItems.map((i) => ({ prescription_id: presc.id, ...i }))
    );

    toast('Prescription created', 'success');
    setModalOpen(false);
    setForm({ patient_id: '', diagnosis: '', instructions: '' });
    setItems([{ medicine_name: '', dosage: '', duration: '', frequency: '' }]);
    load();
  };

  const viewPrescription = async (p: Prescription) => {
    const { data } = await supabase.from('prescription_items').select('*').eq('prescription_id', p.id);
    setViewItems(data ?? []);
    setViewing(p);
    setViewModalOpen(true);
  };

  const canCreate = ['admin', 'doctor'].includes(role);

  return (
    <DashboardLayout title="Prescriptions">
      <DataTable
        data={prescriptions}
        loading={loading}
        columns={[
          { key: 'patient', label: 'Patient', render: (p) => p.patient?.full_name ?? '—' },
          { key: 'doctor', label: 'Doctor', render: (p) => p.doctor?.full_name ?? '—' },
          { key: 'diagnosis', label: 'Diagnosis' },
          { key: 'created_at', label: 'Date', render: (p) => new Date(p.created_at).toLocaleDateString() },
          { key: 'actions', label: 'Actions', render: (p) => (
            <button onClick={() => viewPrescription(p)} className="btn-ghost p-1.5 text-sm">View</button>
          )},
        ]}
        searchKey="diagnosis"
        onAdd={canCreate ? () => setModalOpen(true) : undefined}
        addLabel="Create Prescription"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Prescription" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Patient</label>
            <select required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="input">
              <option value="">Select Patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Diagnosis</label>
            <input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className="input" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Medicines</label>
              <button type="button" onClick={() => setItems([...items, { medicine_name: '', dosage: '', duration: '', frequency: '' }])} className="btn-ghost text-sm">+ Add Medicine</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input placeholder="Medicine" value={item.medicine_name} onChange={(e) => { const n = [...items]; n[i].medicine_name = e.target.value; setItems(n); }} className="input col-span-4" />
                  <input placeholder="Dosage" value={item.dosage} onChange={(e) => { const n = [...items]; n[i].dosage = e.target.value; setItems(n); }} className="input col-span-3" />
                  <input placeholder="Frequency" value={item.frequency} onChange={(e) => { const n = [...items]; n[i].frequency = e.target.value; setItems(n); }} className="input col-span-2" />
                  <input placeholder="Duration" value={item.duration} onChange={(e) => { const n = [...items]; n[i].duration = e.target.value; setItems(n); }} className="input col-span-2" />
                  <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="btn-ghost col-span-1 text-error-500">✕</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Instructions</label>
            <textarea rows={2} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="input" />
          </div>
          <button type="submit" className="btn-primary w-full">Create Prescription</button>
        </form>
      </Modal>

      <Modal open={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Prescription Details" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Patient</p>
              <p className="font-medium">{viewing?.patient?.full_name}</p>
            </div>
            <div>
              <p className="text-gray-400">Doctor</p>
              <p className="font-medium">{viewing?.doctor?.full_name}</p>
            </div>
            <div>
              <p className="text-gray-400">Date</p>
              <p className="font-medium">{viewing && new Date(viewing.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-400">Diagnosis</p>
              <p className="font-medium">{viewing?.diagnosis ?? '—'}</p>
            </div>
          </div>
          {viewing?.instructions && (
            <div>
              <p className="text-gray-400 text-sm">Instructions</p>
              <p className="text-gray-700 dark:text-gray-300">{viewing.instructions}</p>
            </div>
          )}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Medicines</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 dark:border-gray-800">
                  <th className="py-2">Medicine</th>
                  <th className="py-2">Dosage</th>
                  <th className="py-2">Frequency</th>
                  <th className="py-2">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {viewItems.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2 font-medium">{it.medicine_name}</td>
                    <td className="py-2">{it.dosage ?? '—'}</td>
                    <td className="py-2">{it.frequency ?? '—'}</td>
                    <td className="py-2">{it.duration ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
