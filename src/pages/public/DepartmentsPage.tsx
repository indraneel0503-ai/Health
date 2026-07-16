import { useEffect, useState } from 'react';
import { HeartPulse, Brain, Bone, Baby, Eye, Stethoscope, Activity, Shield, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Department } from '../../lib/types';

const iconMap: Record<string, React.ReactNode> = {
  heart: <HeartPulse className="w-8 h-8" />,
  brain: <Brain className="w-8 h-8" />,
  bone: <Bone className="w-8 h-8" />,
  baby: <Baby className="w-8 h-8" />,
  eye: <Eye className="w-8 h-8" />,
  stethoscope: <Stethoscope className="w-8 h-8" />,
  activity: <Activity className="w-8 h-8" />,
  hand: <Shield className="w-8 h-8" />,
  ear: <Stethoscope className="w-8 h-8" />,
  users: <Users className="w-8 h-8" />,
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('departments').select('*').then(({ data }) => {
      setDepartments(data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="bg-primary-700 py-16 text-center">
        <h1 className="text-3xl lg:text-4xl font-bold text-white">Our Departments</h1>
        <p className="mt-3 text-primary-100 max-w-2xl mx-auto px-4">
          We offer specialized care across all major medical departments, staffed by experienced professionals.
        </p>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <div key={dept.id} className="card p-6 hover:shadow-md transition-all">
                <div className="inline-flex p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl mb-4">
                  {iconMap[dept.icon ?? 'stethoscope'] ?? <Stethoscope className="w-8 h-8" />}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{dept.name}</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{dept.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
