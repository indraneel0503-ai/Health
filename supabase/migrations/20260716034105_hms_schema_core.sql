/*
# Hospital Management System - Core Schema

## Overview
Creates the foundational schema for a multi-role Hospital Management System with
role-based access (Admin, Doctor, Receptionist, Patient, Pharmacist, Lab Technician).
Uses Supabase Auth for authentication; a `profiles` table extends `auth.users` with
role and hospital-specific metadata.

## New Tables
1. `profiles` - Extends auth.users with role, full_name, phone, avatar_url
2. `departments` - Hospital departments (Cardiology, Neurology, etc.)
3. `doctors` - Doctor profiles linked to user + department, with specialization, fees, schedule
4. `staff` - Non-doctor staff (receptionist, pharmacist, lab tech) linked to user + role
5. `patients` - Patient demographics, linked to user for self-service portal
6. `appointments` - Appointment booking between patient and doctor, with status
7. `prescriptions` - Doctor prescriptions for a patient/appointment
8. `prescription_items` - Individual medicines within a prescription
9. `lab_tests` - Lab test catalog
10. `lab_orders` - Lab test orders for a patient, with status and report
11. `medicines` - Pharmacy inventory
12. `medicine_sales` - Pharmacy sales/billing
13. `invoices` - Patient billing invoices
14. `invoice_items` - Line items on an invoice
15. `rooms` - Hospital rooms (General, ICU, Private)
16. `beds` - Beds within rooms, with occupancy status
17. `admissions` - Patient admission/discharge records linked to beds
18. `activity_logs` - Audit trail of user actions
19. `notifications` - In-app notifications for users
20. `cms_pages` - Dynamic website content managed by admin CMS
21. `cms_banners` - Homepage banners
22. `cms_testimonials` - Patient testimonials
23. `cms_blogs` - Blog posts

## Security
- RLS enabled on all tables.
- Profiles: owner-scoped SELECT/UPDATE; admin full access.
- Reference data (departments, lab_tests, medicines, cms_*): readable by all authenticated.
- Operational tables (appointments, prescriptions, invoices, etc.): owner-scoped with
  role-appropriate access. Admin has full access; doctors/patients see their own data.
- Uses `auth.uid()` for ownership checks.
*/

-- Profiles: extends auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','doctor','receptionist','patient','pharmacist','lab_technician')),
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Departments
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "departments_read_all" ON public.departments;
CREATE POLICY "departments_read_all" ON public.departments
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "departments_write_admin" ON public.departments;
CREATE POLICY "departments_write_admin" ON public.departments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Doctors
CREATE TABLE IF NOT EXISTS public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  specialization text,
  qualifications text,
  consultation_fee numeric(10,2) DEFAULT 0,
  experience_years int DEFAULT 0,
  bio text,
  avatar_url text,
  phone text,
  email text,
  available_days text[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri'],
  start_time time DEFAULT '09:00',
  end_time time DEFAULT '17:00',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "doctors_read_all" ON public.doctors;
CREATE POLICY "doctors_read_all" ON public.doctors
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "doctors_write_admin_or_self" ON public.doctors;
CREATE POLICY "doctors_write_admin_or_self" ON public.doctors
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','doctor'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','doctor'))
  );

-- Staff (non-doctor employees)
CREATE TABLE IF NOT EXISTS public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('receptionist','pharmacist','lab_technician','admin')),
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  phone text,
  email text,
  avatar_url text,
  shift text DEFAULT 'Morning',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_read_staff_or_admin" ON public.staff;
CREATE POLICY "staff_read_staff_or_admin" ON public.staff
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist','doctor'))
  );
DROP POLICY IF EXISTS "staff_write_admin" ON public.staff;
CREATE POLICY "staff_write_admin" ON public.staff
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Patients
CREATE TABLE IF NOT EXISTS public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender IN ('male','female','other')),
  blood_group text,
  phone text,
  email text,
  address text,
  emergency_contact text,
  medical_history text,
  allergies text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "patients_read_own_or_staff" ON public.patients;
CREATE POLICY "patients_read_own_or_staff" ON public.patients
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','doctor','receptionist','lab_technician'))
  );
DROP POLICY IF EXISTS "patients_write_own_or_staff" ON public.patients;
CREATE POLICY "patients_write_own_or_staff" ON public.patients
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist'))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist','patient'))
  );

-- Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appointments_read_related" ON public.appointments;
CREATE POLICY "appointments_read_related" ON public.appointments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist'))
  );
