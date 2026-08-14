-- Fix duplicate email issue by making them unique per user
DELETE FROM users WHERE id NOT IN (
  SELECT DISTINCT ON (email) id FROM users ORDER BY email, id
);

-- Insert users with unique emails
INSERT INTO users (id, school_id, name, email, password, role, first_login)
VALUES 
('1', '1', 'MR SAM', 'egembruno60@gmail.com', 'BLACK@123', 'Admin', false),
('2', '2', 'MR SAM 2', 'egembruno60.2@gmail.com', 'BLACK@123', 'Admin', false),
('3', '3', 'MR SAM 3', 'egembruno60.3@gmail.com', 'BLACK@123', 'Admin', false),
('4', '4', 'John Wick', 'bruno@gmail.com', 'BLACK@123', 'Admin', false),
('5', '5', '', '', '', 'Admin', false),
('6', '6', 'mr james', 'bruno12@gmail.com', 'Black@123', 'Admin', false),
('7', '6', 'Egem-Otu Alain', 'egem-otu.alain@ghs.edvance.com', 'welcome123', 'Student', true),
('8', '6', 'Symptom', 'symptom@ghs.edvance.com', 'Black@123', 'Teacher', false),
('9', '6', 'Egem-Otu Alain 2', 'egem-otu.alain1@ghs.edvance.com', 'welcome123', 'Student', true),
('10', '7', 'text', 'text@gmail.com', 'test123', 'Admin', false),
('11', '7', 'student', 'student@testing.edvance.com', 'student123', 'Student', false),
('12', '7', 'teacher', 'teacher@testing.edvance.com', 'teacher123', 'Teacher', false),
('14', '8', 'na', 'alex.m@edutrack.com', 'black', 'Admin', false),
('17', '8', 'alai', 'alai@mtn.edvance.com', 'welcome123', 'Teacher', true),
('18', '8', 'Al', 'al@mtn.edvance.com', 'Black123', 'Student', false),
('19', '0', 'james', 'egem@gmail.com', 'egem@123', 'Parent', false),
('20', '8', 'ai', 'ai@mtn.edvance.com', 'ai@123', 'Student', false)
ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, name=EXCLUDED.name, password=EXCLUDED.password;

-- Verify data
SELECT '=== MIGRATION COMPLETE ===' as status;
SELECT COUNT(*) as total_schools FROM schools;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_parent_links FROM parent_student_links;
