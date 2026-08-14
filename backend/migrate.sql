-- Insert schools from JSON
INSERT INTO schools (id, name, primary_color, has_primary, has_secondary, config_json, admin_id, features)
VALUES 
('1', 'NABESK COMPREHENSIVE COLLAGE', '#b71021', false, true, '{"roles":{"admin":true,"teacher":true,"parent":true,"student":true},"modules":{"attendance":true,"gradebook":true,"finance":false,"messaging":true,"library":false,"transport":false}}', '1', '{"attendance":false,"grading":false,"assignments":false,"messaging":false,"enrollment":false,"results":false}'),
('2', 'NABESK COMPREHENSIVE COLLAGE', '#ec98a4', false, true, '{"roles":{"admin":true,"teacher":true,"parent":true,"student":true},"modules":{"attendance":true,"gradebook":true,"finance":true,"messaging":true,"library":false,"transport":false}}', '2', '{"attendance":false,"grading":false,"assignments":false,"messaging":false,"enrollment":false,"results":false}'),
('3', 'NABESK COMPREHENSIVE COLLAGE', '#265f4c', true, true, '{"roles":{"admin":true,"teacher":true,"parent":true,"student":true},"modules":{"attendance":true,"gradebook":true,"finance":true,"messaging":true,"library":true,"transport":true}}', '3', '{"attendance":false,"grading":false,"assignments":false,"messaging":false,"enrollment":false,"results":false}'),
('4', 'BRIGHT ACCADEMY', '#6c10b7', true, false, '{"roles":{"admin":true,"teacher":true,"parent":false,"student":false},"modules":{"attendance":true,"gradebook":true,"finance":true,"messaging":true,"library":false,"transport":false}}', '4', '{"attendance":false,"grading":false,"assignments":false,"messaging":false,"enrollment":false,"results":false}'),
('5', '', '#10B981', true, true, '{"roles":{"admin":true,"teacher":true,"parent":true,"student":false},"modules":{"attendance":true,"gradebook":true,"finance":false,"messaging":true,"library":false,"transport":false}}', '5', '{"attendance":false,"grading":false,"assignments":false,"messaging":false,"enrollment":false,"results":false}'),
('6', 'GHS', '#109bb7', true, false, '{"roles":{"admin":true,"teacher":true,"parent":true,"student":false},"modules":{"attendance":true,"gradebook":true,"finance":true,"messaging":true,"library":true,"transport":true}}', '6', '{"attendance":false,"grading":false,"assignments":false,"messaging":false,"enrollment":false,"results":false}'),
('7', 'testing', '#b71098', false, true, '{"roles":{"admin":true,"teacher":true,"parent":true,"student":true},"modules":{"attendance":true,"gradebook":true,"finance":true,"messaging":true,"library":true,"transport":true}}', '10', '{"attendance":true,"grading":true,"assignments":true,"messaging":true,"enrollment":true,"results":true}'),
('8', 'MTN', '#10b761', true, true, '{"roles":{"admin":true,"teacher":true,"parent":true,"student":true},"modules":{"attendance":true,"gradebook":true,"finance":true,"messaging":true,"library":true,"transport":true}}', '14', '{"attendance":true,"grading":true,"assignments":true,"messaging":true,"enrollment":true,"results":false}')
ON CONFLICT (id) DO NOTHING;

-- Insert users
INSERT INTO users (id, school_id, name, email, password, role, first_login)
VALUES 
('1', '1', 'MR SAM', 'egembruno60@gmail.com', 'BLACK@123', 'Admin', false),
('2', '2', 'MR SAM', 'egembruno60@gmail.com', 'BLACK@123', 'Admin', false),
('3', '3', 'MR SAM', 'egembruno60@gmail.com', 'BLACK@123', 'Admin', false),
('4', '4', 'John Wick', 'bruno@gmail.com', 'BLACK@123', 'Admin', false),
('5', '5', '', '', '', 'Admin', false),
('6', '6', 'mr james', 'bruno12@gmail.com', 'Black@123', 'Admin', false),
('7', '6', 'Egem-Otu Alain', 'egem-otu.alain@ghs.edvance.com', 'welcome123', 'Student', true),
('8', '6', 'Symptom', 'symptom@ghs.edvance.com', 'Black@123', 'Teacher', false),
('9', '6', 'Egem-Otu Alain', 'egem-otu.alain1@ghs.edvance.com', 'welcome123', 'Student', true),
('10', '7', 'text', 'text@gmail.com', 'test123', 'Admin', false),
('11', '7', 'student', 'student@testing.edvance.com', 'student123', 'Student', false),
('12', '7', 'teacher', 'teacher@testing.edvance.com', 'teacher123', 'Teacher', false),
('14', '8', 'na', 'alex.m@edutrack.com', 'black', 'Admin', false),
('17', '8', 'alai', 'alai@mtn.edvance.com', 'welcome123', 'Teacher', true),
('18', '8', 'Al', 'al@mtn.edvance.com', 'Black123', 'Student', false),
('19', '0', 'james', 'egem@gmail.com', 'egem@123', 'Parent', false),
('20', '8', 'ai', 'ai@mtn.edvance.com', 'ai@123', 'Student', false)
ON CONFLICT (id) DO NOTHING;

-- Insert parent-student links
INSERT INTO parent_student_links (id, parent_id, student_id)
VALUES 
('link-1', '19', '18'),
('link-2', '19', '20'),
('link-3', '19', '11')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS sequences (
		id VARCHAR(36) PRIMARY KEY,
		school_id VARCHAR(36),
		name TEXT NOT NULL,
		is_locked BOOLEAN DEFAULT false
	);
	CREATE TABLE IF NOT EXISTS marks (
		id VARCHAR(36) PRIMARY KEY,
		school_id VARCHAR(36),
		student_id VARCHAR(36),
		class_id VARCHAR(36),
		subject_id VARCHAR(36),
		sequence_id VARCHAR(36),
		score REAL NOT NULL,
		teacher_id VARCHAR(36),
		date_entered TEXT,
		UNIQUE(student_id, subject_id, sequence_id)
	);
	CREATE TABLE IF NOT EXISTS report_card_templates (
		id VARCHAR(36) PRIMARY KEY,
		school_id VARCHAR(36) UNIQUE,
		logo_url TEXT,
		motto TEXT,
		principal TEXT,
		passing_score REAL DEFAULT 10.0
	);
	CREATE TABLE IF NOT EXISTS streams (
		id VARCHAR(36) PRIMARY KEY,
		school_id VARCHAR(36),
		class_name TEXT NOT NULL,
		stream_name TEXT NOT NULL,
		UNIQUE(school_id, class_name, stream_name)
	);
	CREATE TABLE IF NOT EXISTS subjects (
		id VARCHAR(36) PRIMARY KEY,
		school_id VARCHAR(36),
		class_id VARCHAR(36),
		name TEXT NOT NULL,
		coefficient REAL NOT NULL
	);

SELECT COUNT(*) as total_schools FROM schools;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_links FROM parent_student_links;