DROP POLICY IF EXISTS "appointments_write_related" ON public.appointments;
CREATE POLICY "appointments_write_related" ON public.appointments
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist','doctor','patient'))
  );

-- Prescriptions
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  diagnosis text,
  instructions text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prescriptions_read_related" ON public.prescriptions;
CREATE POLICY "prescriptions_read_related" ON public.prescriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist','pharmacist'))
  );
DROP POLICY IF EXISTS "prescriptions_write_doctor_or_admin" ON public.prescriptions;
CREATE POLICY "prescriptions_write_doctor_or_admin" ON public.prescriptions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','doctor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','doctor')));

-- Prescription items
CREATE TABLE IF NOT EXISTS public.prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_name text NOT NULL,
  dosage text,
  duration text,
  frequency text,
  instructions text
);
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "presc_items_read_related" ON public.prescription_items;
CREATE POLICY "presc_items_read_related" ON public.prescription_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prescriptions pr
      JOIN public.patients p ON p.id = pr.patient_id
      WHERE pr.id = prescription_id AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.prescriptions pr
      JOIN public.doctors d ON d.id = pr.doctor_id
      WHERE pr.id = prescription_id AND d.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist','pharmacist'))
  );
DROP POLICY IF EXISTS "presc_items_write_doctor" ON public.prescription_items;
CREATE POLICY "presc_items_write_doctor" ON public.prescription_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','doctor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','doctor')));

-- Lab tests catalog
CREATE TABLE IF NOT EXISTS public.lab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  price numeric(10,2) DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lab_tests_read_all" ON public.lab_tests;
CREATE POLICY "lab_tests_read_all" ON public.lab_tests
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "lab_tests_write_admin_lab" ON public.lab_tests;
CREATE POLICY "lab_tests_write_admin_lab" ON public.lab_tests
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','lab_technician')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','lab_technician')));

-- Lab orders
CREATE TABLE IF NOT EXISTS public.lab_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  test_id uuid REFERENCES public.lab_tests(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','cancelled')),
  result text,
  report_url text,
  ordered_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lab_orders_read_related" ON public.lab_orders;
CREATE POLICY "lab_orders_read_related" ON public.lab_orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','lab_technician','receptionist'))
  );
DROP POLICY IF EXISTS "lab_orders_write_staff" ON public.lab_orders;
CREATE POLICY "lab_orders_write_staff" ON public.lab_orders
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','lab_technician','doctor','receptionist')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','lab_technician','doctor','receptionist')));

-- Medicines inventory
CREATE TABLE IF NOT EXISTS public.medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  manufacturer text,
  category text,
  unit text,
  price numeric(10,2) DEFAULT 0,
  stock_qty int DEFAULT 0,
  reorder_level int DEFAULT 10,
  expiry_date date,
  batch_no text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "medicines_read_all" ON public.medicines;
CREATE POLICY "medicines_read_all" ON public.medicines
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "medicines_write_pharmacist" ON public.medicines;
CREATE POLICY "medicines_write_pharmacist" ON public.medicines
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','pharmacist')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','pharmacist')));

-- Medicine sales
CREATE TABLE IF NOT EXISTS public.medicine_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid REFERENCES public.medicines(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  quantity int NOT NULL DEFAULT 1,
  total_amount numeric(10,2) DEFAULT 0,
  sold_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sold_at timestamptz DEFAULT now()
);
ALTER TABLE public.medicine_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "med_sales_read_related" ON public.medicine_sales;
CREATE POLICY "med_sales_read_related" ON public.medicine_sales
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','pharmacist','receptionist'))
  );
DROP POLICY IF EXISTS "med_sales_write_pharmacist" ON public.medicine_sales;
CREATE POLICY "med_sales_write_pharmacist" ON public.medicine_sales
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','pharmacist')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','pharmacist')));

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  invoice_no text UNIQUE,
  subtotal numeric(12,2) DEFAULT 0,
  tax_percent numeric(5,2) DEFAULT 0,
  tax_amount numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','partially_paid','cancelled')),
  payment_method text,
  paid_amount numeric(12,2) DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoices_read_related" ON public.invoices;
CREATE POLICY "invoices_read_related" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist','doctor'))
  );
DROP POLICY IF EXISTS "invoices_write_staff" ON public.invoices;
CREATE POLICY "invoices_write_staff" ON public.invoices
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist')));

-- Invoice items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity int DEFAULT 1,
  unit_price numeric(10,2) DEFAULT 0,
  total_price numeric(12,2) DEFAULT 0
);
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inv_items_read_related" ON public.invoice_items;
CREATE POLICY "inv_items_read_related" ON public.invoice_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices inv
      JOIN public.patients p ON p.id = inv.patient_id
      WHERE inv.id = invoice_id AND p.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist','doctor'))
  );
