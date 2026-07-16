import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { CmsPage } from '../../lib/types';

const defaultFaqs = [
  { q: 'How do I book an appointment?', a: 'You can book an appointment by registering on our portal and using the appointment booking feature, or by calling our front desk.' },
  { q: 'What are your visiting hours?', a: 'General visiting hours are from 10:00 AM to 12:00 PM and 4:00 PM to 7:00 PM daily.' },
  { q: 'Do you accept insurance?', a: 'Yes, we accept most major insurance plans. Please contact our billing department for details.' },
  { q: 'Is emergency care available 24/7?', a: 'Yes, our emergency department is open 24 hours a day, 7 days a week.' },
  { q: 'How can I get my medical records?', a: 'Registered patients can download their medical reports directly from the patient portal.' },
];

export default function FaqPage() {
  const [page, setPage] = useState<CmsPage | null>(null);
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    supabase.from('cms_pages').select('*').eq('slug', 'faq').maybeSingle().then(({ data }) => {
      setPage(data as CmsPage | null);
    });
  }, []);

  const faqs = page?.content ? JSON.parse(page.content) : defaultFaqs;

  return (
    <div>
      <div className="bg-primary-700 py-16 text-center">
        <h1 className="text-3xl lg:text-4xl font-bold text-white">Frequently Asked Questions</h1>
        <p className="mt-3 text-primary-100">Find answers to common questions about our services</p>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-3">
          {faqs.map((faq: { q: string; a: string }, i: number) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex items-center justify-between w-full p-4 text-left"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300 animate-slide-up">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
