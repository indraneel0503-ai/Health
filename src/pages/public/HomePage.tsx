import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse, Stethoscope, Brain, Bone, Baby, Eye, Activity, Shield,
  Clock, Users, Award, Phone, ArrowRight, Star, Calendar, Ambulance,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { CmsBanner, CmsTestimonial, Department, Doctor, CmsBlog } from '../../lib/types';

const iconMap: Record<string, React.ReactNode> = {
  heart: <HeartPulse className="w-7 h-7" />,
  brain: <Brain className="w-7 h-7" />,
  bone: <Bone className="w-7 h-7" />,
  baby: <Baby className="w-7 h-7" />,
  eye: <Eye className="w-7 h-7" />,
  stethoscope: <Stethoscope className="w-7 h-7" />,
  activity: <Activity className="w-7 h-7" />,
  hand: <Shield className="w-7 h-7" />,
  ear: <Stethoscope className="w-7 h-7" />,
  users: <Users className="w-7 h-7" />,
};

export default function HomePage() {
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [testimonials, setTestimonials] = useState<CmsTestimonial[]>([]);
  const [blogs, setBlogs] = useState<CmsBlog[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: b }, { data: d }, { data: doc }, { data: t }, { data: bl }] = await Promise.all([
        supabase.from('cms_banners').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('departments').select('*'),
        supabase.from('doctors').select('*, department:departments(*)').eq('is_active', true).limit(4),
        supabase.from('cms_testimonials').select('*').eq('is_published', true).limit(3),
        supabase.from('cms_blogs').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(3),
      ]);
      setBanners(b ?? []);
      setDepartments(d ?? []);
      setDoctors(doc as Doctor[] ?? []);
      setTestimonials(t ?? []);
      setBlogs(bl ?? []);
    })();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const banner = banners[currentBanner];

  return (
    <div>
      {/* Hero / Banner */}
      <section className="relative bg-gray-900 overflow-hidden">
        {banner?.image_url && (
          <div className="absolute inset-0">
            <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover opacity-40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-2xl">
            <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight animate-slide-up">
              {banner?.title ?? 'Your Health, Our Priority'}
            </h1>
            <p className="mt-4 text-lg text-gray-200 animate-slide-up">
              {banner?.subtitle ?? 'Compassionate care with advanced medical technology for you and your loved ones.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-slide-up">
              <Link to="/register" className="btn-primary text-base">
                <Calendar className="w-5 h-5" /> Book Appointment
              </Link>
              <Link to="/departments" className="btn bg-white text-primary-700 hover:bg-gray-100 text-base">
                Explore Departments <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
        {banners.length > 1 && (
          <div className="relative flex gap-2 justify-center pb-4">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBanner(i)}
                className={`h-2 rounded-full transition-all ${i === currentBanner ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="bg-primary-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Users className="w-8 h-8" />, value: '500K+', label: 'Patients Served' },
            { icon: <Stethoscope className="w-8 h-8" />, value: '200+', label: 'Expert Doctors' },
            { icon: <Award className="w-8 h-8" />, value: '30+', label: 'Specialties' },
            { icon: <Clock className="w-8 h-8" />, value: '24/7', label: 'Emergency Care' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="inline-flex p-3 bg-white/10 rounded-lg mb-3">{stat.icon}</div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-primary-100">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Departments */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Our Medical Departments</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Comprehensive care across all major medical specialties</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {departments.map((dept) => (
              <Link
                key={dept.id}
                to="/departments"
                className="card p-5 text-center hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all group"
              >
                <div className="inline-flex p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                  {iconMap[dept.icon ?? 'stethoscope'] ?? <Stethoscope className="w-7 h-7" />}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{dept.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Why Choose MediCare?</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">We deliver excellence in healthcare through innovation and compassion</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Award className="w-8 h-8" />, title: 'Expert Specialists', desc: 'Board-certified doctors with decades of experience' },
              { icon: <Clock className="w-8 h-8" />, title: '24/7 Availability', desc: 'Round-the-clock emergency and inpatient care' },
              { icon: <Activity className="w-8 h-8" />, title: 'Advanced Technology', desc: 'State-of-the-art diagnostic and treatment equipment' },
              { icon: <HeartPulse className="w-8 h-8" />, title: 'Patient-Centric Care', desc: 'Personalized treatment plans for every patient' },
            ].map((feature, i) => (
              <div key={i} className="card p-6">
                <div className="inline-flex p-3 bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 rounded-xl mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Meet Our Doctors</h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Experienced specialists dedicated to your health</p>
            </div>
            <Link to="/doctors" className="btn-secondary text-sm hidden sm:flex">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((doc) => (
              <div key={doc.id} className="card overflow-hidden group">
                <div className="aspect-square bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center">
                  {doc.avatar_url ? (
                    <img src={doc.avatar_url} alt={doc.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <Stethoscope className="w-16 h-16 text-primary-400" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{doc.full_name}</h3>
                  <p className="text-sm text-primary-600 dark:text-primary-400">{doc.specialization}</p>
                  <p className="text-xs text-gray-400 mt-1">{doc.department?.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency CTA */}
      <section className="bg-error-600 py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-white">
            <Ambulance className="w-12 h-12" />
            <div>
              <h3 className="text-xl font-bold">Emergency? We're Here 24/7</h3>
              <p className="text-error-100 text-sm">Call our emergency hotline for immediate assistance</p>
            </div>
          </div>
          <a href="tel:+15551234567" className="btn bg-white text-error-600 hover:bg-gray-100 text-base">
            <Phone className="w-5 h-5" /> +1 (555) 123-4567
          </a>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Patient Testimonials</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">What our patients say about their experience</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.id} className="card p-6">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-warning-500 fill-warning-500" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{t.message}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium">
                    {t.patient_name.charAt(0)}
                  </div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{t.patient_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      {blogs.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Health Blog</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Latest health tips and medical insights</p>
              </div>
              <Link to="/blog" className="btn-secondary text-sm hidden sm:flex">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <Link key={blog.id} to={`/blog/${blog.slug}`} className="card overflow-hidden group hover:shadow-md transition-all">
                  <div className="aspect-video bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30">
                    {blog.image_url && <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-4">
                    <span className="badge-primary mb-2">{blog.category}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors">{blog.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{blog.excerpt}</p>
                    <p className="text-xs text-gray-400 mt-2">By {blog.author}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
