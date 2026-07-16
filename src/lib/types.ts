export type Role = 'admin' | 'doctor' | 'receptionist' | 'patient' | 'pharmacist' | 'lab_technician';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string | null;
  department_id: string | null;
  full_name: string;
  specialization: string | null;
  qualifications: string | null;
  consultation_fee: number;
  experience_years: number;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  available_days: string[];
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  department?: Department;
}

export interface Staff {
  id: string;
  user_id: string | null;
  full_name: string;
  role: Role;
  department_id: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  shift: string;
  is_active: boolean;
  created_at: string;
  department?: Department;
}

export interface Patient {
  id: string;
  user_id: string | null;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergency_contact: string | null;
  medical_history: string | null;
  allergies: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  created_by: string | null;
  created_at: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  appointment_id: string | null;
  diagnosis: string | null;
  instructions: string | null;
  created_at: string;
  patient?: Patient;
  doctor?: Doctor;
  prescription_items?: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medicine_name: string;
  dosage: string | null;
  duration: string | null;
  frequency: string | null;
  instructions: string | null;
}

export interface LabTest {
  id: string;
  name: string;
  category: string | null;
  price: number;
  description: string | null;
  created_at: string;
}

export interface LabOrder {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  test_id: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  result: string | null;
  report_url: string | null;
  ordered_at: string;
  completed_at: string | null;
  patient?: Patient;
  test?: LabTest;
  doctor?: Doctor;
}

export interface Medicine {
  id: string;
  name: string;
  manufacturer: string | null;
  category: string | null;
  unit: string | null;
  price: number;
  stock_qty: number;
  reorder_level: number;
  expiry_date: string | null;
  batch_no: string | null;
  created_at: string;
}

export interface MedicineSale {
  id: string;
  medicine_id: string | null;
  patient_id: string | null;
  quantity: number;
  total_amount: number;
  sold_by: string | null;
  sold_at: string;
  medicine?: Medicine;
  patient?: Patient;
}

export interface Invoice {
  id: string;
  patient_id: string;
  invoice_no: string;
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  status: 'unpaid' | 'paid' | 'partially_paid' | 'cancelled';
  payment_method: string | null;
  paid_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  patient?: Patient;
  invoice_items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Room {
  id: string;
  room_number: string;
  room_type: 'general' | 'private' | 'icu' | 'ward' | 'emergency';
  floor: number;
  price_per_day: number;
  is_active: boolean;
  created_at: string;
  beds?: Bed[];
}

export interface Bed {
  id: string;
  room_id: string;
  bed_number: string;
  status: 'available' | 'occupied' | 'maintenance';
  created_at: string;
}

export interface Admission {
  id: string;
  patient_id: string;
  bed_id: string | null;
  doctor_id: string | null;
  admission_date: string;
  discharge_date: string | null;
  reason: string | null;
  status: 'admitted' | 'discharged';
  created_at: string;
  patient?: Patient;
  bed?: Bed;
  doctor?: Doctor;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  entity: string | null;
  details: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  meta_description: string | null;
  is_published: boolean;
  updated_at: string;
}

export interface CmsBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CmsTestimonial {
  id: string;
  patient_name: string;
  rating: number;
  message: string | null;
  avatar_url: string | null;
  is_published: boolean;
  created_at: string;
}

export interface CmsBlog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  author: string | null;
  image_url: string | null;
  category: string | null;
  is_published: boolean;
  created_at: string;
}
