export type Role = 'student' | 'staff';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface StudentProfile extends User {
  faculty: string;
  program: string;
  year: number;
  group: string;
  studentNumber: string;
  gpa?: number;
  averageScore?: number;
  studyForm?: 'Бюджет' | 'Контракт';
  avatarUrl?: string;
}

export type ScheduleStatus = 'normal' | 'room_changed' | 'moved' | 'cancelled';
export type ScheduleType = 'lecture' | 'seminar' | 'lab' | 'exam';

export interface ScheduleEntry {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek?: number; // 1-6 (Mon-Sat)
  start: string; // '08:30'
  end: string; // '10:05'
  startTime?: string;
  endTime?: string;
  subject: string;
  type: ScheduleType;
  room: string;
  teacher: string;
  status: ScheduleStatus;
  changeNote?: string | null;
  groupId: string;
}

export type AssessmentType = 'exam' | 'credit' | 'coursework';
export type CreditStatus = 'earned' | 'in_progress' | 'failed';

export interface Grade {
  id: string;
  subject: string;
  credits: number;
  assessmentType: AssessmentType;
  points: number | null; // 0-100
  grade: number | null; // 2, 3, 4, 5
  creditStatus: CreditStatus;
  examDate: string | null;
  teacher?: string;
  retakeDate?: string | null;
  semester: number;
}

export interface GradesSummary {
  semester: number;
  averagePoints: number;
  gpa: number;
  creditsEarned: number;
  creditsRequired: number;
  upcomingExams: Grade[];
  items: Grade[];
}

export type RequestTypeCode =
  | 'study_certificate'
  | 'military_certificate'
  | 'scholarship_application'
  | 'academic_leave'
  | 'transcript'
  | 'dormitory_application';

export type RequestStatus =
  | 'submitted'
  | 'in_review'
  | 'needs_info'
  | 'ready'
  | 'rejected'
  | 'cancelled';

export interface RequestTypeField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'date';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface RequestType {
  code: RequestTypeCode;
  title: string;
  description: string;
  slaDays: number;
  fields: RequestTypeField[];
}

export interface RequestStatusHistory {
  id: string;
  status: RequestStatus;
  comment?: string;
  createdAt: string;
  authorName: string;
}

export interface StudentRequest {
  id: string;
  studentId: string;
  studentName?: string;
  studentGroup?: string;
  typeCode: RequestTypeCode;
  typeTitle: string;
  data: Record<string, any>;
  status: RequestStatus;
  slaDays: number;
  expectedDate: string;
  createdAt: string;
  updatedAt: string;
  history: RequestStatusHistory[];
  digitalDocAvailable?: boolean;
}

export type NotificationKind = 'announcement' | 'deadline' | 'request_update' | 'schedule_change';

export interface Notification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  priority?: 'normal' | 'high' | 'urgent';
}

export interface StaffAnnouncement {
  id: string;
  title: string;
  body: string;
  targetGroup: string;
  priority: 'normal' | 'high' | 'urgent';
  kind: NotificationKind;
  createdAt: string;
  recipientCount: number;
  recipients?: string[];
}

export interface AcademicGroup {
  id: string;
  code: string;
  program: string;
  faculty: string;
  year: number;
  courseNumber: number;
  studentsCount: number;
  budgetCount: number;
  contractCount: number;
  curatorName?: string;
  curatorContact?: string;
  starostaName?: string;
  starostaEmail?: string;
  starostaPhone?: string;
  averageGpa: number;
  debtCount: number;
}

export interface StudentListItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  group: string;
  year: number;
  studentNumber: string;
  studyForm: 'Бюджет' | 'Контракт';
  gpa: number;
  averageScore: number;
  debtCount: number;
  debtSubjects?: string[];
  isStarosta?: boolean;
  avatarUrl?: string;
  status: 'active' | 'academic_leave' | 'expelled';
}

export interface StudentDossier {
  profile: StudentListItem & {
    faculty: string;
    program: string;
    admissionYear: number;
    recordBookNumber: string;
    dormitoryInfo?: string;
    snils?: string;
  };
  gradesSummary: GradesSummary;
  requests: StudentRequest[];
}

