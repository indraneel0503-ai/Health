/*
# Seed initial reference data

## Overview
Populates reference tables with starter data so the app is usable immediately:
- Departments (Cardiology, Neurology, Orthopedics, Pediatrics, etc.)
- Lab tests (CBC, Lipid Profile, Blood Glucose, etc.)
- CMS pages (About, Services, FAQ, Contact, Privacy, Terms)
- CMS banners for homepage

## Notes
- Uses ON CONFLICT to be idempotent.
- Does NOT create auth users (those are created via the signup flow).
*/

-- Departments
INSERT INTO public.departments (name, description, icon) VALUES
('Cardiology', 'Diagnosis and treatment of heart and blood vessel conditions.', 'heart'),
('Neurology', 'Care for disorders of the nervous system and brain.', 'brain'),
('Orthopedics', 'Treatment of musculoskeletal system injuries and disorders.', 'bone'),
('Pediatrics', 'Medical care for infants, children, and adolescents.', 'baby'),
('Dermatology', 'Diagnosis and treatment of skin, hair, and nail conditions.', 'hand'),
('Ophthalmology', 'Eye care, vision testing, and eye surgery.', 'eye'),
('ENT', 'Ear, nose, and throat specialist care.', 'ear'),
('Oncology', 'Diagnosis and treatment of cancer.', 'activity'),
('Gynecology', 'Women''s reproductive health and maternity care.', 'users'),
('General Medicine', 'Primary healthcare and general consultations.', 'stethoscope')
ON CONFLICT DO NOTHING;

-- Lab tests
INSERT INTO public.lab_tests (name, category, price, description) VALUES
('Complete Blood Count (CBC)', 'Hematology', 350, 'Measures red and white blood cells, hemoglobin, and platelets.'),
('Lipid Profile', 'Biochemistry', 600, 'Measures cholesterol and triglycerides levels.'),
('Blood Glucose (Fasting)', 'Biochemistry', 150, 'Fasting blood sugar level test.'),
('Thyroid Profile (T3, T4, TSH)', 'Endocrinology', 800, 'Thyroid hormone function panel.'),
('Liver Function Test', 'Biochemistry', 700, 'Assesses liver health and enzyme levels.'),
('Kidney Function Test', 'Biochemistry', 650, 'Evaluates kidney function and creatinine levels.'),
('Urine Routine', 'Pathology', 200, 'Routine urine analysis for infections and abnormalities.'),
('X-Ray Chest', 'Radiology', 400, 'Chest X-ray imaging for lungs and heart.'),
('ECG', 'Cardiology', 500, 'Electrocardiogram to record heart electrical activity.'),
('Vitamin D Test', 'Biochemistry', 1200, 'Measures vitamin D levels in blood.'),
('HbA1c', 'Biochemistry', 550, 'Glycated hemoglobin test for diabetes monitoring.'),
('COVID-19 RT-PCR', 'Pathology', 1500, 'Diagnostic test for active COVID-19 infection.')
ON CONFLICT DO NOTHING;

-- CMS pages
INSERT INTO public.cms_pages (slug, title, content, meta_description) VALUES
('about', 'About Our Hospital', 'MediCare Hospital is a 500-bed multi-specialty healthcare facility serving the community since 1995. We combine compassionate care with cutting-edge medical technology to deliver the best possible outcomes for our patients. Our team of 200+ doctors across 30+ specialties is dedicated to your health and wellbeing.', 'Learn about MediCare Hospital, our mission, and our commitment to healthcare excellence.'),
('services', 'Our Services', 'We offer a comprehensive range of medical services including emergency care, outpatient consultations, inpatient treatment, surgical procedures, diagnostic imaging, laboratory services, pharmacy, and telemedicine consultations.', 'Explore the full range of medical services offered at MediCare Hospital.'),
('faq', 'Frequently Asked Questions', 'Find answers to common questions about appointments, billing, insurance, visiting hours, and patient services at MediCare Hospital.', 'Get answers to frequently asked questions about our hospital services.'),
('contact', 'Contact Us', 'Reach out to us for appointments, inquiries, or emergency assistance. We are available 24/7 to serve you.', 'Contact MediCare Hospital for appointments, inquiries, and emergency assistance.'),
('privacy', 'Privacy Policy', 'Your privacy is important to us. This policy outlines how we collect, use, and protect your personal health information in compliance with healthcare regulations.', 'Read our privacy policy to understand how we protect your personal and health information.'),
('terms', 'Terms & Conditions', 'These terms govern your use of MediCare Hospital services and our website. By accessing our services, you agree to these terms and conditions.', 'Review the terms and conditions for using MediCare Hospital services and website.')
ON CONFLICT (slug) DO NOTHING;

