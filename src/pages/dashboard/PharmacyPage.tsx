import { useEffect, useState } from 'react';
import { AlertCircle, Pill } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatCard from '../../components/StatCard';
import { useToast } from '../../components/Toast';
import { supabase } from '../../lib/auth';
import type { Medicine, Patient } from '../../lib/types';

export default function PharmacyPage() {
  const { toast } = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [form, setForm] = useState({ name: '', manufacturer: '', category: '', unit: '', price: 0, stock_qty: 0, reorder_level: 10, expiry_date: '', batch_no: '' });
  const [saleForm, setSaleForm] = useState({ medicine_id: '', patient_id: '', quantity: 1 });

  const load = async () => {
    const { data } = await supabase.from('medicines').select('*').order('name');
    setMedicines(data ?? []);
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
    const payload = { ...form, price: Number(form.price), stock_qty: Number(form.stock_qty), reorder_level: Number(form.reorder_level), expiry_date: form.expiry_date || null };
    if (editing) {
      const { error } = await supabase.from('medicines').update(payload).eq('id', editing.id);
      if (error) { toast(error.message, 'error'); return; }
      toast('Medicine updated', 'success');
    } else {
      const { error } = await supabase.from('medicines').insert(payload);
      if (error) { toast(error.message, 'error'); return; }
      toast('Medicine added', 'success');
    }
    setModalOpen(false);
    setEditing(null);
    load();
  };

  const handleEdit = (m: Medicine) => {
    setEditing(m);
    setForm({ name: m.name, manufacturer: m.manufacturer ?? '', category: m.category ?? '', unit: m.unit ?? '', price: m.price, stock_qty: m.stock_qty, reorder_level: m.reorder_level, expiry_date: m.expiry_date ?? '', batch_no: m.batch_no ?? '' });
    setModalOpen(true);
  };

  const handleDelete = async (m: Medicine) => {
    if (!confirm(`Delete medicine "${m.name}"?`)) return;
    const { error } = await supabase.from('medicines').delete().eq('id', m.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Medicine deleted', 'success');
    load();
  };

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const med = medicines.find((m) => m.id === saleForm.medicine_id);
    if (!med) { toast('Select a medicine', 'error'); return; }
    if (med.stock_qty < saleForm.quantity) { toast('Insufficient stock', 'error'); return; }
    const total = med.price * saleForm.quantity;
    const { error: saleError } = await supabase.from('medicine_sales').insert({
      medicine_id: saleForm.medicine_id,
      patient_id: saleForm.patient_id || null,
      quantity: saleForm.quantity,
      total_amount: total,
    });
    if (saleError) { toast(saleError.message, 'error'); return; }
    await supabase.from('medicines').update({ stock_qty: med.stock_qty - saleForm.quantity }).eq('id', med.id);
    toast(`Sale recorded: $${total}`, 'success');
    setSaleModalOpen(false);
    setSaleForm({ medicine_id: '', patient_id: '', quantity: 1 });
    load();
  };

  const lowStock = medicines.filter((m) => m.stock_qty <= m.reorder_level);

  return (
    <DashboardLayout title="Pharmacy Management">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Medicines" value={medicines.length} icon={<Pill className="w-6 h-6" />} color="primary" />
        <StatCard title="Low Stock Alerts" value={lowStock.length} icon={<AlertCircle className="w-6 h-6" />} color="error" />
        <StatCard title="Total Stock Units" value={medicines.reduce((s, m) => s + m.stock_qty, 0)} icon={<Pill className="w-6 h-6" />} color="accent" />
      </div>

      {lowStock.length > 0 && (
        <div className="card p-4 mb-4 border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20">
          <div className="flex items-center gap-2 text-error-700 dark:text-error-400">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">Low Stock Alert: {lowStock.map((m) => m.name).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setSaleModalOpen(true)} className="btn-accent">
          <Pill className="w-4 h-4" /> New Sale
        </button>
      </div>

      <DataTable
        data={medicines}
        loading={loading}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'manufacturer', label: 'Manufacturer' },
          { key: 'category', label: 'Category' },
          { key: 'price', label: 'Price', render: (m) => `$${m.price}` },
          { key: 'stock_qty', label: 'Stock', render: (m) => <span className={m.stock_qty <= m.reorder_level ? 'text-error-600 font-medium' : ''}>{m.stock_qty}</span> },
          { key: 'expiry_date', label: 'Expiry', render: (m) => m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : '—' },
        ]}
        searchKey="name"
        onAdd={() => { setEditing(null); setForm({ name: '', manufacturer: '', category: '', unit: '', price: 0, stock_qty: 0, reorder_level: 10, expiry_date: '', batch_no: '' }); setModalOpen(true); }}
        addLabel="Add Medicine"
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Medicine' : 'Add Medicine'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Manufacturer</label>
              <input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Unit</label>
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Price ($)</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="input" />
            </div>
            <div>
              <label className="label">Stock Quantity</label>
              <input type="number" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: Number(e.target.value) })} className="input" />
            </div>
            <div>
              <label className="label">Reorder Level</label>
              <input type="number" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })} className="input" />
            </div>
            <div>
              <label className="label">Expiry Date</label>
              <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Batch No.</label>
              <input value={form.batch_no} onChange={(e) => setForm({ ...form, batch_no: e.target.value })} className="input" />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">{editing ? 'Update' : 'Add'}</button>
        </form>
      </Modal>

      <Modal open={saleModalOpen} onClose={() => setSaleModalOpen(false)} title="New Medicine Sale">
        <form onSubmit={handleSale} className="space-y-4">
          <div>
            <label className="label">Medicine</label>
            <select required value={saleForm.medicine_id} onChange={(e) => setSaleForm({ ...saleForm, medicine_id: e.target.value })} className="input">
              <option value="">Select Medicine</option>
              {medicines.map((m) => <option key={m.id} value={m.id}>{m.name} (${m.price}) - Stock: {m.stock_qty}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Patient (optional)</label>
            <select value={saleForm.patient_id} onChange={(e) => setSaleForm({ ...saleForm, patient_id: e.target.value })} className="input">
              <option value="">Walk-in Customer</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input type="number" min="1" required value={saleForm.quantity} onChange={(e) => setSaleForm({ ...saleForm, quantity: Number(e.target.value) })} className="input" />
          </div>
          <button type="submit" className="btn-primary w-full">Record Sale</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
