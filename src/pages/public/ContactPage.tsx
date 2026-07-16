import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useToast } from '../../components/Toast';

export default function ContactPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Thank you! We will get back to you soon.', 'success');
    setForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div>
      <div className="bg-primary-700 py-16 text-center">
        <h1 className="text-3xl lg:text-4xl font-bold text-white">Contact Us</h1>
        <p className="mt-3 text-primary-100">We're here to help. Reach out any time.</p>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { icon: <Phone className="w-6 h-6" />, title: 'Phone', value: '+1 (555) 123-4567' },
            { icon: <Mail className="w-6 h-6" />, title: 'Email', value: 'contact@medicare-hospital.com' },
            { icon: <MapPin className="w-6 h-6" />, title: 'Address', value: '123 Healthcare Ave, Medical City' },
          ].map((item, i) => (
            <div key={i} className="card p-6 text-center">
              <div className="inline-flex p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl mb-3">
                {item.icon}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="card p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Send us a message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input" />
            </div>
            <button type="submit" className="btn-primary w-full">
              <Send className="w-4 h-4" /> Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