-- CMS banners
INSERT INTO public.cms_banners (title, subtitle, image_url, sort_order, is_active) VALUES
('Your Health, Our Priority', 'Compassionate care with advanced medical technology for you and your loved ones.', 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=1600', 1, true),
('Expert Doctors, Trusted Care', 'Meet our team of experienced specialists dedicated to your wellbeing.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=1600', 2, true),
('24/7 Emergency Services', 'Round-the-clock emergency care when you need it most.', 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=1600', 3, true)
ON CONFLICT DO NOTHING;

-- Testimonials
INSERT INTO public.cms_testimonials (patient_name, rating, message, avatar_url, is_published) VALUES
('Sarah Johnson', 5, 'The care I received at MediCare was exceptional. The doctors were attentive and the staff made me feel comfortable throughout my treatment.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=200', true),
('Michael Chen', 5, 'Excellent service from check-in to discharge. The online appointment system saved me so much time. Highly recommend!', 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=200', true),
('Priya Sharma', 4, 'Great hospital with caring staff. The telemedicine consultation was very convenient and the doctor was thorough.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=200', true)
ON CONFLICT DO NOTHING;

-- Blogs
INSERT INTO public.cms_blogs (title, slug, excerpt, content, author, image_url, category, is_published) VALUES
('10 Tips for a Healthy Heart', 'healthy-heart-tips', 'Simple lifestyle changes that can dramatically improve your cardiovascular health.', 'Cardiovascular disease is the leading cause of death worldwide. Here are 10 evidence-based tips to keep your heart healthy: 1. Exercise regularly - aim for 150 minutes of moderate activity per week. 2. Eat a balanced diet rich in fruits, vegetables, and whole grains. 3. Quit smoking. 4. Limit alcohol consumption. 5. Manage stress through meditation or yoga. 6. Get enough sleep - 7-9 hours per night. 7. Monitor your blood pressure. 8. Maintain a healthy weight. 9. Stay hydrated. 10. Get regular check-ups.', 'Dr. Robert Anderson', 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=800', 'Cardiology', true),
('Understanding Diabetes: A Complete Guide', 'diabetes-guide', 'Learn about the types, symptoms, and management of diabetes.', 'Diabetes affects millions worldwide. Type 1 diabetes is an autoimmune condition where the body does not produce insulin. Type 2 diabetes is more common and occurs when the body becomes resistant to insulin. Symptoms include increased thirst, frequent urination, hunger, fatigue, and blurred vision. Management involves blood sugar monitoring, medication, diet, and exercise. Early detection and treatment can prevent serious complications.', 'Dr. Emily Davis', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800', 'Endocrinology', true),
('The Importance of Regular Health Check-ups', 'health-checkups', 'Why preventive healthcare and regular screenings are essential for long-term wellbeing.', 'Regular health check-ups are crucial for early detection of diseases. Many conditions like hypertension, diabetes, and certain cancers show no symptoms in early stages. Recommended screenings vary by age and gender. Adults should have annual physical exams, blood pressure checks, cholesterol tests, and cancer screenings as recommended by their physician. Prevention is always better and cheaper than treatment.', 'Dr. Michael Lee', 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=800', 'Preventive Care', true)
ON CONFLICT (slug) DO NOTHING;

-- Rooms
INSERT INTO public.rooms (room_number, room_type, floor, price_per_day, is_active) VALUES
('101', 'general', 1, 2000, true),
('102', 'general', 1, 2000, true),
('201', 'private', 2, 5000, true),
('202', 'private', 2, 5000, true),
('301', 'icu', 3, 15000, true),
('302', 'icu', 3, 15000, true),
('401', 'ward', 4, 1500, true),
('G01', 'emergency', 0, 3000, true)
ON CONFLICT DO NOTHING;

-- Beds for rooms
INSERT INTO public.beds (room_id, bed_number, status)
SELECT id, 'B1', 'available' FROM public.rooms WHERE room_number IN ('101','102','201','202','301','302','401','G01')
ON CONFLICT DO NOTHING;
INSERT INTO public.beds (room_id, bed_number, status)
SELECT id, 'B2', 'available' FROM public.rooms WHERE room_number IN ('101','102','201','202','301','302','401','G01')
ON CONFLICT DO NOTHING;
INSERT INTO public.beds (room_id, bed_number, status)
SELECT id, 'B3', 'available' FROM public.rooms WHERE room_number IN ('101','102','401')
ON CONFLICT DO NOTHING;
INSERT INTO public.beds (room_id, bed_number, status)
SELECT id, 'B4', 'available' FROM public.rooms WHERE room_number IN ('401')
ON CONFLICT DO NOTHING;

-- Medicines
INSERT INTO public.medicines (name, manufacturer, category, unit, price, stock_qty, reorder_level, expiry_date, batch_no) VALUES
('Paracetamol 500mg', 'Cipla', 'Analgesic', 'Strip of 10', 25, 500, 100, '2026-12-31', 'PAR2024'),
('Amoxicillin 500mg', 'Sun Pharma', 'Antibiotic', 'Strip of 10', 80, 200, 50, '2026-06-30', 'AMX2024'),
('Omeprazole 20mg', 'Dr. Reddy''s', 'Antacid', 'Strip of 10', 45, 150, 40, '2026-09-30', 'OME2024'),
('Metformin 500mg', 'Glenmark', 'Antidiabetic', 'Strip of 10', 35, 300, 80, '2027-01-31', 'MET2024'),
('Amlodipine 5mg', 'Lupin', 'Antihypertensive', 'Strip of 10', 55, 180, 50, '2026-11-30', 'AML2024'),
('Azithromycin 500mg', 'Cipla', 'Antibiotic', 'Strip of 3', 120, 80, 30, '2026-03-31', 'AZI2024'),
('Cetirizine 10mg', 'Sun Pharma', 'Antihistamine', 'Strip of 10', 20, 400, 100, '2027-02-28', 'CET2024'),
('Ibuprofen 400mg', 'Dr. Reddy''s', 'NSAID', 'Strip of 10', 30, 8, 50, '2026-08-31', 'IBU2024'),
('Insulin Glargine', 'Lupin', 'Antidiabetic', 'Vial', 450, 60, 20, '2026-05-31', 'INS2024'),
('Salbutamol Inhaler', 'Cipla', 'Bronchodilator', 'Inhaler', 180, 90, 25, '2026-10-31', 'SAL2024')
ON CONFLICT DO NOTHING;