import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { supabase } from '../../lib/auth';
import type { Room, Bed } from '../../lib/types';

export default function RoomsPage() {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [bedModalOpen, setBedModalOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [form, setForm] = useState({ room_number: '', room_type: 'general', floor: 1, price_per_day: 0, is_active: true });
  const [bedForm, setBedForm] = useState({ bed_number: '', status: 'available' });

  const load = async () => {
    const { data } = await supabase.from('rooms').select('*, beds(*)').order('room_number');
    setRooms((data as Room[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, floor: Number(form.floor), price_per_day: Number(form.price_per_day) };
    if (editing) {
      const { error } = await supabase.from('rooms').update(payload).eq('id', editing.id);
      if (error) { toast(error.message, 'error'); return; }
      toast('Room updated', 'success');
    } else {
      const { error } = await supabase.from('rooms').insert(payload);
      if (error) { toast(error.message, 'error'); return; }
      toast('Room added', 'success');
    }
    setModalOpen(false);
    setEditing(null);
    load();
  };

  const handleEdit = (r: Room) => {
    setEditing(r);
    setForm({ room_number: r.room_number, room_type: r.room_type, floor: r.floor, price_per_day: r.price_per_day, is_active: r.is_active });
    setModalOpen(true);
  };

  const handleDelete = async (r: Room) => {
    if (!confirm(`Delete room ${r.room_number}?`)) return;
    const { error } = await supabase.from('rooms').delete().eq('id', r.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Room deleted', 'success');
    load();
  };

  const addBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    const { error } = await supabase.from('beds').insert({ room_id: selectedRoom.id, ...bedForm });
    if (error) { toast(error.message, 'error'); return; }
    toast('Bed added', 'success');
    setBedModalOpen(false);
    setBedForm({ bed_number: '', status: 'available' });
    load();
  };

  const updateBedStatus = async (bed: Bed, status: string) => {
    const { error } = await supabase.from('beds').update({ status }).eq('id', bed.id);
    if (error) { toast(error.message, 'error'); return; }
    load();
  };

  const roomTypeColors: Record<string, string> = {
    general: 'primary', private: 'accent', icu: 'error', ward: 'success', emergency: 'warning',
  };

  return (
    <DashboardLayout title="Rooms & Beds">
      <DataTable
        data={rooms}
        loading={loading}
        columns={[
          { key: 'room_number', label: 'Room' },
          { key: 'room_type', label: 'Type', render: (r) => <span className={`badge-${roomTypeColors[r.room_type]}`}>{r.room_type.toUpperCase()}</span> },
          { key: 'floor', label: 'Floor' },
          { key: 'price_per_day', label: 'Price/Day', render: (r) => `$${r.price_per_day}` },
          { key: 'beds', label: 'Beds', render: (r) => {
            const beds = r.beds ?? [];
            const available = beds.filter((b) => b.status === 'available').length;
            return `${available}/${beds.length} available`;
          }},
          { key: 'actions', label: 'Actions', render: (r) => (
            <button onClick={() => { setSelectedRoom(r); setBedModalOpen(true); }} className="btn-ghost p-1.5 text-sm">Manage Beds</button>
          )},
        ]}
        searchKey="room_number"
        onAdd={() => { setEditing(null); setForm({ room_number: '', room_type: 'general', floor: 1, price_per_day: 0, is_active: true }); setModalOpen(true); }}
        addLabel="Add Room"
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {selectedRoom && (
        <div className="mt-4 card p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Beds in Room {selectedRoom.room_number}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {(selectedRoom.beds ?? []).map((bed) => (
              <div key={bed.id} className={`card p-3 text-center border-2 ${bed.status === 'available' ? 'border-success-200 dark:border-success-800' : bed.status === 'occupied' ? 'border-error-200 dark:border-error-800' : 'border-warning-200 dark:border-warning-800'}`}>
                <p className="font-medium text-sm">{bed.bed_number}</p>
                <p className={`text-xs mt-1 ${bed.status === 'available' ? 'text-success-600' : bed.status === 'occupied' ? 'text-error-600' : 'text-warning-600'}`}>{bed.status}</p>
                <select value={bed.status} onChange={(e) => updateBedStatus(bed, e.target.value)} className="input mt-2 text-xs py-1">
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Room' : 'Add Room'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Room Number</label>
            <input required value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Room Type</label>
            <select value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })} className="input">
              {['general', 'private', 'icu', 'ward', 'emergency'].map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Floor</label>
              <input type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })} className="input" />
            </div>
            <div>
              <label className="label">Price/Day ($)</label>
              <input type="number" step="0.01" value={form.price_per_day} onChange={(e) => setForm({ ...form, price_per_day: Number(e.target.value) })} className="input" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
            Active
          </label>
          <button type="submit" className="btn-primary w-full">{editing ? 'Update' : 'Add'}</button>
        </form>
      </Modal>

      <Modal open={bedModalOpen} onClose={() => setBedModalOpen(false)} title={`Add Bed to Room ${selectedRoom?.room_number ?? ''}`}>
        <form onSubmit={addBed} className="space-y-4">
          <div>
            <label className="label">Bed Number</label>
            <input required value={bedForm.bed_number} onChange={(e) => setBedForm({ ...bedForm, bed_number: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Status</label>
            <select value={bedForm.status} onChange={(e) => setBedForm({ ...bedForm, status: e.target.value })} className="input">
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full">Add Bed</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
