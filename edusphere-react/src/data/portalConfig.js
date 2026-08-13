export const SCHOOL_TYPES = {
  primary: {
    id: 'primary',
    label: 'Primary School',
    description: 'For elementary and primary education (ages 5–11)',
    roles: ['admin', 'teacher', 'parents'],
  },
  secondary: {
    id: 'secondary',
    label: 'Secondary School',
    description: 'For secondary and high school education (ages 11–18)',
    roles: ['admin', 'teacher', 'parent', 'student'],
  },
};

export const ROLE_LABELS = {
  admin: { default: 'Admin', icon: 'Shield' },
  teacher: { default: 'Teacher', icon: 'GraduationCap' },
  parents: { default: 'Parents', icon: 'Users' },
  parent: { default: 'Parent', icon: 'Users' },
  student: { default: 'Student', icon: 'BookOpen' },
};

export const STUDENT_SUB_FEATURES = {
  'view-result': { id: 'view-result', label: 'View Result', description: 'Students can view their exam results' },
};

export const FEATURE_CATALOG = {
  academic: {
    label: 'Academic',
    features: [
      { id: 'attendance', label: 'Attendance Tracking', description: 'Daily attendance for students and staff' },
      { id: 'grading', label: 'Grading & Report Cards', description: 'Grade entry and report generation' },
      { id: 'timetable', label: 'Timetable Management', description: 'Class schedules and room allocation' },
      { id: 'assignments', label: 'Assignments & Homework', description: 'Assign and track student work' },
      { id: 'exams', label: 'Exam Management', description: 'Exam scheduling and result publishing' },
      { id: 'curriculum', label: 'Curriculum Planning', description: 'Lesson plans and syllabus tracking' },
    ],
  },
  communication: {
    label: 'Communication',
    features: [
      { id: 'messaging', label: 'Internal Messaging', description: 'Direct messages between users' },
      { id: 'announcements', label: 'Announcements', description: 'School-wide and class announcements' },
      { id: 'notifications', label: 'Push Notifications', description: 'Email and SMS alerts' },
      { id: 'events', label: 'Events Calendar', description: 'School events and reminders' },
    ],
  },
  finance: {
    label: 'Finance',
    features: [
      { id: 'fees', label: 'Fee Management', description: 'Tuition and fee collection' },
      { id: 'invoices', label: 'Invoicing', description: 'Generate and track invoices' },
      { id: 'payroll', label: 'Staff Payroll', description: 'Salary and payroll processing' },
      { id: 'expenses', label: 'Expense Tracking', description: 'School expense management' },
    ],
  },
  administration: {
    label: 'Administration',
    features: [
      { id: 'student-records', label: 'Student Records', description: 'Enrollment and student profiles' },
      { id: 'staff-records', label: 'Staff Records', description: 'HR and staff management' },
      { id: 'library', label: 'Library Management', description: 'Book catalog and lending' },
      { id: 'transport', label: 'Transport Management', description: 'Bus routes and tracking' },
      { id: 'inventory', label: 'Inventory', description: 'School assets and supplies' },
    ],
  },
  analytics: {
    label: 'Analytics & Reports',
    features: [
      { id: 'dashboards', label: 'Analytics Dashboards', description: 'Performance and usage insights' },
      { id: 'reports', label: 'Custom Reports', description: 'Build and export custom reports' },
      { id: 'compliance', label: 'Compliance Reports', description: 'Regulatory and audit reports' },
    ],
  },
};

export const DEFAULT_SCHOOL_CONFIG = {
  name: '',
  type: '',
  tagline: '',
  address: '',
  city: '',
  country: '',
  adminEmail: '',
  adminPhone: '',
  academicYearStart: '',
  branding: {
    primaryColor: '#10B981',
    accentColor: '#059669',
    logoUrl: '',
  },
  portals: {},
  features: {},
  studentSubFeatures: {},
};

export function getDefaultPortalsForType(schoolType) {
  const typeConfig = SCHOOL_TYPES[schoolType];
  if (!typeConfig) return {};

  const portals = {};
  typeConfig.roles.forEach((role) => {
    portals[role] = {
      enabled: true,
      customName: ROLE_LABELS[role]?.default || role,
      welcomeMessage: `Welcome to the ${ROLE_LABELS[role]?.default || role} portal`,
    };
  });
  return portals;
}

export function getDefaultFeaturesForType(schoolType) {
  const typeConfig = SCHOOL_TYPES[schoolType];
  if (!typeConfig) return {};

  const features = {};
  typeConfig.roles.forEach((role) => {
    features[role] = {};
    Object.values(FEATURE_CATALOG).forEach((category) => {
      category.features.forEach((feature) => {
        features[role][feature.id] = false;
      });
    });
  });
  return features;
}

export function getDefaultStudentSubFeatures() {
  return {
    'view-result': { enabled: true },
  };
}
