-- NEW TABLES: assignments, announcements, attendance, class_enrollments

CREATE TABLE IF NOT EXISTS assignments (
  id VARCHAR(36) PRIMARY KEY,
  school_id VARCHAR(36),
  class_id VARCHAR(36),
  teacher_id VARCHAR(36),
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id VARCHAR(36) PRIMARY KEY,
  assignment_id VARCHAR(36),
  student_id VARCHAR(36),
  submitted_at TEXT,
  status TEXT DEFAULT 'submitted',
  UNIQUE(assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(36) PRIMARY KEY,
  school_id VARCHAR(36),
  class_id VARCHAR(36),
  teacher_id VARCHAR(36),
  teacher_name TEXT,
  message TEXT NOT NULL,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(36) PRIMARY KEY,
  school_id VARCHAR(36),
  class_id VARCHAR(36),
  student_id VARCHAR(36),
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  UNIQUE(class_id, student_id, date)
);

CREATE TABLE IF NOT EXISTS class_enrollments (
  id VARCHAR(36) PRIMARY KEY,
  class_id VARCHAR(36),
  student_id VARCHAR(36),
  school_id VARCHAR(36),
  UNIQUE(class_id, student_id)
);