DROP POLICY IF EXISTS "inv_items_write_staff" ON public.invoice_items;
CREATE POLICY "inv_items_write_staff" ON public.invoice_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist')));

-- Rooms
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text NOT NULL,
  room_type text NOT NULL CHECK (room_type IN ('general','private','icu','ward','emergency')),
  floor int DEFAULT 1,
  price_per_day numeric(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rooms_read_all" ON public.rooms;
CREATE POLICY "rooms_read_all" ON public.rooms
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "rooms_write_admin" ON public.rooms;
CREATE POLICY "rooms_write_admin" ON public.rooms
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist')));

-- Beds
CREATE TABLE IF NOT EXISTS public.beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
  bed_number text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied','maintenance')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "beds_read_all" ON public.beds;
CREATE POLICY "beds_read_all" ON public.beds
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "beds_write_admin" ON public.beds;
CREATE POLICY "beds_write_admin" ON public.beds
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist')));

-- Admissions
CREATE TABLE IF NOT EXISTS public.admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  bed_id uuid REFERENCES public.beds(id) ON DELETE SET NULL,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  admission_date timestamptz NOT NULL DEFAULT now(),
  discharge_date timestamptz,
  reason text,
  status text NOT NULL DEFAULT 'admitted' CHECK (status IN ('admitted','discharged')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admissions_read_related" ON public.admissions;
CREATE POLICY "admissions_read_related" ON public.admissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist'))
  );
DROP POLICY IF EXISTS "admissions_write_staff" ON public.admissions;
CREATE POLICY "admissions_write_staff" ON public.admissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','receptionist')));

-- Activity logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text,
  action text NOT NULL,
  entity text,
  details text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "logs_read_admin" ON public.activity_logs;
CREATE POLICY "logs_read_admin" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "logs_insert_any" ON public.activity_logs;
CREATE POLICY "logs_insert_any" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notif_read_own" ON public.notifications;
CREATE POLICY "notif_read_own" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notif_write_own" ON public.notifications;
CREATE POLICY "notif_write_own" ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- CMS pages (dynamic website content)
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text,
  meta_description text,
  is_published boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cms_pages_read_all" ON public.cms_pages;
CREATE POLICY "cms_pages_read_all" ON public.cms_pages
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "cms_pages_write_admin" ON public.cms_pages;
CREATE POLICY "cms_pages_write_admin" ON public.cms_pages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- CMS banners
CREATE TABLE IF NOT EXISTS public.cms_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  link text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.cms_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cms_banners_read_all" ON public.cms_banners;
CREATE POLICY "cms_banners_read_all" ON public.cms_banners
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "cms_banners_write_admin" ON public.cms_banners;
CREATE POLICY "cms_banners_write_admin" ON public.cms_banners
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- CMS testimonials
CREATE TABLE IF NOT EXISTS public.cms_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  rating int DEFAULT 5,
  message text,
  avatar_url text,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.cms_testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "testimonials_read_all" ON public.cms_testimonials;
CREATE POLICY "testimonials_read_all" ON public.cms_testimonials
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "testimonials_write_admin" ON public.cms_testimonials;
CREATE POLICY "testimonials_write_admin" ON public.cms_testimonials
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- CMS blogs
CREATE TABLE IF NOT EXISTS public.cms_blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text,
  author text,
  image_url text,
  category text,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.cms_blogs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blogs_read_all" ON public.cms_blogs;
CREATE POLICY "blogs_read_all" ON public.cms_blogs
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "blogs_write_admin" ON public.cms_blogs;
CREATE POLICY "blogs_write_admin" ON public.cms_blogs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctors_dept ON public.doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON public.lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON public.invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_beds_room ON public.beds(room_id);
CREATE INDEX IF NOT EXISTS idx_admissions_patient ON public.admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON public.notifications(user_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_no IS NULL THEN
    NEW.invoice_no := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || lpad((EXTRACT(EPOCH FROM now())::bigint % 100000)::text, 5, '0');
  END IF;
  IF NEW.tax_amount = 0 AND NEW.subtotal > 0 AND NEW.tax_percent > 0 THEN
    NEW.tax_amount := ROUND(NEW.subtotal * NEW.tax_percent / 100, 2);
    NEW.total_amount := NEW.subtotal + NEW.tax_amount;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_no ON public.invoices;
CREATE TRIGGER trg_invoice_no
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_no();