import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/auth';
import type { Invoice, Patient, InvoiceItem } from '../../lib/types';

export default function BillingPage() {
  const { profile } = useAuth();
  const role = profile?.role ?? 'patient';
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [form, setForm] = useState({ patient_id: '', tax_percent: 0, notes: '' });
  const [lineItems, setLineItems] = useState<{ description: string; quantity: number; unit_price: number }[]>([{ description: '', quantity: 1, unit_price: 0 }]);

  const load = async () => {
    let query = supabase.from('invoices').select('*, patient:patients(*)').order('created_at', { ascending: false });
    if (role === 'patient') {
      const { data: myPatient } = await supabase.from('patients').select('id').eq('user_id', profile?.id).maybeSingle();
      if (myPatient) query = query.eq('patient_id', myPatient.id);
    }
    const { data } = await query;
    setInvoices((data as Invoice[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from('patients').select('*').order('full_name');
      setPatients(p ?? []);
      load();
    })();
  }, []);

  const subtotal = lineItems.reduce((s, item) => s + item.quantity * item.unit_price, 0);
  const taxAmount = (subtotal * form.tax_percent) / 100;
  const total = subtotal + taxAmount;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_id) { toast('Select a patient', 'error'); return; }
    if (lineItems.every((i) => !i.description)) { toast('Add at least one item', 'error'); return; }

    const validItems = lineItems.filter((i) => i.description);
    const { data: inv, error } = await supabase.from('invoices').insert({
      patient_id: form.patient_id,
      subtotal,
      tax_percent: Number(form.tax_percent),
      tax_amount: taxAmount,
      total_amount: total,
      notes: form.notes || null,
      created_by: profile?.id,
    }).select().single();
    if (error) { toast(error.message, 'error'); return; }

    const invItems = validItems.map((i) => ({
      invoice_id: inv.id,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total_price: i.quantity * i.unit_price,
    }));
    await supabase.from('invoice_items').insert(invItems);

    toast('Invoice created', 'success');
    setModalOpen(false);
    setForm({ patient_id: '', tax_percent: 0, notes: '' });
    setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
    load();
  };

  const viewInvoice = async (inv: Invoice) => {
    const { data } = await supabase.from('invoice_items').select('*').eq('invoice_id', inv.id);
    setItems(data ?? []);
    setViewing(inv);
    setViewModalOpen(true);
  };

  const markPaid = async (inv: Invoice) => {
    const { error } = await supabase.from('invoices').update({ status: 'paid', paid_amount: inv.total_amount, payment_method: 'cash' }).eq('id', inv.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Invoice marked as paid', 'success');
    load();
  };

  const canCreate = ['admin', 'receptionist'].includes(role);

  return (
    <DashboardLayout title="Billing & Invoices">
      <DataTable
        data={invoices}
        loading={loading}
        columns={[
          { key: 'invoice_no', label: 'Invoice #' },
          { key: 'patient', label: 'Patient', render: (i) => i.patient?.full_name ?? '—' },
          { key: 'total_amount', label: 'Amount', render: (i) => `$${i.total_amount}` },
          { key: 'status', label: 'Status', render: (i) => <span className={`badge-${i.status === 'paid' ? 'success' : i.status === 'cancelled' ? 'error' : i.status === 'partially_paid' ? 'warning' : 'gray'}`}>{i.status}</span> },
          { key: 'created_at', label: 'Date', render: (i) => new Date(i.created_at).toLocaleDateString() },
          { key: 'actions', label: 'Actions', render: (i) => (
            <div className="flex gap-1">
              <button onClick={() => viewInvoice(i)} className="btn-ghost p-1.5 text-sm">View</button>
              {canCreate && i.status !== 'paid' && (
                <button onClick={() => markPaid(i)} className="btn-ghost p-1.5 text-sm text-success-600">Mark Paid</button>
              )}
            </div>
          )},
        ]}
        searchKey="invoice_no"
        onAdd={canCreate ? () => setModalOpen(true) : undefined}
        addLabel="Create Invoice"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Invoice" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Patient</label>
            <select required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="input">
              <option value="">Select Patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Line Items</label>
              <button type="button" onClick={() => setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0 }])} className="btn-ghost text-sm">+ Add Item</button>
            </div>
            <div className="space-y-2">
              {lineItems.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input placeholder="Description" value={item.description} onChange={(e) => { const n = [...lineItems]; n[i].description = e.target.value; setLineItems(n); }} className="input col-span-6" />
                  <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => { const n = [...lineItems]; n[i].quantity = Number(e.target.value); setLineItems(n); }} className="input col-span-2" />
                  <input type="number" step="0.01" placeholder="Price" value={item.unit_price} onChange={(e) => { const n = [...lineItems]; n[i].unit_price = Number(e.target.value); setLineItems(n); }} className="input col-span-3" />
                  <button type="button" onClick={() => setLineItems(lineItems.filter((_, idx) => idx !== i))} className="btn-ghost col-span-1 text-error-500">✕</button>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tax (%)</label>
              <input type="number" step="0.01" value={form.tax_percent} onChange={(e) => setForm({ ...form, tax_percent: Number(e.target.value) })} className="input" />
            </div>
            <div>
              <label className="label">Notes</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" />
            </div>
          </div>
          <div className="card p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax ({form.tax_percent}%):</span><span>${taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base"><span>Total:</span><span>${total.toFixed(2)}</span></div>
          </div>
          <button type="submit" className="btn-primary w-full">Create Invoice</button>
        </form>
      </Modal>

      <Modal open={viewModalOpen} onClose={() => setViewModalOpen(false)} title={`Invoice ${viewing?.invoice_no ?? ''}`} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Patient</p>
              <p className="font-medium">{viewing?.patient?.full_name}</p>
            </div>
            <div>
              <p className="text-gray-400">Date</p>
              <p className="font-medium">{viewing && new Date(viewing.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-400">Status</p>
              <span className={`badge-${viewing?.status === 'paid' ? 'success' : 'gray'}`}>{viewing?.status}</span>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100 dark:border-gray-800">
                <th className="py-2">Description</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Price</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="py-2">{it.description}</td>
                  <td className="py-2">{it.quantity}</td>
                  <td className="py-2">${it.unit_price}</td>
                  <td className="py-2 text-right">${it.total_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal:</span><span>${viewing?.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax:</span><span>${viewing?.tax_amount.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base"><span>Total:</span><span>${viewing?.total_amount.toFixed(2)}</span></div>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
