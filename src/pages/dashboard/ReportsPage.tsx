import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import { Users, Stethoscope, CalendarDays, TrendingUp, Download } from 'lucide-react';
import { supabase } from '../../lib/auth';
import { useToast } from '../../components/Toast';

const COLORS = ['#2563eb', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReportsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<{ name: string; appointments: number; revenue: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
  const [deptData, setDeptData] = useState<{ name: string; patients: number }[]>([]);
  const [stats, setStats] = useState({ totalPatients: 0, totalDoctors: 0, totalAppts: 0, totalRevenue: 0 });

  useEffect(() => {
    (async () => {
      const [
        { count: patients }, { count: doctors }, { count: appts },
        { data: invoices }, { data: allAppts }, { data: depts }, { data: deptAppts },
      ] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('doctors').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('total_amount, created_at'),
        supabase.from('appointments').select('appointment_date, status'),
        supabase.from('departments').select('*'),
        supabase.from('appointments').select('patient:patients(*), doctor:doctors(*)'),
      ]);

      const totalRevenue = (invoices ?? []).reduce((s, inv) => s + Number((inv as { total_amount: number }).total_amount || 0), 0);
      setStats({ totalPatients: patients ?? 0, totalDoctors: doctors ?? 0, totalAppts: appts ?? 0, totalRevenue });

      // Monthly data (last 12 months)
      const months: { name: string; appointments: number; revenue: number }[] = [];
      for (let i = 11; i >= 0; i--) {
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
        months.push({ name: monthName, appointments: monthAppts.length, revenue: monthInv.reduce((s, inv) => s + Number(inv.total_amount || 0), 0) });
      }
      setMonthlyData(months);

      // Appointment status distribution
      const statusMap: Record<string, number> = {};
      (allAppts ?? []).forEach((a: { status: string }) => {
        statusMap[a.status] = (statusMap[a.status] ?? 0) + 1;
      });
      setStatusData(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

      // Patients by department
      const deptPatientMap: Record<string, number> = {};
      (deptAppts ?? []).forEach((a: Record<string, unknown>) => {
        const did = (a as { doctor?: { department_id?: string } }).doctor?.department_id;
        if (did) {
          if (!deptPatientMap[did]) deptPatientMap[did] = 0;
          deptPatientMap[did] += 1;
        }
      });
      setDeptData((depts ?? []).map((d) => ({ name: d.name, patients: deptPatientMap[d.id] ?? 0 })));

      setLoading(false);
    })();
  }, []);

  const exportCSV = () => {
    const csv = ['Month,Appointments,Revenue'];
    monthlyData.forEach((m) => csv.push(`${m.name},${m.appointments},${m.revenue}`));
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hospital-report.csv';
    a.click();
    toast('Report exported as CSV', 'success');
  };

  return (
    <DashboardLayout title="Reports & Analytics">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={exportCSV} className="btn-secondary">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Patients" value={stats.totalPatients} icon={<Users className="w-6 h-6" />} color="primary" />
            <StatCard title="Total Doctors" value={stats.totalDoctors} icon={<Stethoscope className="w-6 h-6" />} color="accent" />
            <StatCard title="Total Appointments" value={stats.totalAppts} icon={<CalendarDays className="w-6 h-6" />} color="success" />
            <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={<TrendingUp className="w-6 h-6" />} color="warning" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Appointments & Revenue</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="appointments" stroke="#2563eb" name="Appointments" />
                  <Line type="monotone" dataKey="revenue" stroke="#22c55e" name="Revenue ($)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Appointment Status Distribution</h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-gray-400 py-20">No data</p>}
            </div>

            <div className="card p-5 lg:col-span-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Patients by Department</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="patients" fill="#06b6d4" name="Patients" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
