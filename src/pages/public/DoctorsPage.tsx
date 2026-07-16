import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Calendar, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Doctor } from '../../lib/types';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('doctors')
      .select('*, department:departments(*)')
      .eq('is_active', true)
      .then(({ data }) => {
        setDoctors(data as Doctor[] ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="bg-primary-700 py-16 text-center">
        <h1 className="text-3xl lg:text-4xl font-bold text-white">Our Doctors</h1>
        <p className="mt-3 text-primary-100 max-w-2xl mx-auto px-4">
          Meet our team of experienced and compassionate medical professionals.
        </p>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : doctors.length === 0 ? (
          <p className="text-center text-gray-400">No doctors found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc) => (
              <div key={doc.id} className="card overflow-hidden hover:shadow-md transition-all">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center">
                  {doc.avatar_url ? (
                    <img src={doc.avatar_url} alt={doc.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <Stethoscope className="w-20 h-20 text-primary-400" />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{doc.full_name}</h3>
                  <p className="text-sm text-primary-600 dark:text-primary-400">{doc.specialization}</p>
                  <p className="text-xs text-gray-400 mt-1">{doc.department?.name}</p>
                  {doc.qualifications && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
                      <Award className="w-4 h-4" /> {doc.qualifications}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{doc.experience_years} years experience</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      ${doc.consultation_fee}
                    </span>
                    <Link to="/register" className="btn-primary text-xs">
                      <Calendar className="w-3.5 h-3.5" /> Book
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
