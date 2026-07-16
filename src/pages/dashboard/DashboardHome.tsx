import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Stethoscope, CalendarDays, BedDouble, Pill, FlaskConical,
  Activity, TrendingUp, AlertCircle,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/auth';
import type { Appointment, Invoice } from '../../lib/types';

const COLORS = ['#2563eb', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardHome() {
  const { profile } = useAuth();
  const role = profile?.role ?? 'patient';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ patients: 0, doctors: 0, appointments: 0, revenue: 0, beds: 0, lowStock: 0, pendingLabs: 0, todayAppts: 0 });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [revenueData, setRevenueData] = useState<{ name: string; revenue: number; appointments: number }[]>([]);
  const [deptData, setDeptData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split('T')[0];

      const [
        { count: patientCount }, { count: doctorCount },
        { count: apptCount }, { data: invoices },
        { count: bedCount }, { data: meds },
        { count: labCount },
        { data: todayAppts },
        { data: allAppts },
        { data: depts }, { data: deptAppts },
      ] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('doctors').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('total_amount, created_at'),
        supabase.from('beds').select('*', { count: 'exact', head: true }),
        supabase.from('medicines').select('stock_qty, reorder_level'),
        supabase.from('lab_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('appointments').select('*, patient:patients(*), doctor:doctors(*)').eq('appointment_date', today).order('appointment_time').limit(5),
        supabase.from('appointments').select('appointment_date, status'),
        supabase.from('departments').select('*'),
        supabase.from('appointments').select('doctor:doctors(department_id)'),
      ]);

      const totalRevenue = (invoices ?? []).reduce((sum, inv) => sum + Number((inv as Invoice).total_amount || 0), 0);
      const lowStock = (meds ?? []).filter((m: { stock_qty: number; reorder_level: number }) => m.stock_qty <= m.reorder_level).length;

      setStats({
        patients: patientCount ?? 0,
        doctors: doctorCount ?? 0,
        appointments: apptCount ?? 0,
        revenue: totalRevenue,
        beds: bedCount ?? 0,
        lowStock,
        pendingLabs: labCount ?? 0,
        todayAppts: (todayAppts as Appointment[])?.length ?? 0,
      });
      setAppointments((todayAppts as Appointment[]) ?? []);

      // Revenue by month (last 6 months)
      const months: { name: string; revenue: number; appointments: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const monthInv = (invoices ?? []).filter((inv: { created_at: string; total_amount: number }) => {
          const id = new Date(inv.created_at);
          return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear();
        });
        const monthAppts = (allAppts ?? []).filter((a: { appointment_date: string }) => {
          const ad = new Date(a.appointment_date);
          return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
        });
        months.push({
          name: monthName,
          revenue: monthInv.reduce((s, inv) => s + Number(inv.total_amount || 0), 0),
          appointments: monthAppts.length,
        });
      }
      setRevenueData(months);

      // Appointments by department
      const deptMap: Record<string, number> = {};
      (deptAppts ?? []).forEach((a) => {
        const did = (a as { doctor?: { department_id?: string } }).doctor?.department_id;
        if (did) deptMap[did] = (deptMap[did] ?? 0) + 1;
      });
      const deptChartData = (depts ?? []).map((d) => ({
        name: d.name,
        value: deptMap[d.id] ?? 0,
      })).filter((d) => d.value > 0);
      setDeptData(deptChartData);

      setLoading(false);
    })();
  }, []);

  const roleTitle: Record<string, string> = {
    admin: 'Admin Dashboard',
    doctor: 'Doctor Dashboard',
    receptionist: 'Reception Dashboard',
    pharmacist: 'Pharmacy Dashboard',
    lab_technician: 'Laboratory Dashboard',
    patient: 'Patient Portal',
  };

  return (
    <DashboardLayout title={roleTitle[role] ?? 'Dashboard'}>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {role === 'admin' && (
              <>
                <StatCard title="Total Patients" value={stats.patients} icon={<Users className="w-6 h-6" />} color="primary" />
                <StatCard title="Total Doctors" value={stats.doctors} icon={<Stethoscope className="w-6 h-6" />} color="accent" />
                <StatCard title="Appointments" value={stats.appointments} icon={<CalendarDays className="w-6 h-6" />} color="success" />
                <StatCard title="Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={<TrendingUp className="w-6 h-6" />} color="warning" />
                <StatCard title="Total Beds" value={stats.beds} icon={<BedDouble className="w-6 h-6" />} color="primary" />
                <StatCard title="Low Stock Items" value={stats.lowStock} icon={<AlertCircle className="w-6 h-6" />} color="error" />
                <StatCard title="Pending Lab Tests" value={stats.pendingLabs} icon={<FlaskConical className="w-6 h-6" />} color="accent" />
                <StatCard title="Today's Appointments" value={stats.todayAppts} icon={<Activity className="w-6 h-6" />} color="success" />
              </>
            )}
            {role === 'doctor' && (
              <>
                <StatCard title="Today's Appointments" value={stats.todayAppts} icon={<CalendarDays className="w-6 h-6" />} color="primary" />
                <StatCard title="Total Appointments" value={stats.appointments} icon={<Activity className="w-6 h-6" />} color="accent" />
                <StatCard title="Total Patients" value={stats.patients} icon={<Users className="w-6 h-6" />} color="success" />
              </>
            )}
            {role === 'receptionist' && (
              <>
                <StatCard title="Today's Appointments" value={stats.todayAppts} icon={<CalendarDays className="w-6 h-6" />} color="primary" />
                <StatCard title="Total Patients" value={stats.patients} icon={<Users className="w-6 h-6" />} color="accent" />
                <StatCard title="Total Doctors" value={stats.doctors} icon={<Stethoscope className="w-6 h-6" />} color="success" />
                <StatCard title="Total Beds" value={stats.beds} icon={<BedDouble className="w-6 h-6" />} color="warning" />
              </>
            )}
            {role === 'pharmacist' && (
              <>
                <StatCard title="Low Stock Items" value={stats.lowStock} icon={<AlertCircle className="w-6 h-6" />} color="error" />
                <StatCard title="Total Medicines" value={stats.beds} icon={<Pill className="w-6 h-6" />} color="primary" />
              </>
            )}
            {role === 'lab_technician' && (
              <>
                <StatCard title="Pending Tests" value={stats.pendingLabs} icon={<FlaskConical className="w-6 h-6" />} color="warning" />
                <StatCard title="Total Patients" value={stats.patients} icon={<Users className="w-6 h-6" />} color="primary" />
              </>
            )}
            {role === 'patient' && (
              <>
                <StatCard title="My Appointments" value={stats.appointments} icon={<CalendarDays className="w-6 h-6" />} color="primary" />
                <StatCard title="Available Doctors" value={stats.doctors} icon={<Stethoscope className="w-6 h-6" />} color="accent" />
              </>
            )}
          </div>

          {/* Charts */}
          {role === 'admin' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue & Appointments Trend</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#revGrad)" name="Revenue ($)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Appointments by Department</h3>
                {deptData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-400 py-20">No data yet</p>
                )}
              </div>
            </div>
          )}

          {/* Today's appointments */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Today's Appointments</h3>
              <Link to="/dashboard/appointments" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
            </div>
            {appointments.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No appointments scheduled for today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                      <th className="py-2 font-medium">Time</th>
                      <th className="py-2 font-medium">Patient</th>
                      <th className="py-2 font-medium">Doctor</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {appointments.map((a) => (
                      <tr key={a.id} className="table-row-hover">
                        <td className="py-2 text-gray-700 dark:text-gray-300">{a.appointment_time?.slice(0, 5)}</td>
                        <td className="py-2 text-gray-700 dark:text-gray-300">{a.patient?.full_name ?? '—'}</td>
                        <td className="py-2 text-gray-700 dark:text-gray-300">{a.doctor?.full_name ?? '—'}</td>
                        <td className="py-2">
                          <span className={`badge-${a.status === 'completed' ? 'success' : a.status === 'cancelled' ? 'error' : a.status === 'no_show' ? 'warning' : 'primary'}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
