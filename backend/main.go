package main

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

// =====================================================================
// MODELS
// =====================================================================

type FeatureFlags struct {
	Attendance  bool `json:"attendance"`
	Grading     bool `json:"grading"`
	Assignments bool `json:"assignments"`
	Messaging   bool `json:"messaging"`
	Enrollment  bool `json:"enrollment"`
	Results     bool `json:"results"`
}

type School struct {
	ID              string       `json:"ID"`
	Name            string       `json:"name"`
	SchoolName      string       `json:"schoolName,omitempty"`
	PrimaryColor    string       `json:"primaryColor"`
	HasPrimary      bool         `json:"hasPrimary"`
	HasSecondary    bool         `json:"hasSecondary"`
	ConfigJSON      string       `json:"configJson"`
	AdminID         string       `json:"adminId"`
	Features        FeatureFlags `json:"features"`
	ClassNamingType string       `json:"classNamingType"`
	SectionConfig   string       `json:"sectionConfig"`
}

type User struct {
	ID         string `json:"ID"`
	SchoolID   string `json:"schoolId"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	Password   string `json:"password"`
	Role       string `json:"role"`
	FirstLogin bool   `json:"firstLogin"`
}

type Class struct {
	ID            string  `json:"ID"`
	SchoolID      string  `json:"schoolId"`
	Name          string  `json:"name"`
	FullClassName string  `json:"fullClassName"`
	ClassCode     string  `json:"classCode"`
	Capacity      int     `json:"capacity"`
	LevelID       string  `json:"levelId"`
	CreatedByType string  `json:"createdByType"`
	CustomOrder   int     `json:"customOrder"`
	Subsystem     string  `json:"subsystem"`
	Level         string  `json:"level"`
	Section       string  `json:"section"`
	PassMark      float64 `json:"passMark"`
	AcademicYear  string  `json:"academicYear"`
	Subject       string  `json:"subject"`
	TeacherID     string  `json:"teacherId"`
	Year          string  `json:"year"`
	StudentCount  int     `json:"studentCount,omitempty"`
}

type ParentStudentLink struct {
	ID        string `json:"id"`
	ParentID  string `json:"parentId"`
	StudentID string `json:"studentId"`
}

type Term struct {
	ID       string `json:"id"`
	SchoolID string `json:"schoolId"`
	Name     string `json:"name"`
	Year     string `json:"year"`
}

type CourseSubject struct {
	ID          string  `json:"id"`
	SchoolID    string  `json:"schoolId"`
	ClassID     string  `json:"classId"`
	Name        string  `json:"name"`
	Coefficient float64 `json:"coefficient"`
	TeacherID   string  `json:"teacherId"`
}

type Grade struct {
	ID        string  `json:"id"`
	SchoolID  string  `json:"schoolId"`
	TermID    string  `json:"termId"`
	SubjectID string  `json:"subjectId"`
	StudentID string  `json:"studentId"`
	Score     float64 `json:"score"`
}

type AcademicYear struct {
	ID        string `json:"id"`
	SchoolID  string `json:"schoolId"`
	YearName  string `json:"yearName"`
	IsCurrent bool   `json:"isCurrent"`
}

type Sequence struct {
	ID       string `json:"id"`
	SchoolID string `json:"schoolId"`
	Name     string `json:"name"`
	IsLocked bool   `json:"isLocked"`
}

type Mark struct {
	ID          string  `json:"id"`
	SchoolID    string  `json:"schoolId"`
	StudentID   string  `json:"studentId"`
	ClassID     string  `json:"classId"`
	SubjectID   string  `json:"subjectId"`
	SequenceID  string  `json:"sequenceId"`
	Score       float64 `json:"score"`
	TeacherID   string  `json:"teacherId"`
	DateEntered string  `json:"dateEntered"`
}

type ReportCardTemplate struct {
	ID           string  `json:"id"`
	SchoolID     string  `json:"schoolId"`
	LogoURL      string  `json:"logoUrl"`
	Motto        string  `json:"motto"`
	Principal    string  `json:"principal"`
	PassingScore float64 `json:"passingScore"`
}

// =====================================================================
// DATABASE CONNECTION
// =====================================================================

var (
	pgDB     *sql.DB
	pgOnline bool
	pgMu     sync.RWMutex
)

const dsn = "host=localhost port=5432 user=postgres password=Black@123 dbname=edusphere sslmode=disable"

func connectDB() {
	if err := godotenv.Load(); err != nil {
		log.Println("[Env] No .env file found or error loading, continuing with default environment")
	}

	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		dbUrl = dsn // fallback to local
	}

	db, err := sql.Open("postgres", dbUrl)
	if err != nil {
		log.Printf("[DB] Failed to open DB: %v. Running offline.", err)
		setOffline()
		return
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(10 * time.Minute)
	db.SetConnMaxIdleTime(2 * time.Minute)

	if err = db.Ping(); err != nil {
		log.Printf("[DB] Cannot reach PostgreSQL: %v. Running offline.", err)
		setOffline()
		return
	}

	pgMu.Lock()
	pgDB = db
	pgOnline = true
	pgMu.Unlock()

	log.Println("[DB] ✅ Connected to PostgreSQL!")
	migrateSchema()

	// Initialize sync engine and trigger initial sync
	if syncEngine == nil {
		initSyncEngine(db)
		go func() {
			time.Sleep(2 * time.Second) // Wait for tables to be ready
			if err := syncEngine.SyncFromJSONToPostgres(); err != nil {
				log.Printf("[Sync] Initial sync error: %v", err)
			}
		}()
	}
}

func setOffline() {
	pgMu.Lock()
	pgOnline = false
	pgMu.Unlock()
}

func isOnline() bool {
	pgMu.RLock()
	defer pgMu.RUnlock()
	return pgOnline && pgDB != nil
}

func migrateSchema() {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS schools (id VARCHAR(36) PRIMARY KEY, name TEXT NOT NULL, primary_color TEXT, has_primary BOOLEAN DEFAULT true, has_secondary BOOLEAN DEFAULT false, config_json TEXT, admin_id VARCHAR(36), features JSONB DEFAULT '{}')`,
		`CREATE TABLE IF NOT EXISTS users (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL, first_login BOOLEAN DEFAULT true)`,
		`CREATE TABLE IF NOT EXISTS classes (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), name TEXT NOT NULL, subject TEXT, teacher_id VARCHAR(36), year TEXT)`,
		`CREATE TABLE IF NOT EXISTS parent_student_links (id VARCHAR(36) PRIMARY KEY, parent_id VARCHAR(36) NOT NULL, student_id VARCHAR(36) NOT NULL)`,
		`CREATE TABLE IF NOT EXISTS terms (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), name TEXT NOT NULL, year TEXT NOT NULL)`,
		`CREATE TABLE IF NOT EXISTS course_subjects (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), class_id VARCHAR(36), name TEXT NOT NULL, coefficient REAL NOT NULL)`,
		// Multi-sequence mark entry table
		`CREATE TABLE IF NOT EXISTS marks_entry (
			id VARCHAR(36) PRIMARY KEY,
			school_id VARCHAR(36) NOT NULL,
			teacher_id VARCHAR(36),
			subject_id VARCHAR(36) NOT NULL,
			class_id VARCHAR(36) NOT NULL,
			academic_year TEXT NOT NULL DEFAULT '',
			term INTEGER NOT NULL DEFAULT 1,
			student_id VARCHAR(36) NOT NULL,
			sequence1 REAL,
			sequence2 REAL,
			sequence3 REAL,
			sequence4 REAL,
			exam REAL,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			UNIQUE(student_id, subject_id, class_id, term, academic_year)
		)`,
		// Report cards table
		`CREATE TABLE IF NOT EXISTS report_cards (
			id VARCHAR(36) PRIMARY KEY,
			school_id VARCHAR(36) NOT NULL,
			student_id VARCHAR(36) NOT NULL,
			class_id VARCHAR(36) NOT NULL,
			academic_year TEXT NOT NULL DEFAULT '',
			term INTEGER NOT NULL DEFAULT 1,
			term_average REAL DEFAULT 0,
			class_average REAL DEFAULT 0,
			rank INTEGER DEFAULT 0,
			status TEXT DEFAULT 'draft',
			data_json TEXT DEFAULT '{}',
			generated_at TIMESTAMP DEFAULT NOW(),
			generated_by_admin_id VARCHAR(36),
			published_at TIMESTAMP,
			UNIQUE(student_id, class_id, term, academic_year)
		)`,
		`CREATE TABLE IF NOT EXISTS grades (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), term_id VARCHAR(36), subject_id VARCHAR(36), student_id VARCHAR(36), score REAL NOT NULL, UNIQUE(term_id, subject_id, student_id))`,
		`CREATE TABLE IF NOT EXISTS academic_years (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), year_name TEXT NOT NULL, is_current BOOLEAN DEFAULT false)`,
		`CREATE TABLE IF NOT EXISTS sequences (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), name TEXT NOT NULL, is_locked BOOLEAN DEFAULT false)`,
		`CREATE TABLE IF NOT EXISTS marks (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), student_id VARCHAR(36), class_id VARCHAR(36), subject_id VARCHAR(36), sequence_id VARCHAR(36), score REAL NOT NULL, teacher_id VARCHAR(36), date_entered TEXT, UNIQUE(student_id, subject_id, sequence_id))`,
		`CREATE TABLE IF NOT EXISTS report_card_templates (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36) UNIQUE, logo_url TEXT, motto TEXT, principal TEXT, passing_score REAL DEFAULT 10.0)`,
		`CREATE TABLE IF NOT EXISTS enrollments (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), student_id VARCHAR(36), class_id VARCHAR(36), year TEXT)`,
		`CREATE TABLE IF NOT EXISTS announcements (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), title TEXT, content TEXT, author_id VARCHAR(36), created_at TIMESTAMP)`,
		`CREATE TABLE IF NOT EXISTS assignments (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), title TEXT, class_id VARCHAR(36), due_date TIMESTAMP)`,
		`CREATE TABLE IF NOT EXISTS messages (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), sender_id VARCHAR(36), recipient_id VARCHAR(36), body TEXT, sent_at TIMESTAMP)`,
		`CREATE TABLE IF NOT EXISTS attendance (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), class_id VARCHAR(36) DEFAULT '', student_id VARCHAR(36), date DATE, status TEXT, teacher_id VARCHAR(36) DEFAULT '')`,
		`CREATE TABLE IF NOT EXISTS assignment_submissions (
			id VARCHAR(36) PRIMARY KEY,
			assignment_id VARCHAR(36) NOT NULL,
			school_id VARCHAR(36) NOT NULL,
			class_id VARCHAR(36) DEFAULT '',
			student_id VARCHAR(36) NOT NULL,
			student_name TEXT DEFAULT '',
			content TEXT DEFAULT '',
			file_url TEXT DEFAULT '',
			submitted_at TEXT DEFAULT '',
			grade REAL,
			feedback TEXT DEFAULT '',
			status TEXT DEFAULT 'submitted',
			UNIQUE(assignment_id, student_id)
		)`,
		`ALTER TABLE classes ADD COLUMN IF NOT EXISTS subsystem TEXT DEFAULT 'anglophone'`,
		`ALTER TABLE classes ADD COLUMN IF NOT EXISTS level TEXT DEFAULT ''`,
		`ALTER TABLE classes ADD COLUMN IF NOT EXISTS section TEXT DEFAULT ''`,
		`ALTER TABLE classes ADD COLUMN IF NOT EXISTS pass_mark REAL DEFAULT 10.0`,
		`ALTER TABLE classes ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2026/2027'`,
		`ALTER TABLE classes ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT ''`,
		`ALTER TABLE classes ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(36) DEFAULT ''`,
		`ALTER TABLE classes ADD COLUMN IF NOT EXISTS year TEXT DEFAULT ''`,
		`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS class_id VARCHAR(36) DEFAULT ''`,
		`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(36) DEFAULT ''`,
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique ON attendance(class_id, student_id, date)`,
		`CREATE TABLE IF NOT EXISTS file_assets (
			id VARCHAR(36) PRIMARY KEY,
			bucket VARCHAR(64) DEFAULT 'assets',
			key TEXT UNIQUE,
			filename TEXT NOT NULL,
			mime_type TEXT DEFAULT '',
			size_bytes BIGINT DEFAULT 0,
			storage_path TEXT DEFAULT '',
			sha256_hash TEXT DEFAULT '',
			data BYTEA,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`ALTER TABLE file_assets ADD COLUMN IF NOT EXISTS storage_path TEXT DEFAULT ''`,
		`ALTER TABLE file_assets ADD COLUMN IF NOT EXISTS sha256_hash TEXT DEFAULT ''`,
		`ALTER TABLE assignments ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(36) DEFAULT ''`,
		`ALTER TABLE assignments ADD COLUMN IF NOT EXISTS teacher_name TEXT DEFAULT ''`,
		`ALTER TABLE assignments ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''`,
		`ALTER TABLE assignments ADD COLUMN IF NOT EXISTS due_date TEXT DEFAULT ''`,
		`ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_points REAL DEFAULT 20.0`,
		`ALTER TABLE assignments ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT ''`,
		`ALTER TABLE assignments ADD COLUMN IF NOT EXISTS file_url TEXT DEFAULT ''`,
		`ALTER TABLE assignments ADD COLUMN IF NOT EXISTS file_name TEXT DEFAULT ''`,
		`ALTER TABLE assignments ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0`,
		`ALTER TABLE assignments ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT ''`,
		`ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS file_name TEXT DEFAULT ''`,
		`ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0`,
		`ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT ''`,
		`ALTER TABLE course_subjects ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(36)`,
		`ALTER TABLE marks_entry ADD COLUMN IF NOT EXISTS coefficient REAL DEFAULT 1.0`,
		`ALTER TABLE schools ADD COLUMN IF NOT EXISTS subsystem TEXT DEFAULT 'anglophone'`,
		`ALTER TABLE schools ADD COLUMN IF NOT EXISTS class_naming_type TEXT DEFAULT 'STANDARD'`,
		`ALTER TABLE schools ADD COLUMN IF NOT EXISTS section_config TEXT DEFAULT 'NONE'`,
		`ALTER TABLE classes ADD COLUMN IF NOT EXISTS full_class_name TEXT DEFAULT ''`,
		`ALTER TABLE classes ADD COLUMN IF NOT EXISTS class_code TEXT DEFAULT ''`,
		`ALTER TABLE classes ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 45`,
		`ALTER TABLE classes ADD COLUMN IF NOT EXISTS level_id TEXT DEFAULT ''`,
		`ALTER TABLE classes ADD COLUMN IF NOT EXISTS created_by_type TEXT DEFAULT 'STANDARD_AUTO'`,
		`ALTER TABLE classes ADD COLUMN IF NOT EXISTS custom_order INTEGER DEFAULT 0`,
		`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_name TEXT DEFAULT ''`,
		`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_role TEXT DEFAULT ''`,
		`ALTER TABLE messages ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT ''`,
		`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false`,
		`ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT ''`,
		`UPDATE classes SET full_class_name = name WHERE full_class_name = '' OR full_class_name IS NULL`,
		`UPDATE schools SET class_naming_type = 'STANDARD' WHERE class_naming_type = '' OR class_naming_type IS NULL`,
		`UPDATE schools SET section_config = 'NONE' WHERE section_config = '' OR section_config IS NULL`,
	}
	for _, q := range queries {
		if _, err := pgDB.Exec(q); err != nil {
			log.Printf("[DB] Migration warning: %v", err)
		}
	}
	log.Println("[DB] ✅ Schema ready.")
}

// =====================================================================
// SYNC QUEUE — offline support
// =====================================================================

type SyncAction struct {
	ID      string `json:"id"`
	Action  string `json:"action"`
	Payload string `json:"payload"`
}

const syncQueueFile = "sync_queue.json"

var (
	syncQueue   []SyncAction
	syncQueueMu sync.Mutex
)

func loadSyncQueue() {
	b, err := os.ReadFile(syncQueueFile)
	if err == nil {
		json.Unmarshal(b, &syncQueue)
	}
	if syncQueue == nil {
		syncQueue = []SyncAction{}
	}
}

func saveSyncQueue() {
	b, _ := json.MarshalIndent(syncQueue, "", "  ")
	os.WriteFile(syncQueueFile, b, 0644)
}

func enqueue(action string, payload interface{}) {
	b, _ := json.Marshal(payload)
	syncQueueMu.Lock()
	defer syncQueueMu.Unlock()
	syncQueue = append(syncQueue, SyncAction{ID: uuid.New().String(), Action: action, Payload: string(b)})
	saveSyncQueue()
}

// =====================================================================
// LOCAL FALLBACK STORAGE
// =====================================================================

type LocalDB struct {
	Schools       []School             `json:"schools"`
	Users         []User               `json:"users"`
	Classes       []Class              `json:"classes"`
	ParentLinks   []ParentStudentLink  `json:"parentLinks"`
	Terms         []Term               `json:"terms"`
	Subjects      []CourseSubject      `json:"subjects"`
	Grades        []Grade              `json:"grades"`
	AcademicYears []AcademicYear       `json:"academicYears"`
	Sequences     []Sequence           `json:"sequences"`
	Marks         []Mark               `json:"marks"`
	Templates     []ReportCardTemplate `json:"templates"`
}

var (
	localDB   LocalDB
	localDBMu sync.RWMutex
	localFile = "edusphere_local.json"
)

func loadLocalDB() {
	b, err := os.ReadFile(localFile)
	if err == nil {
		json.Unmarshal(b, &localDB)
	}
}

func saveLocalDB() {
	b, _ := json.MarshalIndent(localDB, "", "  ")
	os.WriteFile(localFile, b, 0644)
}

// =====================================================================
// SYNC WORKER
// =====================================================================

func syncWorker() {
	for {
		time.Sleep(10 * time.Second)

		if !isOnline() {
			connectDB()
			continue
		}

		syncQueueMu.Lock()
		if len(syncQueue) == 0 {
			syncQueueMu.Unlock()
			continue
		}

		log.Printf("[Sync] Processing %d queued action(s)...", len(syncQueue))
		remaining := []SyncAction{}
		for _, action := range syncQueue {
			if err := replayAction(action); err != nil {
				log.Printf("[Sync] ❌ Failed: %s — %v", action.Action, err)
				remaining = append(remaining, action)
			} else {
				log.Printf("[Sync] ✅ Replayed: %s", action.Action)
			}
		}
		syncQueue = remaining
		saveSyncQueue()
		syncQueueMu.Unlock()
	}
}

func featuresJSON(f FeatureFlags) string {
	b, _ := json.Marshal(f)
	return string(b)
}

func replayAction(action SyncAction) error {
	switch action.Action {
	case "CREATE_SCHOOL":
		var s School
		json.Unmarshal([]byte(action.Payload), &s)
		_, err := pgDB.Exec(`INSERT INTO schools(id,name,primary_color,has_primary,has_secondary,config_json,admin_id,features) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
			s.ID, s.Name, s.PrimaryColor, s.HasPrimary, s.HasSecondary, s.ConfigJSON, s.AdminID, featuresJSON(s.Features))
		return err
	case "CREATE_USER":
		var u User
		json.Unmarshal([]byte(action.Payload), &u)
		_, err := pgDB.Exec(`INSERT INTO users(id,school_id,name,email,password,role,first_login) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
			u.ID, u.SchoolID, u.Name, u.Email, u.Password, u.Role, u.FirstLogin)
		return err
	case "UPDATE_USER":
		var u User
		json.Unmarshal([]byte(action.Payload), &u)
		_, err := pgDB.Exec(`UPDATE users SET email=$1, password=$2, first_login=$3 WHERE id=$4`, u.Email, u.Password, u.FirstLogin, u.ID)
		return err
	case "DELETE_USER":
		var u User
		json.Unmarshal([]byte(action.Payload), &u)
		_, err := pgDB.Exec(`DELETE FROM users WHERE id=$1`, u.ID)
		return err
	case "CREATE_CLASS":
		var c Class
		json.Unmarshal([]byte(action.Payload), &c)
		_, err := pgDB.Exec(`INSERT INTO classes(id,school_id,name,subject,teacher_id,year) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
			c.ID, c.SchoolID, c.Name, c.Subject, c.TeacherID, c.Year)
		return err
	case "DELETE_CLASS":
		var c Class
		json.Unmarshal([]byte(action.Payload), &c)
		_, err := pgDB.Exec(`DELETE FROM classes WHERE id=$1`, c.ID)
		return err
	case "UPDATE_SCHOOL_SETTINGS":
		var s School
		json.Unmarshal([]byte(action.Payload), &s)
		_, err := pgDB.Exec(`UPDATE schools SET primary_color=$1, features=$2 WHERE id=$3`, s.PrimaryColor, featuresJSON(s.Features), s.ID)
		return err
	case "CREATE_PARENT_LINK":
		var l ParentStudentLink
		json.Unmarshal([]byte(action.Payload), &l)
		_, err := pgDB.Exec(`INSERT INTO parent_student_links(id,parent_id,student_id) VALUES($1,$2,$3) ON CONFLICT (id) DO NOTHING`,
			l.ID, l.ParentID, l.StudentID)
		return err
	case "UPDATE_PARENT_LINK":
		var p struct {
			TempParentID string `json:"tempParentId"`
			RealParentID string `json:"realParentId"`
		}
		json.Unmarshal([]byte(action.Payload), &p)
		_, err := pgDB.Exec(`UPDATE parent_student_links SET parent_id=$1 WHERE parent_id=$2`, p.RealParentID, p.TempParentID)
		return err
	case "UPSERT_GRADE":
		var g Grade
		json.Unmarshal([]byte(action.Payload), &g)
		_, err := pgDB.Exec(`
			INSERT INTO grades (id, school_id, term_id, subject_id, student_id, score) 
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT (term_id, subject_id, student_id) 
			DO UPDATE SET score = EXCLUDED.score
		`, g.ID, g.SchoolID, g.TermID, g.SubjectID, g.StudentID, g.Score)
		return err
	case "UPSERT_TEMPLATE":
		var tmpl ReportCardTemplate
		json.Unmarshal([]byte(action.Payload), &tmpl)
		_, err := pgDB.Exec(`
			INSERT INTO report_card_templates (id, school_id, logo_url, motto, principal, passing_score)
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT (school_id)
			DO UPDATE SET logo_url=EXCLUDED.logo_url, motto=EXCLUDED.motto, principal=EXCLUDED.principal, passing_score=EXCLUDED.passing_score
		`, tmpl.ID, tmpl.SchoolID, tmpl.LogoURL, tmpl.Motto, tmpl.Principal, tmpl.PassingScore)
		return err
	case "UPSERT_ACADEMIC_YEAR":
		var y AcademicYear
		json.Unmarshal([]byte(action.Payload), &y)
		_, err := pgDB.Exec(`
			INSERT INTO academic_years (id, school_id, year_name, is_current)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (id) DO UPDATE SET year_name=EXCLUDED.year_name, is_current=EXCLUDED.is_current
		`, y.ID, y.SchoolID, y.YearName, y.IsCurrent)
		return err
	case "UPSERT_SEQUENCE":
		var seq Sequence
		json.Unmarshal([]byte(action.Payload), &seq)
		_, err := pgDB.Exec(`
			INSERT INTO sequences (id, school_id, name, is_locked)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, is_locked=EXCLUDED.is_locked
		`, seq.ID, seq.SchoolID, seq.Name, seq.IsLocked)
		return err
	case "UPSERT_MARK":
		var m Mark
		json.Unmarshal([]byte(action.Payload), &m)
		_, err := pgDB.Exec(`
			INSERT INTO marks (id, school_id, student_id, class_id, subject_id, sequence_id, score, teacher_id, date_entered)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			ON CONFLICT (student_id, subject_id, sequence_id)
			DO UPDATE SET score=EXCLUDED.score, teacher_id=EXCLUDED.teacher_id, date_entered=EXCLUDED.date_entered
		`, m.ID, m.SchoolID, m.StudentID, m.ClassID, m.SubjectID, m.SequenceID, m.Score, m.TeacherID, m.DateEntered)
		return err
	}
	return nil
}

// =====================================================================
// HELPERS
// =====================================================================

func scanSchool(row *sql.Row) (School, error) {
	var s School
	var featJSON string
	var classNamingType, sectionConfig sql.NullString
	err := row.Scan(&s.ID, &s.Name, &s.PrimaryColor, &s.HasPrimary, &s.HasSecondary, &s.ConfigJSON, &s.AdminID, &featJSON, &classNamingType, &sectionConfig)
	if err == nil {
		json.Unmarshal([]byte(featJSON), &s.Features)
		s.SchoolName = s.Name
		if classNamingType.Valid && classNamingType.String != "" {
			s.ClassNamingType = classNamingType.String
		} else {
			s.ClassNamingType = "STANDARD"
		}
		if sectionConfig.Valid && sectionConfig.String != "" {
			s.SectionConfig = sectionConfig.String
		} else {
			s.SectionConfig = "NONE"
		}
	}
	return s, err
}

func generateClassCode(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "CLS"
	}
	words := strings.Fields(strings.ReplaceAll(strings.ReplaceAll(name, "-", " "), "_", " "))
	var code strings.Builder
	for _, w := range words {
		w = strings.TrimSpace(w)
		if len(w) == 0 {
			continue
		}
		upper := strings.ToUpper(w)
		if upper == "FORM" {
			code.WriteString("F")
		} else if upper == "CLASS" {
			code.WriteString("C")
		} else if upper == "PRIMARY" {
			code.WriteString("P")
		} else if upper == "SECONDARY" {
			code.WriteString("S")
		} else if upper == "LOWER" {
			code.WriteString("L")
		} else if upper == "UPPER" {
			code.WriteString("U")
		} else if upper == "SIXTH" {
			code.WriteString("6")
		} else if upper == "ADVANCED" {
			code.WriteString("ADV")
		} else if upper == "SCIENCE" {
			code.WriteString("S")
		} else if upper == "ARTS" {
			code.WriteString("A")
		} else if upper == "COMMERCIAL" {
			code.WriteString("COM")
		} else {
			if len(w) == 1 || (w[0] >= '0' && w[0] <= '9') {
				code.WriteString(upper)
			} else {
				code.WriteByte(upper[0])
			}
		}
	}
	res := code.String()
	if len(res) > 10 {
		res = res[:10]
	}
	if res == "" {
		res = "CLS"
	}
	return res
}

func jsonResp(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// =====================================================================
// MAIN
// =====================================================================

func main() {
	loadLocalDB()
	loadSyncQueue()
	connectDB()
	go syncWorker()
	go syncOnConnectionRestoration()  // Start automatic sync on connection restore

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
	}))

	r.Get("/api/status", func(w http.ResponseWriter, r *http.Request) {
		jsonResp(w, getSyncStatus())
	})

	// Manual sync endpoint
	r.Post("/api/sync/manual", func(w http.ResponseWriter, r *http.Request) {
		if !isOnline() {
			http.Error(w, "Database not connected", http.StatusServiceUnavailable)
			return
		}
		if err := syncEngine.SyncFromJSONToPostgres(); err != nil {
			http.Error(w, fmt.Sprintf("Sync failed: %v", err), http.StatusInternalServerError)
			return
		}
		jsonResp(w, map[string]interface{}{"message": "Manual sync completed successfully", "status": getSyncStatus()})
	})

	r.Post("/api/schools", createSchool)
	r.Get("/api/schools", listSchools)
	r.Get("/api/schools/{id}", getSchool)
	r.Put("/api/schools/{id}/settings", updateSchoolSettings)
	r.Post("/api/auth/login", login)
	r.Post("/api/auth/set-password", setPassword)
	r.Get("/api/users", listUsers)
	r.Post("/api/users", createUser)
	r.Delete("/api/users/{id}", deleteUser)
	r.Get("/api/classes", listClasses)
	r.Get("/api/classes/{id}", listClasses)
	r.Post("/api/classes", createClass)
	r.Post("/api/classes/{id}", createClass)
	r.Put("/api/classes/{id}", updateClass)
	r.Delete("/api/classes/{id}", deleteClass)
	r.Put("/api/classes/{id}/pass-mark", updateClassPassMark)
	r.Post("/api/classes/rollover", rolloverClasses)
	r.Get("/api/course-subjects", listCourseSubjects)
	r.Post("/api/course-subjects", saveCourseSubject)
	r.Post("/api/parents/generate", generateParent)
	r.Post("/api/parents/claim", claimParentAccount)
	r.Post("/api/parents/link-child", linkChildToParent)
	r.Get("/api/parents/{id}/children", getParentChildren)
	r.Post("/api/marks/bulk", bulkUploadMarks)
	r.Post("/api/marks/save-batch", saveMarksBatch)
	r.Get("/api/marks/teacher", getTeacherMarks)
	r.Get("/api/marks/class/{classId}/{term}", getClassMarks)
	r.Post("/api/marks", upsertMark)
	r.Get("/api/marks", listMarks)
	r.Get("/api/marks/student/{id}", getStudentMarks)
	r.Post("/api/sequences/lock", lockSequence)
	r.Get("/api/sequences", listSequences)
	r.Post("/api/sequences", createSequence)

	r.Post("/api/grades/bulk", bulkUploadGrades)
	r.Get("/api/report-cards/student/{id}", getStudentReportCard)
	r.Get("/api/report-cards/class/{class_id}", getClassReportCards)
	r.Post("/api/report-cards/generate-single", generateSingleReportCard)
	r.Post("/api/report-cards/generate-bulk", generateBulkReportCards)
	r.Put("/api/report-cards/{id}/publish", publishReportCard)
	r.Get("/api/report-cards/list", listReportCards)
	r.Post("/api/report-cards/templates", saveReportCardTemplate)

	// Enrollments
	r.Get("/api/enrollments", listEnrollments)
	r.Post("/api/enrollments", enrollStudent)
	r.Delete("/api/enrollments", unenrollStudent)

	// Announcements
	r.Get("/api/announcements", listAnnouncements)
	r.Post("/api/announcements", createAnnouncement)
	r.Delete("/api/announcements/{id}", deleteAnnouncement)

	// Assignments
	r.Get("/api/assignments", listAssignments)
	r.Post("/api/assignments", createAssignment)
	r.Delete("/api/assignments/{id}", deleteAssignment)
	r.Post("/api/assignments/submit", submitAssignment)
	r.Get("/api/assignments/{id}/submissions", listAssignmentSubmissions)
	r.Get("/api/assignments/student-submissions", listStudentSubmissions)
	r.Put("/api/assignments/submissions/{id}/grade", gradeAssignmentSubmission)

	// File Upload & Asset Storage
	r.Post("/api/upload", uploadFileHandler)
	r.Get("/api/files/{id}", getFileHandler)
	r.Get("/api/files/download/{id}", downloadFileHandler)

	// Safe file serving for uploads directory (with CORS & Security Headers)
	uploadDir := "./uploads"
	_ = os.MkdirAll(uploadDir, 0755)
	_ = os.MkdirAll(IsolatedStorageDir, 0700)
	r.Get("/uploads/*", func(w http.ResponseWriter, r *http.Request) {
		setSecurityHeaders(w)
		param := chi.URLParam(r, "*")
		safeParam := sanitizeFilename(param)
		if safeParam == "" {
			http.Error(w, "Invalid path", http.StatusBadRequest)
			return
		}
		candidatePaths := []string{
			filepath.Join("./uploads", safeParam),
			filepath.Join(IsolatedStorageDir, fmt.Sprintf("%s.dat", safeParam)),
		}
		if strings.Contains(safeParam, "_") {
			parts := strings.SplitN(safeParam, "_", 2)
			candidatePaths = append(candidatePaths, filepath.Join(IsolatedStorageDir, fmt.Sprintf("%s.dat", parts[0])))
		}
		for _, p := range candidatePaths {
			if fi, err := os.Stat(p); err == nil && !fi.IsDir() {
				if f, err := os.Open(p); err == nil {
					defer f.Close()
					ext := strings.ToLower(filepath.Ext(safeParam))
					if isDangerousFile(ext) {
						w.Header().Set("Content-Type", "application/octet-stream")
						w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", safeParam))
					} else {
						mimeType := mime.TypeByExtension(ext)
						if mimeType == "" {
							mimeType = "application/octet-stream"
						}
						w.Header().Set("Content-Type", mimeType)
					}
					http.ServeContent(w, r, safeParam, fi.ModTime(), f)
					return
				}
			}
		}
		http.Error(w, "File not found", http.StatusNotFound)
	})

	// Messages
	r.Get("/api/messages", listMessages)
	r.Post("/api/messages", sendMessage)
	r.Put("/api/messages/{id}/read", markMessageRead)

	// Attendance
	r.Get("/api/attendance", listAttendance)
	r.Post("/api/attendance", saveAttendance)

	// Dashboard stats
	r.Get("/api/dashboard/admin/{schoolId}", adminDashboardStats)
	r.Get("/api/dashboard/teacher/{teacherId}", teacherDashboardStats)
	r.Get("/api/dashboard/student/{studentId}", studentDashboardStats)

	fmt.Println("🚀 Edvance server running on :8080 (PostgreSQL + Offline Sync)")
	log.Fatal(http.ListenAndServe(":8080", r))
}

// =====================================================================
// SCHOOL HANDLERS
// =====================================================================

type CreateSchoolRequest struct {
	AdminName       string `json:"adminName"`
	AdminEmail      string `json:"adminEmail"`
	AdminPass       string `json:"adminPass"`
	SchoolName      string `json:"schoolName"`
	PrimaryColor    string `json:"primaryColor"`
	HasPrimary      bool   `json:"hasPrimary"`
	HasSecondary    bool   `json:"hasSecondary"`
	ConfigJSON      string `json:"configJson"`
	ClassNamingType string `json:"classNamingType"`
	SectionConfig   string `json:"sectionConfig"`
}

func createSchool(w http.ResponseWriter, r *http.Request) {
	var req CreateSchoolRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	schoolID := uuid.New().String()
	adminID := uuid.New().String()

	if req.ClassNamingType == "" {
		req.ClassNamingType = "STANDARD"
	}
	if req.SectionConfig == "" {
		req.SectionConfig = "NONE"
	}

	school := School{
		ID:              schoolID,
		Name:            req.SchoolName,
		PrimaryColor:    req.PrimaryColor,
		HasPrimary:      req.HasPrimary,
		HasSecondary:    req.HasSecondary,
		ConfigJSON:      req.ConfigJSON,
		AdminID:         adminID,
		Features:        FeatureFlags{true, true, true, true, true, true},
		ClassNamingType: req.ClassNamingType,
		SectionConfig:   req.SectionConfig,
	}
	admin := User{
		ID:         adminID,
		SchoolID:   schoolID,
		Name:       req.AdminName,
		Email:      req.AdminEmail,
		Password:   req.AdminPass,
		Role:       "Admin",
		FirstLogin: false,
	}

	if isOnline() {
		if _, err := pgDB.Exec(`INSERT INTO schools(id,name,primary_color,has_primary,has_secondary,config_json,admin_id,features,class_naming_type,section_config) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
			school.ID, school.Name, school.PrimaryColor, school.HasPrimary, school.HasSecondary, school.ConfigJSON, school.AdminID, featuresJSON(school.Features), school.ClassNamingType, school.SectionConfig); err != nil {
			log.Printf("[createSchool] INSERT school error: %v", err)
			http.Error(w, fmt.Sprintf("Failed to save school to database: %v", err), http.StatusInternalServerError)
			return
		}
		if _, err := pgDB.Exec(`INSERT INTO users(id,school_id,name,email,password,role,first_login) VALUES($1,$2,$3,$4,$5,$6,$7)`,
			admin.ID, admin.SchoolID, admin.Name, admin.Email, admin.Password, admin.Role, admin.FirstLogin); err != nil {
			log.Printf("[createSchool] INSERT user error: %v", err)
			if strings.Contains(err.Error(), "unique constraint") || strings.Contains(err.Error(), "duplicate key") {
				http.Error(w, "An account with this admin email already exists. Please use a different email or log in.", http.StatusConflict)
			} else {
				http.Error(w, fmt.Sprintf("Failed to create admin user: %v", err), http.StatusInternalServerError)
			}
			return
		}
	} else {
		localDBMu.Lock()
		localDB.Schools = append(localDB.Schools, school)
		localDB.Users = append(localDB.Users, admin)
		saveLocalDB()
		localDBMu.Unlock()
		enqueue("CREATE_SCHOOL", school)
		enqueue("CREATE_USER", admin)
	}

	// Auto-generate standard classes if STANDARD naming type
	if strings.EqualFold(req.ClassNamingType, "STANDARD") {
		var levels []string
		if req.HasSecondary {
			levels = append(levels, "Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Lower Sixth", "Upper Sixth")
		}
		if req.HasPrimary {
			levels = append(levels, "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6")
		}

		var sectionSuffixes []string
		switch req.SectionConfig {
		case "2_SECTIONS":
			sectionSuffixes = []string{"A", "B"}
		case "3_SECTIONS":
			sectionSuffixes = []string{"A", "B", "C"}
		case "4_SECTIONS":
			sectionSuffixes = []string{"A", "B", "C", "D"}
		default:
			sectionSuffixes = []string{""}
		}

		orderIndex := 1
		for _, lvl := range levels {
			for _, sfx := range sectionSuffixes {
				className := lvl
				if sfx != "" {
					className = fmt.Sprintf("%s %s", lvl, sfx)
				}
				clsCode := generateClassCode(className)
				clsID := uuid.New().String()
				newClass := Class{
					ID:            clsID,
					SchoolID:      schoolID,
					Name:          className,
					FullClassName: className,
					ClassCode:     clsCode,
					Capacity:      45,
					CreatedByType: "STANDARD_AUTO",
					CustomOrder:   orderIndex,
					Subsystem:     "anglophone",
					Level:         lvl,
					Section:       sfx,
					PassMark:      10.0,
					AcademicYear:  "2026/2027",
				}
				orderIndex++

				if isOnline() {
					pgDB.Exec(`INSERT INTO classes(id,school_id,name,full_class_name,class_code,capacity,created_by_type,custom_order,subsystem,level,section,pass_mark,academic_year,subject,teacher_id,year)
						VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
						newClass.ID, newClass.SchoolID, newClass.Name, newClass.FullClassName, newClass.ClassCode,
						newClass.Capacity, newClass.CreatedByType, newClass.CustomOrder,
						newClass.Subsystem, newClass.Level, newClass.Section, newClass.PassMark, newClass.AcademicYear,
						newClass.Subject, newClass.TeacherID, newClass.Year)
				} else {
					localDBMu.Lock()
					localDB.Classes = append(localDB.Classes, newClass)
					saveLocalDB()
					localDBMu.Unlock()
					enqueue("CREATE_CLASS", newClass)
				}
			}
		}
	}

	jsonResp(w, map[string]interface{}{"schoolId": schoolID, "adminId": adminID, "message": "School created", "classNamingType": school.ClassNamingType, "sectionConfig": school.SectionConfig})
}

func getSchool(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if isOnline() {
		row := pgDB.QueryRow(`SELECT id,name,primary_color,has_primary,has_secondary,config_json,admin_id,features, COALESCE(class_naming_type, 'STANDARD'), COALESCE(section_config, 'NONE') FROM schools WHERE id=$1`, id)
		s, err := scanSchool(row)
		if err != nil {
			http.Error(w, "School not found", http.StatusNotFound)
			return
		}
		jsonResp(w, s)
	} else {
		localDBMu.RLock()
		defer localDBMu.RUnlock()
		for _, s := range localDB.Schools {
			if s.ID == id {
				jsonResp(w, s)
				return
			}
		}
		http.Error(w, "School not found", http.StatusNotFound)
	}
}

func listSchools(w http.ResponseWriter, r *http.Request) {
	type SS struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
	var list []SS
	if isOnline() {
		rows, err := pgDB.Query(`SELECT id, name FROM schools`)
		if err != nil || rows == nil {
			if err != nil {
				log.Printf("[Schools] listSchools query failed: %v", err)
			}
			jsonResp(w, []SS{})
			return
		}
		defer rows.Close()
		for rows.Next() {
			var s SS
			if err := rows.Scan(&s.ID, &s.Name); err != nil {
				log.Printf("[Schools] scan failed: %v", err)
				continue
			}
			list = append(list, s)
		}
	} else {
		localDBMu.RLock()
		defer localDBMu.RUnlock()
		for _, s := range localDB.Schools {
			list = append(list, SS{s.ID, s.Name})
		}
	}
	jsonResp(w, list)
}

type UpdateSchoolSettingsRequest struct {
	PrimaryColor string       `json:"primaryColor"`
	Features     FeatureFlags `json:"features"`
}

func updateSchoolSettings(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req UpdateSchoolSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if isOnline() {
		pgDB.Exec(`UPDATE schools SET primary_color=$1, features=$2 WHERE id=$3`, req.PrimaryColor, featuresJSON(req.Features), id)
		row := pgDB.QueryRow(`SELECT id,name,primary_color,has_primary,has_secondary,config_json,admin_id,features FROM schools WHERE id=$1`, id)
		s, _ := scanSchool(row)
		jsonResp(w, s)
	} else {
		localDBMu.Lock()
		var updated School
		for i, s := range localDB.Schools {
			if s.ID == id {
				localDB.Schools[i].PrimaryColor = req.PrimaryColor
				localDB.Schools[i].Features = req.Features
				updated = localDB.Schools[i]
				break
			}
		}
		saveLocalDB()
		localDBMu.Unlock()
		enqueue("UPDATE_SCHOOL_SETTINGS", updated)
		jsonResp(w, updated)
	}
}

// =====================================================================
// AUTH HANDLERS
// =====================================================================

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func findUser(email, password string) *User {
	if isOnline() {
		// Ensure email comparison is case-insensitive by lowercasing input
	emailLower := strings.ToLower(email)
	row := pgDB.QueryRow(`SELECT id,school_id,name,email,password,role,first_login FROM users WHERE LOWER(email)=$1 AND password=$2`, emailLower, password)
		var u User
		if err := row.Scan(&u.ID, &u.SchoolID, &u.Name, &u.Email, &u.Password, &u.Role, &u.FirstLogin); err == nil {
			return &u
		}
	} else {
		localDBMu.RLock()
		defer localDBMu.RUnlock()
		for _, u := range localDB.Users {
			if u.Email == email && u.Password == password {
				copy := u
				return &copy
			}
		}
	}
	return nil
}

func findSchool(id string) School {
	if isOnline() {
		row := pgDB.QueryRow(`SELECT id,name,primary_color,has_primary,has_secondary,config_json,admin_id,features FROM schools WHERE id=$1`, id)
		s, _ := scanSchool(row)
		return s
	}
	localDBMu.RLock()
	defer localDBMu.RUnlock()
	for _, s := range localDB.Schools {
		if s.ID == id {
			return s
		}
	}
	return School{}
}

func login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	u := findUser(req.Email, req.Password)
	if u == nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}
	school := findSchool(u.SchoolID)
	jsonResp(w, map[string]interface{}{
		"userId": u.ID, "schoolId": u.SchoolID, "role": u.Role,
		"name": u.Name, "email": u.Email, "firstLogin": u.FirstLogin, "school": school,
	})
}

type SetPasswordRequest struct {
	UserID      string `json:"userId"`
	NewPassword string `json:"newPassword"`
}

func setPassword(w http.ResponseWriter, r *http.Request) {
	var req SetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if isOnline() {
		pgDB.Exec(`UPDATE users SET password=$1, first_login=false WHERE id=$2`, req.NewPassword, req.UserID)
	} else {
		localDBMu.Lock()
		for i, u := range localDB.Users {
			if u.ID == req.UserID {
				localDB.Users[i].Password = req.NewPassword
				localDB.Users[i].FirstLogin = false
				enqueue("UPDATE_USER", localDB.Users[i])
				break
			}
		}
		saveLocalDB()
		localDBMu.Unlock()
	}
	jsonResp(w, map[string]interface{}{"message": "Password updated"})
}

// =====================================================================
// USER HANDLERS
// =====================================================================

type SafeUser struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	Role       string `json:"role"`
	FirstLogin bool   `json:"firstLogin"`
}

func listUsers(w http.ResponseWriter, r *http.Request) {
	schoolID := r.URL.Query().Get("schoolId")
	roleFilter := r.URL.Query().Get("role")
	var list []SafeUser

	if isOnline() {
		q := `SELECT id,name,email,role,first_login FROM users WHERE 1=1`
		args := []interface{}{}
		n := 1
		if schoolID != "" {
			q += fmt.Sprintf(" AND school_id=$%d", n); args = append(args, schoolID); n++
		}
		if roleFilter != "" {
			q += fmt.Sprintf(" AND LOWER(role)=LOWER($%d)", n); args = append(args, roleFilter); n++
		}
		rows, err := pgDB.Query(q, args...)
		if err != nil || rows == nil {
			if err != nil {
				log.Printf("[Users] listUsers query failed: %v", err)
			}
			jsonResp(w, []SafeUser{})
			return
		}
		defer rows.Close()
		for rows.Next() {
			var u SafeUser
			if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.FirstLogin); err != nil {
				log.Printf("[Users] scan failed: %v", err)
				continue
			}
			list = append(list, u)
		}
	} else {
		localDBMu.RLock()
		defer localDBMu.RUnlock()
		for _, u := range localDB.Users {
			if schoolID != "" && u.SchoolID != schoolID { continue }
			if roleFilter != "" && !strings.EqualFold(u.Role, roleFilter) { continue }
			list = append(list, SafeUser{u.ID, u.Name, u.Email, u.Role, u.FirstLogin})
		}
	}
	jsonResp(w, list)
}

type CreateUserRequest struct {
	SchoolID string `json:"schoolId"`
	Name     string `json:"name"`
	Role     string `json:"role"`
}

func createUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	schoolName := ""
	if isOnline() {
		pgDB.QueryRow(`SELECT name FROM schools WHERE id=$1`, req.SchoolID).Scan(&schoolName)
	} else {
		localDBMu.RLock()
		for _, s := range localDB.Schools { if s.ID == req.SchoolID { schoolName = s.Name; break } }
		localDBMu.RUnlock()
	}
	if schoolName == "" { http.Error(w, "School not found", http.StatusNotFound); return }

	// Trim spaces and normalize name and school for email generation
	cleanName := strings.TrimSpace(strings.ReplaceAll(strings.ToLower(req.Name), " ", "."))
	cleanSchool := strings.ReplaceAll(strings.ToLower(schoolName), " ", "")
	email := fmt.Sprintf("%s@%s.edvance.com", cleanName, cleanSchool)

	// Ensure unique email
	for counter := 1; ; counter++ {
		taken := false
		if isOnline() {
			var c int
			pgDB.QueryRow(`SELECT COUNT(*) FROM users WHERE email=$1`, email).Scan(&c)
			taken = c > 0
		} else {
			localDBMu.RLock()
			for _, u := range localDB.Users { if u.Email == email { taken = true; break } }
			localDBMu.RUnlock()
		}
		if !taken { break }
		email = fmt.Sprintf("%s%d@%s.edvance.com", cleanName, counter, cleanSchool)
	}

	newUser := User{
		ID: uuid.New().String(), SchoolID: req.SchoolID,
		Name: req.Name, Email: email, Password: "welcome123",
		Role: req.Role, FirstLogin: !strings.EqualFold(req.Role, "Admin"),
	}

	if isOnline() {
		pgDB.Exec(`INSERT INTO users(id,school_id,name,email,password,role,first_login) VALUES($1,$2,$3,$4,$5,$6,$7)`,
			newUser.ID, newUser.SchoolID, newUser.Name, newUser.Email, newUser.Password, newUser.Role, newUser.FirstLogin)
	} else {
		localDBMu.Lock()
		localDB.Users = append(localDB.Users, newUser)
		saveLocalDB()
		localDBMu.Unlock()
		enqueue("CREATE_USER", newUser)
	}

	jsonResp(w, map[string]interface{}{
		"userId": newUser.ID, "email": newUser.Email, "password": newUser.Password,
		"name": newUser.Name, "tempPassword": newUser.Password, "message": req.Role + " created",
	})
}

func deleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if isOnline() {
		pgDB.Exec(`DELETE FROM users WHERE id=$1`, id)
	} else {
		localDBMu.Lock()
		nl := []User{}
		for _, u := range localDB.Users { if u.ID != id { nl = append(nl, u) } }
		localDB.Users = nl
		saveLocalDB()
		localDBMu.Unlock()
		enqueue("DELETE_USER", User{ID: id})
	}
	jsonResp(w, map[string]interface{}{"message": "User deleted"})
}

// =====================================================================
// CLASS HANDLERS
// =====================================================================

func listClasses(w http.ResponseWriter, r *http.Request) {
	schoolID := r.URL.Query().Get("schoolId")
	if schoolID == "" {
		schoolID = chi.URLParam(r, "id")
	}
	academicYear := r.URL.Query().Get("academicYear")
	if schoolID == "undefined" || schoolID == "null" { schoolID = "" }
	var list []Class
	if isOnline() {
		q := `SELECT c.id, c.school_id, c.name, COALESCE(NULLIF(c.full_class_name, ''), c.name), COALESCE(c.class_code,''), COALESCE(c.capacity, 45), COALESCE(c.created_by_type, 'STANDARD_AUTO'), COALESCE(c.custom_order, 0), COALESCE(c.subsystem,'anglophone'), COALESCE(c.level,''), COALESCE(c.section,''), COALESCE(c.pass_mark, 10.0), COALESCE(c.academic_year,'2026/2027'), COALESCE(c.subject,''), COALESCE(c.teacher_id,''), COALESCE(c.year,''),
			(SELECT COUNT(*) FROM enrollments WHERE class_id = c.id) AS student_count
			FROM classes c WHERE 1=1`
		args := []interface{}{}
		n := 1
		if schoolID != "" { q += fmt.Sprintf(" AND c.school_id=$%d", n); args = append(args, schoolID); n++ }
		if academicYear != "" { q += fmt.Sprintf(" AND c.academic_year=$%d", n); args = append(args, academicYear); n++ }
		q += " ORDER BY c.custom_order ASC, c.level ASC, c.name ASC"
		rows, err := pgDB.Query(q, args...)
		if err == nil && rows != nil {
			defer rows.Close()
			for rows.Next() {
				var c Class
				rows.Scan(&c.ID, &c.SchoolID, &c.Name, &c.FullClassName, &c.ClassCode, &c.Capacity, &c.CreatedByType, &c.CustomOrder, &c.Subsystem, &c.Level, &c.Section, &c.PassMark, &c.AcademicYear, &c.Subject, &c.TeacherID, &c.Year, &c.StudentCount)
				if c.FullClassName != "" {
					c.Name = c.FullClassName
				}
				list = append(list, c)
			}
		}
	} else {
		localDBMu.RLock()
		defer localDBMu.RUnlock()
		for _, c := range localDB.Classes {
			if schoolID != "" && c.SchoolID != schoolID { continue }
			if academicYear != "" && c.AcademicYear != "" && c.AcademicYear != academicYear { continue }
			if c.FullClassName != "" {
				c.Name = c.FullClassName
			}
			list = append(list, c)
		}
	}
	if list == nil { list = []Class{} }
	jsonResp(w, list)
}

type CreateClassRequest struct {
	SchoolID      string  `json:"schoolId"`
	Name          string  `json:"name"`
	FullClassName string  `json:"fullClassName"`
	ClassCode     string  `json:"classCode"`
	Capacity      int     `json:"capacity"`
	LevelID       string  `json:"levelId"`
	CreatedByType string  `json:"createdByType"`
	CustomOrder   int     `json:"customOrder"`
	Subsystem     string  `json:"subsystem"`
	Level         string  `json:"level"`
	Section       string  `json:"section"`
	PassMark      float64 `json:"passMark"`
	AcademicYear  string  `json:"academicYear"`
	Subject       string  `json:"subject"`
	TeacherID     string  `json:"teacherId"`
	Year          string  `json:"year"`
}

func createClass(w http.ResponseWriter, r *http.Request) {
	var req CreateClassRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if req.SchoolID == "" {
		req.SchoolID = chi.URLParam(r, "id")
	}
	className := strings.TrimSpace(req.FullClassName)
	if className == "" {
		className = strings.TrimSpace(req.Name)
	}
	if className == "" {
		http.Error(w, "Class name is required", http.StatusBadRequest)
		return
	}
	if len(className) > 100 {
		http.Error(w, "Class name cannot exceed 100 characters", http.StatusBadRequest)
		return
	}
	if req.Capacity <= 0 {
		req.Capacity = 45
	}
	if req.ClassCode == "" {
		req.ClassCode = generateClassCode(className)
	}
	if req.PassMark <= 0 { req.PassMark = 10.0 }
	if req.AcademicYear == "" { req.AcademicYear = "2026/2027" }
	if req.Subsystem == "" { req.Subsystem = "anglophone" }
	if req.CreatedByType == "" { req.CreatedByType = "CUSTOM_MANUAL" }

	if isOnline() {
		var count int
		pgDB.QueryRow(`SELECT COUNT(*) FROM classes WHERE school_id=$1 AND (LOWER(name)=LOWER($2) OR LOWER(full_class_name)=LOWER($2))`, req.SchoolID, className).Scan(&count)
		if count > 0 {
			http.Error(w, "A class with this name already exists in this school", http.StatusBadRequest)
			return
		}
	}

	c := Class{
		ID:            uuid.New().String(),
		SchoolID:      req.SchoolID,
		Name:          className,
		FullClassName: className,
		ClassCode:     req.ClassCode,
		Capacity:      req.Capacity,
		LevelID:       req.LevelID,
		CreatedByType: req.CreatedByType,
		CustomOrder:   req.CustomOrder,
		Subsystem:     req.Subsystem,
		Level:         req.Level,
		Section:       req.Section,
		PassMark:      req.PassMark,
		AcademicYear:  req.AcademicYear,
		Subject:       req.Subject,
		TeacherID:     req.TeacherID,
		Year:          req.Year,
	}

	if isOnline() {
		_, err := pgDB.Exec(`INSERT INTO classes(id,school_id,name,full_class_name,class_code,capacity,created_by_type,custom_order,subsystem,level,section,pass_mark,academic_year,subject,teacher_id,year)
			VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
			c.ID, c.SchoolID, c.Name, c.FullClassName, c.ClassCode, c.Capacity, c.CreatedByType, c.CustomOrder,
			c.Subsystem, c.Level, c.Section, c.PassMark, c.AcademicYear, c.Subject, c.TeacherID, c.Year)
		if err != nil {
			log.Printf("[Classes] Create error: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		localDBMu.Lock()
		localDB.Classes = append(localDB.Classes, c)
		saveLocalDB()
		localDBMu.Unlock()
		enqueue("CREATE_CLASS", c)
	}
	jsonResp(w, c)
}

type UpdateClassRequest struct {
	Name          string  `json:"name"`
	FullClassName string  `json:"fullClassName"`
	ClassCode     string  `json:"classCode"`
	Capacity      int     `json:"capacity"`
	TeacherID     string  `json:"teacherId"`
	Subject       string  `json:"subject"`
	Year          string  `json:"year"`
	PassMark      float64 `json:"passMark"`
}

func updateClass(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req UpdateClassRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	className := strings.TrimSpace(req.FullClassName)
	if className == "" {
		className = strings.TrimSpace(req.Name)
	}
	if className == "" {
		http.Error(w, "Class name is required", http.StatusBadRequest)
		return
	}
	if len(className) > 100 {
		http.Error(w, "Class name cannot exceed 100 characters", http.StatusBadRequest)
		return
	}
	if req.Capacity <= 0 {
		req.Capacity = 45
	}
	if req.ClassCode == "" {
		req.ClassCode = generateClassCode(className)
	}

	if isOnline() {
		var count int
		pgDB.QueryRow(`SELECT COUNT(*) FROM classes WHERE id != $1 AND school_id = (SELECT school_id FROM classes WHERE id=$1) AND (LOWER(name)=LOWER($2) OR LOWER(full_class_name)=LOWER($2))`, id, className).Scan(&count)
		if count > 0 {
			http.Error(w, "A class with this name already exists in this school", http.StatusBadRequest)
			return
		}

		_, err := pgDB.Exec(`UPDATE classes SET name=$1, full_class_name=$2, class_code=$3, capacity=$4, teacher_id=$5 WHERE id=$6`,
			className, className, req.ClassCode, req.Capacity, req.TeacherID, id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		localDBMu.Lock()
		for i, c := range localDB.Classes {
			if c.ID == id {
				localDB.Classes[i].Name = className
				localDB.Classes[i].FullClassName = className
				localDB.Classes[i].ClassCode = req.ClassCode
				localDB.Classes[i].Capacity = req.Capacity
				localDB.Classes[i].TeacherID = req.TeacherID
				break
			}
		}
		saveLocalDB()
		localDBMu.Unlock()
	}
	jsonResp(w, map[string]interface{}{"message": "Class updated successfully", "id": id, "name": className, "fullClassName": className, "classCode": req.ClassCode, "capacity": req.Capacity})
}

func updateClassPassMark(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		PassMark float64 `json:"passMark"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if req.PassMark <= 0 { req.PassMark = 10.0 }
	if isOnline() {
		pgDB.Exec(`UPDATE classes SET pass_mark=$1 WHERE id=$2`, req.PassMark, id)
	} else {
		localDBMu.Lock()
		for i, c := range localDB.Classes {
			if c.ID == id {
				localDB.Classes[i].PassMark = req.PassMark
				break
			}
		}
		saveLocalDB()
		localDBMu.Unlock()
	}
	jsonResp(w, map[string]interface{}{"id": id, "passMark": req.PassMark, "message": "Pass mark updated successfully"})
}

type RolloverRequest struct {
	SchoolID       string `json:"schoolId"`
	FromYear       string `json:"fromYear"`
	ToYear         string `json:"toYear"`
	IncludeTeacher bool   `json:"includeTeacher"`
}

func rolloverClasses(w http.ResponseWriter, r *http.Request) {
	var req RolloverRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if req.SchoolID == "" || req.FromYear == "" || req.ToYear == "" {
		http.Error(w, "schoolId, fromYear, and toYear are required", http.StatusBadRequest)
		return
	}
	copied := 0
	if isOnline() {
		rows, err := pgDB.Query(`SELECT name, subsystem, level, section, pass_mark, subject, teacher_id, year FROM classes WHERE school_id=$1 AND academic_year=$2`, req.SchoolID, req.FromYear)
		if err == nil && rows != nil {
			defer rows.Close()
			for rows.Next() {
				var name, subsystem, level, section, subject, teacherID, year string
				var passMark float64
				rows.Scan(&name, &subsystem, &level, &section, &passMark, &subject, &teacherID, &year)
				if !req.IncludeTeacher { teacherID = "" }
				newID := uuid.New().String()
				// Construct new name reflecting the new year if it contained the old year
				newName := name
				if len(req.FromYear) > 0 && len(req.ToYear) > 0 {
					newName = strings.ReplaceAll(name, req.FromYear, req.ToYear)
				}
				pgDB.Exec(`INSERT INTO classes(id,school_id,name,subsystem,level,section,pass_mark,academic_year,subject,teacher_id,year) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
					newID, req.SchoolID, newName, subsystem, level, section, passMark, req.ToYear, subject, teacherID, year)
				copied++
			}
		}
	}
	jsonResp(w, map[string]interface{}{"copied": copied, "message": fmt.Sprintf("Successfully rolled over %d classes to %s", copied, req.ToYear)})
}

func listCourseSubjects(w http.ResponseWriter, r *http.Request) {
	classID := r.URL.Query().Get("classId")
	schoolID := r.URL.Query().Get("schoolId")
	var list []CourseSubject
	if isOnline() {
		q := `SELECT id, school_id, class_id, name, coefficient, COALESCE(teacher_id,'') FROM course_subjects WHERE 1=1`
		args := []interface{}{}
		n := 1
		if classID != "" { q += fmt.Sprintf(" AND class_id=$%d", n); args = append(args, classID); n++ }
		if schoolID != "" { q += fmt.Sprintf(" AND school_id=$%d", n); args = append(args, schoolID); n++ }
		rows, err := pgDB.Query(q, args...)
		if err == nil && rows != nil {
			defer rows.Close()
			for rows.Next() {
				var s CourseSubject
				rows.Scan(&s.ID, &s.SchoolID, &s.ClassID, &s.Name, &s.Coefficient, &s.TeacherID)
				list = append(list, s)
			}
		}
	}
	if list == nil { list = []CourseSubject{} }
	jsonResp(w, list)
}

func saveCourseSubject(w http.ResponseWriter, r *http.Request) {
	var s CourseSubject
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if s.Coefficient <= 0 { s.Coefficient = 1.0 }
	if s.ID == "" { s.ID = uuid.New().String() }
	if isOnline() {
		pgDB.Exec(`INSERT INTO course_subjects(id, school_id, class_id, name, coefficient, teacher_id)
			VALUES($1,$2,$3,$4,$5,$6)
			ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, coefficient=EXCLUDED.coefficient, teacher_id=EXCLUDED.teacher_id`,
			s.ID, s.SchoolID, s.ClassID, s.Name, s.Coefficient, s.TeacherID)
	}
	jsonResp(w, s)
}

func deleteClass(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if isOnline() {
		var studentCount int
		pgDB.QueryRow(`SELECT COUNT(*) FROM enrollments WHERE class_id=$1`, id).Scan(&studentCount)
		if studentCount > 0 {
			http.Error(w, fmt.Sprintf("Cannot delete class: %d student(s) are currently enrolled in it. Please unenroll or transfer them first.", studentCount), http.StatusBadRequest)
			return
		}

		var courseCount int
		pgDB.QueryRow(`SELECT COUNT(*) FROM course_subjects WHERE class_id=$1`, id).Scan(&courseCount)
		if courseCount > 0 {
			http.Error(w, fmt.Sprintf("Cannot delete class: %d course subject(s) are assigned to it. Please remove subjects first.", courseCount), http.StatusBadRequest)
			return
		}

		pgDB.Exec(`DELETE FROM classes WHERE id=$1`, id)
	} else {
		localDBMu.Lock()
		nl := []Class{}
		for _, c := range localDB.Classes { if c.ID != id { nl = append(nl, c) } }
		localDB.Classes = nl
		saveLocalDB()
		localDBMu.Unlock()
		enqueue("DELETE_CLASS", Class{ID: id})
	}
	jsonResp(w, map[string]interface{}{"message": "Class deleted"})
}

// =====================================================================
// PARENT HANDLERS
// =====================================================================

type GenerateParentRequest struct {
	StudentEmail string `json:"studentEmail"`
	ParentName   string `json:"parentName"`
}

func generateParent(w http.ResponseWriter, r *http.Request) {
	var req GenerateParentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var studentID string
	if isOnline() {
		pgDB.QueryRow(`SELECT id FROM users WHERE email=$1 AND role='Student'`, req.StudentEmail).Scan(&studentID)
	} else {
		localDBMu.RLock()
		for _, u := range localDB.Users { if u.Email == req.StudentEmail && u.Role == "Student" { studentID = u.ID; break } }
		localDBMu.RUnlock()
	}
	if studentID == "" { http.Error(w, "Student not found", http.StatusNotFound); return }

	parentID := uuid.New().String()
	tempEmail := fmt.Sprintf("parent_%s@temp.edvance.com", parentID[:8])
	parent := User{ID: parentID, Name: req.ParentName, Email: tempEmail, Password: "temp1234", Role: "Parent", FirstLogin: true}
	link := ParentStudentLink{ID: uuid.New().String(), ParentID: parentID, StudentID: studentID}

	if isOnline() {
		pgDB.Exec(`INSERT INTO users(id,school_id,name,email,password,role,first_login) VALUES($1,$2,$3,$4,$5,$6,$7)`,
			parent.ID, "", parent.Name, parent.Email, parent.Password, parent.Role, parent.FirstLogin)
		pgDB.Exec(`INSERT INTO parent_student_links(id,parent_id,student_id) VALUES($1,$2,$3)`, link.ID, link.ParentID, link.StudentID)
	} else {
		localDBMu.Lock()
		localDB.Users = append(localDB.Users, parent)
		localDB.ParentLinks = append(localDB.ParentLinks, link)
		saveLocalDB()
		localDBMu.Unlock()
		enqueue("CREATE_USER", parent)
		enqueue("CREATE_PARENT_LINK", link)
	}

	jsonResp(w, map[string]interface{}{"email": tempEmail, "password": "temp1234", "message": "Parent credentials generated"})
}

type ClaimParentRequest struct {
	ParentID    string `json:"parentId"`
	NewEmail    string `json:"newEmail"`
	NewPassword string `json:"newPassword"`
}

func claimParentAccount(w http.ResponseWriter, r *http.Request) {
	var req ClaimParentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if isOnline() {
		pgDB.Exec(`UPDATE users SET email=$1, password=$2, first_login=false WHERE id=$3 AND role='Parent'`, req.NewEmail, req.NewPassword, req.ParentID)
		var u User
		pgDB.QueryRow(`SELECT id,school_id,name,email,role,first_login FROM users WHERE id=$1`, req.ParentID).Scan(&u.ID, &u.SchoolID, &u.Name, &u.Email, &u.Role, &u.FirstLogin)
		jsonResp(w, u)
	} else {
		localDBMu.Lock()
		var updated User
		for i, u := range localDB.Users {
			if u.ID == req.ParentID && u.Role == "Parent" {
				localDB.Users[i].Email = req.NewEmail
				localDB.Users[i].Password = req.NewPassword
				localDB.Users[i].FirstLogin = false
				updated = localDB.Users[i]
				break
			}
		}
		saveLocalDB()
		localDBMu.Unlock()
		enqueue("UPDATE_USER", updated)
		jsonResp(w, updated)
	}
}

type LinkChildRequest struct {
	ParentID   string `json:"parentId"`
	ChildEmail string `json:"childEmail"`
	ChildPass  string `json:"childPass"`
}

func linkChildToParent(w http.ResponseWriter, r *http.Request) {
	var req LinkChildRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	var tempParentID string
	if isOnline() {
		pgDB.QueryRow(`SELECT id FROM users WHERE email=$1 AND password=$2 AND role='Parent' AND first_login=true`, req.ChildEmail, req.ChildPass).Scan(&tempParentID)
		if tempParentID == "" { http.Error(w, "Invalid credentials", http.StatusNotFound); return }
		pgDB.Exec(`UPDATE parent_student_links SET parent_id=$1 WHERE parent_id=$2`, req.ParentID, tempParentID)
		pgDB.Exec(`DELETE FROM users WHERE id=$1`, tempParentID)
	} else {
		localDBMu.Lock()
		for _, u := range localDB.Users {
			if u.Email == req.ChildEmail && u.Password == req.ChildPass && u.Role == "Parent" && u.FirstLogin { tempParentID = u.ID; break }
		}
		if tempParentID == "" { localDBMu.Unlock(); http.Error(w, "Invalid credentials", http.StatusNotFound); return }
		for i, l := range localDB.ParentLinks { if l.ParentID == tempParentID { localDB.ParentLinks[i].ParentID = req.ParentID } }
		nl := []User{}
		for _, u := range localDB.Users { if u.ID != tempParentID { nl = append(nl, u) } }
		localDB.Users = nl
		saveLocalDB()
		localDBMu.Unlock()
		enqueue("UPDATE_PARENT_LINK", map[string]string{"tempParentId": tempParentID, "realParentId": req.ParentID})
	}
	jsonResp(w, map[string]interface{}{"message": "Child linked successfully"})
}

func getParentChildren(w http.ResponseWriter, r *http.Request) {
	parentID := chi.URLParam(r, "id")
	type ChildData struct {
		ID         string `json:"ID"`
		Name       string `json:"name"`
		SchoolID   string `json:"schoolId"`
		SchoolName string `json:"schoolName"`
	}
	var children []ChildData

	if isOnline() {
		rows, err := pgDB.Query(`SELECT u.id, u.name, u.school_id, COALESCE(s.name,'') FROM parent_student_links l JOIN users u ON l.student_id=u.id LEFT JOIN schools s ON u.school_id=s.id WHERE l.parent_id=$1`, parentID)
		if err != nil || rows == nil {
			if err != nil {
				log.Printf("[ParentChildren] query failed: %v", err)
			}
			jsonResp(w, []ChildData{})
			return
		}
		defer rows.Close()
		for rows.Next() {
			var c ChildData
			if err := rows.Scan(&c.ID, &c.Name, &c.SchoolID, &c.SchoolName); err != nil {
				log.Printf("[ParentChildren] scan failed: %v", err)
				continue
			}
			children = append(children, c)
		}
	} else {
		localDBMu.RLock()
		defer localDBMu.RUnlock()
		for _, l := range localDB.ParentLinks {
			if l.ParentID == parentID {
				for _, u := range localDB.Users {
					if u.ID == l.StudentID {
						sName := ""
						for _, s := range localDB.Schools { if s.ID == u.SchoolID { sName = s.Name; break } }
						children = append(children, ChildData{u.ID, u.Name, u.SchoolID, sName})
					}
				}
			}
		}
	}
	jsonResp(w, children)
}

// =====================================================================
// MARKS HANDLERS (extended)
// =====================================================================

type UpsertMarkRequest struct {
	SchoolID   string  `json:"schoolId"`
	StudentID  string  `json:"studentId"`
	ClassID    string  `json:"classId"`
	SubjectID  string  `json:"subjectId"`
	SequenceID string  `json:"sequenceId"`
	Score      float64 `json:"score"`
	TeacherID  string  `json:"teacherId"`
}

func upsertMark(w http.ResponseWriter, r *http.Request) {
	var req UpsertMarkRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	id := uuid.New().String()
	now := time.Now().Format(time.RFC3339)
	m := Mark{ID: id, SchoolID: req.SchoolID, StudentID: req.StudentID, ClassID: req.ClassID,
		SubjectID: req.SubjectID, SequenceID: req.SequenceID, Score: req.Score, TeacherID: req.TeacherID, DateEntered: now}
	if isOnline() {
		_, err := pgDB.Exec(`INSERT INTO marks(id,school_id,student_id,class_id,subject_id,sequence_id,score,teacher_id,date_entered)
			VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
			ON CONFLICT(student_id,subject_id,sequence_id) DO UPDATE SET score=EXCLUDED.score,teacher_id=EXCLUDED.teacher_id,date_entered=EXCLUDED.date_entered`,
			m.ID, m.SchoolID, m.StudentID, m.ClassID, m.SubjectID, m.SequenceID, m.Score, m.TeacherID, m.DateEntered)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		localDBMu.Lock()
		found := false
		for i, mk := range localDB.Marks {
			if mk.StudentID == req.StudentID && mk.SubjectID == req.SubjectID && mk.SequenceID == req.SequenceID {
				localDB.Marks[i].Score = req.Score; localDB.Marks[i].TeacherID = req.TeacherID; localDB.Marks[i].DateEntered = now
				found = true; break
			}
		}
		if !found { localDB.Marks = append(localDB.Marks, m) }
		saveLocalDB()
		localDBMu.Unlock()
		enqueue("UPSERT_MARK", m)
	}
	jsonResp(w, m)
}

func listMarks(w http.ResponseWriter, r *http.Request) {
	schoolID := r.URL.Query().Get("schoolId")
	classID := r.URL.Query().Get("classId")
	sequenceID := r.URL.Query().Get("sequenceId")
	type MarkWithName struct {
		Mark
		StudentName string `json:"studentName"`
	}
	var list []MarkWithName
	if isOnline() {
		q := `SELECT m.id,m.school_id,m.student_id,m.class_id,m.subject_id,m.sequence_id,m.score,m.teacher_id,m.date_entered,COALESCE(u.name,'')
			FROM marks m LEFT JOIN users u ON m.student_id=u.id WHERE 1=1`
		args := []interface{}{}
		n := 1
		if schoolID != "" { q += fmt.Sprintf(" AND m.school_id=$%d", n); args = append(args, schoolID); n++ }
		if classID != "" { q += fmt.Sprintf(" AND m.class_id=$%d", n); args = append(args, classID); n++ }
		if sequenceID != "" { q += fmt.Sprintf(" AND m.sequence_id=$%d", n); args = append(args, sequenceID); n++ }
		rows, err := pgDB.Query(q, args...)
		if err != nil { jsonResp(w, []MarkWithName{}); return }
		defer rows.Close()
		for rows.Next() {
			var mn MarkWithName
			rows.Scan(&mn.ID, &mn.SchoolID, &mn.StudentID, &mn.ClassID, &mn.SubjectID, &mn.SequenceID, &mn.Score, &mn.TeacherID, &mn.DateEntered, &mn.StudentName)
			list = append(list, mn)
		}
	} else {
		localDBMu.RLock()
		defer localDBMu.RUnlock()
		nameMap := map[string]string{}
		for _, u := range localDB.Users { nameMap[u.ID] = u.Name }
		for _, m := range localDB.Marks {
			if schoolID != "" && m.SchoolID != schoolID { continue }
			if classID != "" && m.ClassID != classID { continue }
			if sequenceID != "" && m.SequenceID != sequenceID { continue }
			list = append(list, MarkWithName{m, nameMap[m.StudentID]})
		}
	}
	if list == nil { list = []MarkWithName{} }
	jsonResp(w, list)
}

func getStudentMarks(w http.ResponseWriter, r *http.Request) {
	studentID := chi.URLParam(r, "id")
	schoolID := r.URL.Query().Get("schoolId")
	type MarkFull struct {
		Mark
		ClassName    string `json:"className"`
		SequenceName string `json:"sequenceName"`
	}
	var list []MarkFull
	if isOnline() {
		q := `SELECT m.id,m.school_id,m.student_id,m.class_id,m.subject_id,m.sequence_id,m.score,m.teacher_id,m.date_entered,
			COALESCE(c.name,''),COALESCE(s.name,'')
			FROM marks m LEFT JOIN classes c ON m.class_id=c.id LEFT JOIN sequences s ON m.sequence_id=s.id
			WHERE m.student_id=$1`
		args := []interface{}{studentID}
		if schoolID != "" { q += " AND m.school_id=$2"; args = append(args, schoolID) }
		rows, err := pgDB.Query(q, args...)
		if err != nil { jsonResp(w, []MarkFull{}); return }
		defer rows.Close()
		for rows.Next() {
			var mf MarkFull
			rows.Scan(&mf.ID, &mf.SchoolID, &mf.StudentID, &mf.ClassID, &mf.SubjectID, &mf.SequenceID, &mf.Score, &mf.TeacherID, &mf.DateEntered, &mf.ClassName, &mf.SequenceName)
			list = append(list, mf)
		}
	} else {
		localDBMu.RLock()
		defer localDBMu.RUnlock()
		classMap := map[string]string{}; seqMap := map[string]string{}
		for _, c := range localDB.Classes { classMap[c.ID] = c.Name }
		for _, s := range localDB.Sequences { seqMap[s.ID] = s.Name }
		for _, m := range localDB.Marks {
			if m.StudentID != studentID { continue }
			if schoolID != "" && m.SchoolID != schoolID { continue }
			list = append(list, MarkFull{m, classMap[m.ClassID], seqMap[m.SequenceID]})
		}
	}
	if list == nil { list = []MarkFull{} }
	jsonResp(w, list)
}

// =====================================================================
// ENROLLMENT HANDLERS
// =====================================================================

type Enrollment struct {
	ID          string `json:"id"`
	SchoolID    string `json:"schoolId"`
	StudentID   string `json:"studentId"`
	StudentName string `json:"studentName"`
	ClassID     string `json:"classId"`
	ClassName   string `json:"className"`
}

func listEnrollments(w http.ResponseWriter, r *http.Request) {
	schoolID := r.URL.Query().Get("schoolId")
	classID := r.URL.Query().Get("classId")
	studentID := r.URL.Query().Get("studentId")
	var list []Enrollment
	if isOnline() {
		q := `SELECT e.id, e.school_id, e.student_id, COALESCE(u.name,''), e.class_id, COALESCE(c.name,'')
			FROM enrollments e LEFT JOIN users u ON e.student_id=u.id LEFT JOIN classes c ON e.class_id=c.id WHERE 1=1`
		args := []interface{}{}; n := 1
		if schoolID != "" { q += fmt.Sprintf(" AND e.school_id=$%d", n); args = append(args, schoolID); n++ }
		if classID != "" { q += fmt.Sprintf(" AND e.class_id=$%d", n); args = append(args, classID); n++ }
		if studentID != "" { q += fmt.Sprintf(" AND e.student_id=$%d", n); args = append(args, studentID); n++ }
		rows, err := pgDB.Query(q, args...)
		if err != nil { jsonResp(w, []Enrollment{}); return }
		defer rows.Close()
		for rows.Next() {
			var e Enrollment
			rows.Scan(&e.ID, &e.SchoolID, &e.StudentID, &e.StudentName, &e.ClassID, &e.ClassName)
			list = append(list, e)
		}
	}
	if list == nil { list = []Enrollment{} }
	jsonResp(w, list)
}

type EnrollRequest struct {
	SchoolID  string `json:"schoolId"`
	ClassID   string `json:"classId"`
	StudentID string `json:"studentId"`
}

func enrollStudent(w http.ResponseWriter, r *http.Request) {
	var req EnrollRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil { http.Error(w, err.Error(), http.StatusBadRequest); return }
	id := uuid.New().String()
	if isOnline() {
		_, err := pgDB.Exec(`INSERT INTO enrollments(id,school_id,student_id,class_id) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING`, id, req.SchoolID, req.StudentID, req.ClassID)
		if err != nil { http.Error(w, err.Error(), http.StatusInternalServerError); return }
	}
	jsonResp(w, map[string]string{"id": id, "message": "Enrolled"})
}

func unenrollStudent(w http.ResponseWriter, r *http.Request) {
	classID := r.URL.Query().Get("classId")
	studentID := r.URL.Query().Get("studentId")
	if isOnline() {
		pgDB.Exec(`DELETE FROM enrollments WHERE class_id=$1 AND student_id=$2`, classID, studentID)
	}
	jsonResp(w, map[string]string{"message": "Unenrolled"})
}

// =====================================================================
// ANNOUNCEMENT HANDLERS
// =====================================================================

type Announcement struct {
	ID          string `json:"id"`
	SchoolID    string `json:"schoolId"`
	ClassID     string `json:"classId"`
	ClassName   string `json:"className"`
	TeacherID   string `json:"teacherId"`
	TeacherName string `json:"teacherName"`
	Message     string `json:"message"`
	CreatedAt   string `json:"createdAt"`
}

func listAnnouncements(w http.ResponseWriter, r *http.Request) {
	schoolID := r.URL.Query().Get("schoolId")
	classID := r.URL.Query().Get("classId")
	studentID := r.URL.Query().Get("studentId")
	var list []Announcement
	if isOnline() {
		var q string
		var args []interface{}
		if studentID != "" {
			q = `SELECT a.id,a.school_id,a.class_id,COALESCE(c.name,''),a.teacher_id,COALESCE(u.name,''),a.message,a.created_at
				FROM announcements a
				LEFT JOIN classes c ON a.class_id=c.id
				LEFT JOIN users u ON a.teacher_id=u.id
				WHERE a.school_id=$1 AND a.class_id IN (SELECT class_id FROM enrollments WHERE student_id=$2)
				ORDER BY a.created_at DESC`
			args = []interface{}{schoolID, studentID}
		} else if classID != "" {
			q = `SELECT a.id,a.school_id,a.class_id,COALESCE(c.name,''),a.teacher_id,COALESCE(u.name,''),a.message,a.created_at
				FROM announcements a LEFT JOIN classes c ON a.class_id=c.id LEFT JOIN users u ON a.teacher_id=u.id
				WHERE a.class_id=$1 ORDER BY a.created_at DESC`
			args = []interface{}{classID}
		} else {
			q = `SELECT a.id,a.school_id,a.class_id,COALESCE(c.name,''),a.teacher_id,COALESCE(u.name,''),a.message,a.created_at
				FROM announcements a LEFT JOIN classes c ON a.class_id=c.id LEFT JOIN users u ON a.teacher_id=u.id
				WHERE a.school_id=$1 ORDER BY a.created_at DESC`
			args = []interface{}{schoolID}
		}
		rows, err := pgDB.Query(q, args...)
		if err != nil { jsonResp(w, []Announcement{}); return }
		defer rows.Close()
		for rows.Next() {
			var a Announcement
			rows.Scan(&a.ID, &a.SchoolID, &a.ClassID, &a.ClassName, &a.TeacherID, &a.TeacherName, &a.Message, &a.CreatedAt)
			list = append(list, a)
		}
	}
	if list == nil { list = []Announcement{} }
	jsonResp(w, list)
}

type CreateAnnouncementRequest struct {
	SchoolID    string `json:"schoolId"`
	ClassID     string `json:"classId"`
	TeacherID   string `json:"teacherId"`
	TeacherName string `json:"teacherName"`
	Message     string `json:"message"`
}

func createAnnouncement(w http.ResponseWriter, r *http.Request) {
	var req CreateAnnouncementRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil { http.Error(w, err.Error(), http.StatusBadRequest); return }
	id := uuid.New().String()
	now := time.Now().Format(time.RFC3339)
	if isOnline() {
		_, err := pgDB.Exec(`INSERT INTO announcements(id,school_id,class_id,teacher_id,teacher_name,message,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)`,
			id, req.SchoolID, req.ClassID, req.TeacherID, req.TeacherName, req.Message, now)
		if err != nil { http.Error(w, err.Error(), http.StatusInternalServerError); return }
	}
	jsonResp(w, Announcement{ID: id, SchoolID: req.SchoolID, ClassID: req.ClassID, TeacherID: req.TeacherID, TeacherName: req.TeacherName, Message: req.Message, CreatedAt: now})
}

func deleteAnnouncement(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if isOnline() { pgDB.Exec(`DELETE FROM announcements WHERE id=$1`, id) }
	jsonResp(w, map[string]string{"message": "Deleted"})
}

// =====================================================================
// ASSIGNMENT HANDLERS
// =====================================================================

type Assignment struct {
	ID              string  `json:"id"`
	SchoolID        string  `json:"schoolId"`
	ClassID         string  `json:"classId"`
	ClassName       string  `json:"className"`
	TeacherID       string  `json:"teacherId"`
	TeacherName     string  `json:"teacherName"`
	Title           string  `json:"title"`
	Description     string  `json:"description"`
	DueDate         string  `json:"dueDate"`
	MaxPoints       float64 `json:"maxPoints"`
	CreatedAt       string  `json:"createdAt"`
	FileURL         string  `json:"fileUrl"`
	ViewURL         string  `json:"viewUrl"`
	FileName        string  `json:"fileName"`
	FileSize        int64   `json:"fileSize"`
	FileType        string  `json:"fileType"`
	SubmissionCount int     `json:"submissionCount"`
}

type AssignmentSubmission struct {
	ID           string   `json:"id"`
	AssignmentID string   `json:"assignmentId"`
	SchoolID     string   `json:"schoolId"`
	ClassID      string   `json:"classId"`
	StudentID    string   `json:"studentId"`
	StudentName  string   `json:"studentName"`
	Content      string   `json:"content"`
	FileURL      string   `json:"fileUrl"`
	FileName     string   `json:"fileName"`
	FileSize     int64    `json:"fileSize"`
	FileType     string   `json:"fileType"`
	SubmittedAt  string   `json:"submittedAt"`
	Grade        *float64 `json:"grade"`
	Feedback     string   `json:"feedback"`
	Status       string   `json:"status"` // "submitted", "graded"
}

func listAssignments(w http.ResponseWriter, r *http.Request) {
	schoolID := r.URL.Query().Get("schoolId")
	classID := r.URL.Query().Get("classId")
	studentID := r.URL.Query().Get("studentId")
	var list []Assignment
	if isOnline() {
		var q string
		var args []interface{}
		if studentID != "" {
			q = `SELECT a.id, a.school_id, a.class_id, COALESCE(c.name,''), a.teacher_id, COALESCE(u.name, a.teacher_name, ''), a.title, COALESCE(a.description,''), COALESCE(a.due_date::text,''), COALESCE(a.max_points, 20.0), COALESCE(a.created_at::text,''),
				COALESCE(a.file_url, ''), COALESCE(a.file_name, ''), COALESCE(a.file_size, 0), COALESCE(a.file_type, ''),
				(SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id=a.id)
				FROM assignments a LEFT JOIN classes c ON a.class_id=c.id LEFT JOIN users u ON a.teacher_id=u.id
				WHERE (a.school_id=$1 OR $1='') AND (a.class_id IN (SELECT class_id FROM enrollments WHERE student_id=$2) OR a.class_id IN (SELECT id FROM classes WHERE school_id=$1))
				ORDER BY a.due_date ASC`
			args = []interface{}{schoolID, studentID}
		} else if classID != "" {
			q = `SELECT a.id, a.school_id, a.class_id, COALESCE(c.name,''), a.teacher_id, COALESCE(u.name, a.teacher_name, ''), a.title, COALESCE(a.description,''), COALESCE(a.due_date::text,''), COALESCE(a.max_points, 20.0), COALESCE(a.created_at::text,''),
				COALESCE(a.file_url, ''), COALESCE(a.file_name, ''), COALESCE(a.file_size, 0), COALESCE(a.file_type, ''),
				(SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id=a.id)
				FROM assignments a LEFT JOIN classes c ON a.class_id=c.id LEFT JOIN users u ON a.teacher_id=u.id
				WHERE a.class_id=$1 ORDER BY a.due_date ASC`
			args = []interface{}{classID}
		} else {
			q = `SELECT a.id, a.school_id, a.class_id, COALESCE(c.name,''), a.teacher_id, COALESCE(u.name, a.teacher_name, ''), a.title, COALESCE(a.description,''), COALESCE(a.due_date::text,''), COALESCE(a.max_points, 20.0), COALESCE(a.created_at::text,''),
				COALESCE(a.file_url, ''), COALESCE(a.file_name, ''), COALESCE(a.file_size, 0), COALESCE(a.file_type, ''),
				(SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id=a.id)
				FROM assignments a LEFT JOIN classes c ON a.class_id=c.id LEFT JOIN users u ON a.teacher_id=u.id
				WHERE (a.school_id=$1 OR $1='') ORDER BY a.due_date ASC`
			args = []interface{}{schoolID}
		}
		rows, err := pgDB.Query(q, args...)
		if err != nil {
			log.Printf("[Assignments] List error: %v", err)
			jsonResp(w, []Assignment{})
			return
		}
		defer rows.Close()
		for rows.Next() {
			var a Assignment
			rows.Scan(&a.ID, &a.SchoolID, &a.ClassID, &a.ClassName, &a.TeacherID, &a.TeacherName, &a.Title, &a.Description, &a.DueDate, &a.MaxPoints, &a.CreatedAt, &a.FileURL, &a.FileName, &a.FileSize, &a.FileType, &a.SubmissionCount)
			// Derive viewUrl from fileUrl: extract UUID from "/uploads/{uuid}_{filename}"
			if a.FileURL != "" {
				base := strings.TrimPrefix(a.FileURL, "/uploads/")
				if idx := strings.Index(base, "_"); idx > 0 {
					a.ViewURL = "/api/files/" + base[:idx]
				} else {
					a.ViewURL = a.FileURL
				}
			}
			list = append(list, a)
		}
	}
	if list == nil {
		list = []Assignment{}
	}
	jsonResp(w, list)
}

type CreateAssignmentRequest struct {
	SchoolID    string  `json:"schoolId"`
	ClassID     string  `json:"classId"`
	TeacherID   string  `json:"teacherId"`
	TeacherName string  `json:"teacherName"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	DueDate     string  `json:"dueDate"`
	MaxPoints   float64 `json:"maxPoints"`
	FileURL     string  `json:"fileUrl"`
	FileName    string  `json:"fileName"`
	FileSize    int64   `json:"fileSize"`
	FileType    string  `json:"fileType"`
}

func createAssignment(w http.ResponseWriter, r *http.Request) {
	var req CreateAssignmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if req.MaxPoints <= 0 {
		req.MaxPoints = 20.0
	}
	id := uuid.New().String()
	now := time.Now().Format(time.RFC3339)
	if isOnline() {
		_, err := pgDB.Exec(`INSERT INTO assignments(id,school_id,class_id,teacher_id,teacher_name,title,description,due_date,max_points,created_at,file_url,file_name,file_size,file_type) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
			id, req.SchoolID, req.ClassID, req.TeacherID, req.TeacherName, req.Title, req.Description, req.DueDate, req.MaxPoints, now, req.FileURL, req.FileName, req.FileSize, req.FileType)
		if err != nil {
			log.Printf("[Assignments] Create error: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	jsonResp(w, Assignment{
		ID:          id,
		SchoolID:    req.SchoolID,
		ClassID:     req.ClassID,
		TeacherID:   req.TeacherID,
		TeacherName: req.TeacherName,
		Title:       req.Title,
		Description: req.Description,
		DueDate:     req.DueDate,
		MaxPoints:   req.MaxPoints,
		CreatedAt:   now,
		FileURL:     req.FileURL,
		FileName:    req.FileName,
		FileSize:    req.FileSize,
		FileType:    req.FileType,
	})
}

func deleteAssignment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if isOnline() {
		pgDB.Exec(`DELETE FROM assignment_submissions WHERE assignment_id=$1`, id)
		pgDB.Exec(`DELETE FROM assignments WHERE id=$1`, id)
	}
	jsonResp(w, map[string]string{"message": "Deleted"})
}

type SubmitAssignmentRequest struct {
	AssignmentID string `json:"assignmentId"`
	SchoolID     string `json:"schoolId"`
	ClassID      string `json:"classId"`
	StudentID    string `json:"studentId"`
	StudentName  string `json:"studentName"`
	Content      string `json:"content"`
	FileURL      string `json:"fileUrl"`
	FileName     string `json:"fileName"`
	FileSize     int64  `json:"fileSize"`
	FileType     string `json:"fileType"`
}

func submitAssignment(w http.ResponseWriter, r *http.Request) {
	var req SubmitAssignmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	id := uuid.New().String()
	now := time.Now().Format(time.RFC3339)
	if isOnline() {
		_, err := pgDB.Exec(`INSERT INTO assignment_submissions(id, assignment_id, school_id, class_id, student_id, student_name, content, file_url, file_name, file_size, file_type, submitted_at, status)
			VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'submitted')
			ON CONFLICT (assignment_id, student_id) DO UPDATE SET
			content=EXCLUDED.content, file_url=EXCLUDED.file_url, file_name=EXCLUDED.file_name, file_size=EXCLUDED.file_size, file_type=EXCLUDED.file_type, submitted_at=EXCLUDED.submitted_at, status='submitted'`,
			id, req.AssignmentID, req.SchoolID, req.ClassID, req.StudentID, req.StudentName, req.Content, req.FileURL, req.FileName, req.FileSize, req.FileType, now)
		if err != nil {
			log.Printf("[Assignments] Submit error: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	jsonResp(w, map[string]interface{}{"success": true, "message": "Assignment submitted successfully", "submittedAt": now})
}

func listAssignmentSubmissions(w http.ResponseWriter, r *http.Request) {
	assignmentID := chi.URLParam(r, "id")
	var list []AssignmentSubmission
	if isOnline() {
		rows, err := pgDB.Query(`SELECT id, assignment_id, school_id, COALESCE(class_id,''), student_id, COALESCE(student_name,''), COALESCE(content,''), COALESCE(file_url,''), COALESCE(file_name,''), COALESCE(file_size,0), COALESCE(file_type,''), COALESCE(submitted_at::text,''), grade, COALESCE(feedback,''), COALESCE(status,'submitted')
			FROM assignment_submissions WHERE assignment_id=$1 ORDER BY submitted_at DESC`, assignmentID)
		if err == nil && rows != nil {
			defer rows.Close()
			for rows.Next() {
				var s AssignmentSubmission
				var g sql.NullFloat64
				rows.Scan(&s.ID, &s.AssignmentID, &s.SchoolID, &s.ClassID, &s.StudentID, &s.StudentName, &s.Content, &s.FileURL, &s.FileName, &s.FileSize, &s.FileType, &s.SubmittedAt, &g, &s.Feedback, &s.Status)
				if g.Valid {
					v := g.Float64
					s.Grade = &v
				}
				list = append(list, s)
			}
		}
	}
	if list == nil {
		list = []AssignmentSubmission{}
	}
	jsonResp(w, list)
}

func listStudentSubmissions(w http.ResponseWriter, r *http.Request) {
	studentID := r.URL.Query().Get("studentId")
	assignmentID := r.URL.Query().Get("assignmentId")
	var list []AssignmentSubmission
	if isOnline() {
		q := `SELECT id, assignment_id, school_id, COALESCE(class_id,''), student_id, COALESCE(student_name,''), COALESCE(content,''), COALESCE(file_url,''), COALESCE(file_name,''), COALESCE(file_size,0), COALESCE(file_type,''), COALESCE(submitted_at::text,''), grade, COALESCE(feedback,''), COALESCE(status,'submitted')
			FROM assignment_submissions WHERE 1=1`
		args := []interface{}{}
		n := 1
		if studentID != "" {
			q += fmt.Sprintf(" AND student_id=$%d", n)
			args = append(args, studentID)
			n++
		}
		if assignmentID != "" {
			q += fmt.Sprintf(" AND assignment_id=$%d", n)
			args = append(args, assignmentID)
			n++
		}
		rows, err := pgDB.Query(q, args...)
		if err == nil && rows != nil {
			defer rows.Close()
			for rows.Next() {
				var s AssignmentSubmission
				var g sql.NullFloat64
				rows.Scan(&s.ID, &s.AssignmentID, &s.SchoolID, &s.ClassID, &s.StudentID, &s.StudentName, &s.Content, &s.FileURL, &s.FileName, &s.FileSize, &s.FileType, &s.SubmittedAt, &g, &s.Feedback, &s.Status)
				if g.Valid {
					v := g.Float64
					s.Grade = &v
				}
				list = append(list, s)
			}
		}
	}
	if list == nil {
		list = []AssignmentSubmission{}
	}
	jsonResp(w, list)
}

type GradeSubmissionRequest struct {
	Grade    float64 `json:"grade"`
	Feedback string  `json:"feedback"`
}

func gradeAssignmentSubmission(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req GradeSubmissionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if isOnline() {
		_, err := pgDB.Exec(`UPDATE assignment_submissions SET grade=$1, feedback=$2, status='graded' WHERE id=$3`, req.Grade, req.Feedback, id)
		if err != nil {
			log.Printf("[Assignments] Grade error: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	jsonResp(w, map[string]interface{}{"success": true, "message": "Assignment graded successfully", "grade": req.Grade, "feedback": req.Feedback})
}

// =====================================================================
// SECURE FILE & ASSET STORAGE (Isolated Storage + Streaming + Anti-Exploit)
// =====================================================================

const IsolatedStorageDir = "./storage/assets"

var dangerousExtensions = map[string]bool{
	".exe": true, ".dll": true, ".so": true, ".dylib": true,
	".sh": true, ".bash": true, ".bat": true, ".cmd": true, ".ps1": true, ".vbs": true,
	".php": true, ".phtml": true, ".py": true, ".rb": true, ".pl": true, ".cgi": true,
	".jar": true, ".war": true, ".jsp": true, ".asp": true, ".aspx": true,
	".htm": true, ".html": true, ".xhtml": true, ".shtml": true,
	".js": true, ".mjs": true, ".ts": true, ".svg": true,
	".scr": true, ".com": true, ".msi": true,
}

func sanitizeFilename(name string) string {
	clean := filepath.Base(filepath.Clean(name))
	var sb strings.Builder
	for _, r := range clean {
		if r >= 32 && r != 127 && r != '\\' && r != '/' && r != ':' && r != '*' && r != '?' && r != '"' && r != '<' && r != '>' && r != '|' {
			sb.WriteRune(r)
		}
	}
	res := strings.TrimSpace(sb.String())
	if res == "" {
		return "document"
	}
	return res
}

func isDangerousFile(ext string) bool {
	return dangerousExtensions[strings.ToLower(ext)]
}

func isSafePreviewable(ext string, mimeType string) bool {
	ext = strings.ToLower(ext)
	safeExts := map[string]bool{
		".pdf": true, ".png": true, ".jpg": true, ".jpeg": true,
		".webp": true, ".gif": true, ".bmp": true,
		".txt": true, ".csv": true, ".md": true, ".json": true,
	}
	if safeExts[ext] {
		return true
	}
	safeMimes := map[string]bool{
		"application/pdf": true, "image/png": true, "image/jpeg": true,
		"image/webp": true, "image/gif": true, "image/bmp": true,
		"text/plain": true, "text/csv": true, "text/markdown": true, "application/json": true,
	}
	return safeMimes[mimeType]
}

func setSecurityHeaders(w http.ResponseWriter) {
	// General security headers for file endpoints
	w.Header().Set("X-Content-Type-Options", "nosniff")
	// Modern frame permission is controlled by CSP frame-ancestors
	w.Header().Set("Content-Security-Policy", "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:; frame-ancestors *;")
	w.Header().Set("Cross-Origin-Resource-Policy", "cross-origin")
	w.Header().Set("Cross-Origin-Embedder-Policy", "unsafe-none")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "*")
}

func uploadFileHandler(w http.ResponseWriter, r *http.Request) {
	// Support large files up to 250MB
	r.Body = http.MaxBytesReader(w, r.Body, 250<<20)
	if err := r.ParseMultipartForm(16 << 20); err != nil {
		http.Error(w, "File upload failed or exceeds 250MB: "+err.Error(), http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "No file provided: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	bucket := r.FormValue("bucket")
	if bucket == "" {
		bucket = "assets"
	}

	fileId := uuid.New().String()
	originalFilename := sanitizeFilename(handler.Filename)
	ext := strings.ToLower(filepath.Ext(originalFilename))

	// Detect / sanitize MIME type
	mimeType := handler.Header.Get("Content-Type")
	if mimeType == "" || mimeType == "application/octet-stream" {
		guessed := mime.TypeByExtension(ext)
		if guessed != "" {
			mimeType = guessed
		} else {
			mimeType = "application/octet-stream"
		}
	}

	// Security check: if file has dangerous extension, enforce application/octet-stream
	if isDangerousFile(ext) {
		mimeType = "application/octet-stream"
	}

	// Ensure isolated storage directory exists
	_ = os.MkdirAll(IsolatedStorageDir, 0700)
	isolatedPath := filepath.Join(IsolatedStorageDir, fmt.Sprintf("%s.dat", fileId))

	dstFile, err := os.OpenFile(isolatedPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0600)
	if err != nil {
		http.Error(w, "Failed to initialize isolated storage: "+err.Error(), http.StatusInternalServerError)
		return
	}

	hasher := sha256.New()
	multiWriter := io.MultiWriter(dstFile, hasher)

	writtenBytes, err := io.Copy(multiWriter, file)
	dstFile.Close()
	if err != nil {
		_ = os.Remove(isolatedPath)
		http.Error(w, "Failed to write file stream: "+err.Error(), http.StatusInternalServerError)
		return
	}

	hashStr := hex.EncodeToString(hasher.Sum(nil))

	// Also write to ./uploads directory for legacy cache compatibility
	uploadDir := "./uploads"
	_ = os.MkdirAll(uploadDir, 0755)
	storedLegacyName := fmt.Sprintf("%s_%s", fileId, originalFilename)
	legacyPath := filepath.Join(uploadDir, storedLegacyName)

	// Copy isolated data to legacy path
	if srcF, err := os.Open(isolatedPath); err == nil {
		if legF, err := os.Create(legacyPath); err == nil {
			_, _ = io.Copy(legF, srcF)
			legF.Close()
		}
		srcF.Close()
	}

	s3Key := fmt.Sprintf("uploads/%s", storedLegacyName)

	// Save to DB file_assets bucket metadata
	if isOnline() {
		_, err := pgDB.Exec(`INSERT INTO file_assets(id, bucket, key, filename, mime_type, size_bytes, storage_path, sha256_hash)
			VALUES($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT (key) DO UPDATE SET filename=EXCLUDED.filename, size_bytes=EXCLUDED.size_bytes, storage_path=EXCLUDED.storage_path, sha256_hash=EXCLUDED.sha256_hash`,
			fileId, bucket, s3Key, originalFilename, mimeType, writtenBytes, isolatedPath, hashStr)
		if err != nil {
			log.Printf("[Storage] DB asset store metadata error: %v", err)
		}
	}

	fileURL := "/uploads/" + storedLegacyName
	downloadURL := fmt.Sprintf("/api/files/download/%s", fileId)
	viewURL := fmt.Sprintf("/api/files/%s", fileId)

	jsonResp(w, map[string]interface{}{
		"success":     true,
		"id":          fileId,
		"bucket":      bucket,
		"key":         s3Key,
		"url":         fileURL,
		"downloadUrl": downloadURL,
		"viewUrl":     viewURL,
		"fileName":    originalFilename,
		"size":        writtenBytes,
		"type":        mimeType,
		"hash":        hashStr,
	})
}

func getFileHandler(w http.ResponseWriter, r *http.Request) {
	setSecurityHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	id := sanitizeFilename(chi.URLParam(r, "id"))
	var filename, mimeType, storagePath string
	var sizeBytes int64

	if isOnline() {
		_ = pgDB.QueryRow(`SELECT filename, mime_type, size_bytes, COALESCE(storage_path,'') 
			FROM file_assets WHERE id=$1 OR key=$1 OR key LIKE '%' || $1 OR filename=$1`, id).Scan(&filename, &mimeType, &sizeBytes, &storagePath)
	}

	if filename == "" {
		filename = id
	}

	ext := strings.ToLower(filepath.Ext(filename))

	// Check isolated storage path first
	candidatePaths := []string{}
	if storagePath != "" {
		candidatePaths = append(candidatePaths, storagePath)
	}
	candidatePaths = append(candidatePaths,
		filepath.Join(IsolatedStorageDir, fmt.Sprintf("%s.dat", id)),
		filepath.Join("./uploads", id),
	)

	// If id is uuid_filename, extract uuid
	if strings.Contains(id, "_") {
		parts := strings.SplitN(id, "_", 2)
		candidatePaths = append(candidatePaths, filepath.Join(IsolatedStorageDir, fmt.Sprintf("%s.dat", parts[0])))
	}

	// Match any files in uploads that start with id + "_"
	if matches, err := filepath.Glob(filepath.Join("./uploads", id+"_*")); err == nil {
		candidatePaths = append(candidatePaths, matches...)
	}
	if matches, err := filepath.Glob(filepath.Join(IsolatedStorageDir, id+"*")); err == nil {
		candidatePaths = append(candidatePaths, matches...)
	}

	var targetFile *os.File
	var fileInfo os.FileInfo
	for _, p := range candidatePaths {
		if fi, err := os.Stat(p); err == nil && !fi.IsDir() {
			if f, err := os.Open(p); err == nil {
				targetFile = f
				fileInfo = fi
				if filename == id {
					filename = filepath.Base(p)
					if strings.Contains(filename, "_") {
						filename = strings.SplitN(filename, "_", 2)[1]
					}
				}
				break
			}
		}
	}

	if targetFile == nil {
		http.Error(w, "File not found or inaccessible", http.StatusNotFound)
		return
	}
	defer targetFile.Close()

	if isDangerousFile(ext) {
		// Never allow inline execution of dangerous files
		w.Header().Set("Content-Type", "application/octet-stream")
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	} else if isSafePreviewable(ext, mimeType) {
		if mimeType == "" {
			mimeType = mime.TypeByExtension(ext)
			if mimeType == "" {
				mimeType = "application/pdf"
			}
		}
		w.Header().Set("Content-Type", mimeType)
		w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=%q", filename))
	} else {
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}
		w.Header().Set("Content-Type", mimeType)
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	}

	w.Header().Set("Cache-Control", "public, max-age=86400")
	http.ServeContent(w, r, filename, fileInfo.ModTime(), targetFile)
}

func downloadFileHandler(w http.ResponseWriter, r *http.Request) {
	setSecurityHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	id := sanitizeFilename(chi.URLParam(r, "id"))
	var filename string
	var storagePath string

	if isOnline() {
		_ = pgDB.QueryRow(`SELECT filename, COALESCE(storage_path,'') 
			FROM file_assets WHERE id=$1 OR key=$1 OR key LIKE '%' || $1 OR filename=$1`, id).Scan(&filename, &storagePath)
	}

	if filename == "" {
		filename = id
	}

	candidatePaths := []string{}
	if storagePath != "" {
		candidatePaths = append(candidatePaths, storagePath)
	}
	candidatePaths = append(candidatePaths,
		filepath.Join(IsolatedStorageDir, fmt.Sprintf("%s.dat", id)),
		filepath.Join("./uploads", id),
	)
	if strings.Contains(id, "_") {
		parts := strings.SplitN(id, "_", 2)
		candidatePaths = append(candidatePaths, filepath.Join(IsolatedStorageDir, fmt.Sprintf("%s.dat", parts[0])))
	}
	if matches, err := filepath.Glob(filepath.Join("./uploads", id+"_*")); err == nil {
		candidatePaths = append(candidatePaths, matches...)
	}
	if matches, err := filepath.Glob(filepath.Join(IsolatedStorageDir, id+"*")); err == nil {
		candidatePaths = append(candidatePaths, matches...)
	}

	var targetFile *os.File
	var fileInfo os.FileInfo
	for _, p := range candidatePaths {
		if fi, err := os.Stat(p); err == nil && !fi.IsDir() {
			if f, err := os.Open(p); err == nil {
				targetFile = f
				fileInfo = fi
				if filename == id {
					filename = filepath.Base(p)
					if strings.Contains(filename, "_") {
						filename = strings.SplitN(filename, "_", 2)[1]
					}
				}
				break
			}
		}
	}

	if targetFile == nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}
	defer targetFile.Close()

	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	http.ServeContent(w, r, filename, fileInfo.ModTime(), targetFile)
}

// =====================================================================
// MESSAGE HANDLERS
// =====================================================================

type Message struct {
	ID            string `json:"id"`
	SchoolID      string `json:"schoolId"`
	SenderID      string `json:"senderId"`
	SenderName    string `json:"senderName"`
	SenderRole    string `json:"senderRole"`
	RecipientID   string `json:"recipientId"`
	RecipientName string `json:"recipientName"`
	Subject       string `json:"subject"`
	Body          string `json:"body"`
	IsRead        bool   `json:"isRead"`
	CreatedAt     string `json:"createdAt"`
}

func listMessages(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	box := r.URL.Query().Get("box") // "inbox" or "sent"
	var list []Message
	if isOnline() {
		var q string; var args []interface{}
		if box == "sent" {
			q = `SELECT m.id,COALESCE(m.school_id,''),m.sender_id,COALESCE(NULLIF(m.sender_name,''),su.name,''),COALESCE(NULLIF(m.sender_role,''),su.role,''),m.recipient_id,COALESCE(ru.name,''),COALESCE(m.subject,''),COALESCE(m.body,''),COALESCE(m.is_read,false),COALESCE(CAST(m.created_at AS TEXT),'')
				FROM messages m LEFT JOIN users su ON m.sender_id=su.id LEFT JOIN users ru ON m.recipient_id=ru.id
				WHERE m.sender_id=$1 ORDER BY m.created_at DESC`
			args = []interface{}{userID}
		} else {
			q = `SELECT m.id,COALESCE(m.school_id,''),m.sender_id,COALESCE(NULLIF(m.sender_name,''),su.name,''),COALESCE(NULLIF(m.sender_role,''),su.role,''),m.recipient_id,COALESCE(ru.name,''),COALESCE(m.subject,''),COALESCE(m.body,''),COALESCE(m.is_read,false),COALESCE(CAST(m.created_at AS TEXT),'')
				FROM messages m LEFT JOIN users su ON m.sender_id=su.id LEFT JOIN users ru ON m.recipient_id=ru.id
				WHERE m.recipient_id=$1 ORDER BY m.created_at DESC`
			args = []interface{}{userID}
		}
		rows, err := pgDB.Query(q, args...)
		if err != nil {
			log.Printf("[MESSAGES] listMessages query error: %v", err)
			jsonResp(w, []Message{})
			return
		}
		defer rows.Close()
		for rows.Next() {
			var msg Message
			if err := rows.Scan(&msg.ID, &msg.SchoolID, &msg.SenderID, &msg.SenderName, &msg.SenderRole, &msg.RecipientID, &msg.RecipientName, &msg.Subject, &msg.Body, &msg.IsRead, &msg.CreatedAt); err == nil {
				list = append(list, msg)
			} else {
				log.Printf("[MESSAGES] scan error: %v", err)
			}
		}
	}
	if list == nil { list = []Message{} }
	jsonResp(w, list)
}

type SendMessageRequest struct {
	SchoolID    string `json:"schoolId"`
	SenderID    string `json:"senderId"`
	SenderName  string `json:"senderName"`
	SenderRole  string `json:"senderRole"`
	RecipientID string `json:"recipientId"`
	Subject     string `json:"subject"`
	Body        string `json:"body"`
}

func sendMessage(w http.ResponseWriter, r *http.Request) {
	var req SendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil { http.Error(w, err.Error(), http.StatusBadRequest); return }
	id := uuid.New().String()
	now := time.Now().Format(time.RFC3339)
	if isOnline() {
		_, err := pgDB.Exec(`INSERT INTO messages(id,school_id,sender_id,sender_name,sender_role,recipient_id,subject,body,is_read,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,false,$9)`,
			id, req.SchoolID, req.SenderID, req.SenderName, req.SenderRole, req.RecipientID, req.Subject, req.Body, now)
		if err != nil {
			log.Printf("[MESSAGES] sendMessage error: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	jsonResp(w, map[string]string{"id": id, "message": "Sent"})
}

func markMessageRead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if isOnline() { pgDB.Exec(`UPDATE messages SET is_read=true WHERE id=$1`, id) }
	jsonResp(w, map[string]string{"message": "Marked read"})
}

// =====================================================================
// ATTENDANCE HANDLERS
// =====================================================================

type AttendanceRecord struct {
	ID        string `json:"id"`
	SchoolID  string `json:"schoolId"`
	ClassID   string `json:"classId"`
	StudentID string `json:"studentId"`
	Date      string `json:"date"`
	Status    string `json:"status"`
	TeacherID string `json:"teacherId"`
}

func listAttendance(w http.ResponseWriter, r *http.Request) {
	schoolID := r.URL.Query().Get("schoolId")
	classID := r.URL.Query().Get("classId")
	studentID := r.URL.Query().Get("studentId")
	date := r.URL.Query().Get("date")
	var list []AttendanceRecord
	if isOnline() {
		q := `SELECT id,school_id,COALESCE(class_id,''),student_id,date::text,status,COALESCE(teacher_id,'') FROM attendance WHERE 1=1`
		args := []interface{}{}; n := 1
		if schoolID != "" { q += fmt.Sprintf(" AND school_id=$%d", n); args = append(args, schoolID); n++ }
		if classID != "" { q += fmt.Sprintf(" AND class_id=$%d", n); args = append(args, classID); n++ }
		if studentID != "" { q += fmt.Sprintf(" AND student_id=$%d", n); args = append(args, studentID); n++ }
		if date != "" { q += fmt.Sprintf(" AND date=$%d", n); args = append(args, date); n++ }
		q += " ORDER BY date DESC"
		rows, err := pgDB.Query(q, args...)
		if err != nil {
			log.Printf("[Attendance] Query error: %v", err)
			jsonResp(w, []AttendanceRecord{})
			return
		}
		defer rows.Close()
		for rows.Next() {
			var a AttendanceRecord
			rows.Scan(&a.ID, &a.SchoolID, &a.ClassID, &a.StudentID, &a.Date, &a.Status, &a.TeacherID)
			list = append(list, a)
		}
	}
	if list == nil { list = []AttendanceRecord{} }
	jsonResp(w, list)
}

type SaveAttendanceRequest struct {
	SchoolID  string            `json:"schoolId"`
	ClassID   string            `json:"classId"`
	TeacherID string            `json:"teacherId"`
	Date      string            `json:"date"`
	Records   map[string]string `json:"records"` // studentId -> status
}

func saveAttendance(w http.ResponseWriter, r *http.Request) {
	var req SaveAttendanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if req.Date == "" { req.Date = time.Now().Format("2006-01-02") }
	savedCount := 0
	if isOnline() {
		for studentID, status := range req.Records {
			id := uuid.New().String()
			_, err := pgDB.Exec(`INSERT INTO attendance(id,school_id,class_id,student_id,date,status,teacher_id)
				VALUES($1,$2,$3,$4,$5,$6,$7)
				ON CONFLICT (class_id,student_id,date) DO UPDATE SET status=EXCLUDED.status, teacher_id=EXCLUDED.teacher_id`,
				id, req.SchoolID, req.ClassID, studentID, req.Date, status, req.TeacherID)
			if err != nil {
				// Fallback update or insert
				res, _ := pgDB.Exec(`UPDATE attendance SET status=$1, teacher_id=$2 WHERE class_id=$3 AND student_id=$4 AND date=$5`,
					status, req.TeacherID, req.ClassID, studentID, req.Date)
				if rowsAffected, _ := res.RowsAffected(); rowsAffected == 0 {
					pgDB.Exec(`INSERT INTO attendance(id,school_id,class_id,student_id,date,status,teacher_id) VALUES($1,$2,$3,$4,$5,$6,$7)`,
						id, req.SchoolID, req.ClassID, studentID, req.Date, status, req.TeacherID)
				}
			}
			savedCount++
		}
	}
	jsonResp(w, map[string]interface{}{"success": true, "message": fmt.Sprintf("Attendance recorded for %d students", savedCount), "date": req.Date, "count": savedCount})
}

// =====================================================================
// DASHBOARD STATS HANDLERS
// =====================================================================

func adminDashboardStats(w http.ResponseWriter, r *http.Request) {
	schoolID := chi.URLParam(r, "schoolId")
	stats := map[string]interface{}{}
	if isOnline() {
		var tc, sc, cc, mc int
		pgDB.QueryRow(`SELECT COUNT(*) FROM users WHERE school_id=$1 AND LOWER(role)='teacher'`, schoolID).Scan(&tc)
		pgDB.QueryRow(`SELECT COUNT(*) FROM users WHERE school_id=$1 AND LOWER(role)='student'`, schoolID).Scan(&sc)
		pgDB.QueryRow(`SELECT COUNT(*) FROM classes WHERE school_id=$1`, schoolID).Scan(&cc)
		
		var meCount, mCount int
		var meAvg, mAvg float64
		pgDB.QueryRow(`SELECT COUNT(*), COALESCE(AVG( (COALESCE(sequence1,0)+COALESCE(sequence2,0)+COALESCE(sequence3,0)+COALESCE(sequence4,0)+COALESCE(exam,0)) / NULLIF((CASE WHEN sequence1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN sequence2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN sequence3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN sequence4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN exam IS NOT NULL THEN 1 ELSE 0 END), 0) ), 0) FROM marks_entry WHERE school_id=$1`, schoolID).Scan(&meCount, &meAvg)
		pgDB.QueryRow(`SELECT COUNT(*), COALESCE(AVG(score),0) FROM marks WHERE school_id=$1`, schoolID).Scan(&mCount, &mAvg)
		
		avgScore := meAvg
		if meCount > 0 {
			mc = meCount
			avgScore = meAvg
		} else {
			mc = mCount
			avgScore = mAvg
		}

		type SeqAvg struct { Name string `json:"name"`; Avg float64 `json:"avg"` }
		var seqAvgs []SeqAvg
		if meCount > 0 {
			var s1, s2, s3, s4, ex sql.NullFloat64
			pgDB.QueryRow(`SELECT AVG(sequence1), AVG(sequence2), AVG(sequence3), AVG(sequence4), AVG(exam) FROM marks_entry WHERE school_id=$1`, schoolID).Scan(&s1, &s2, &s3, &s4, &ex)
			if s1.Valid { seqAvgs = append(seqAvgs, SeqAvg{Name: "Seq 1", Avg: s1.Float64}) }
			if s2.Valid { seqAvgs = append(seqAvgs, SeqAvg{Name: "Seq 2", Avg: s2.Float64}) }
			if s3.Valid { seqAvgs = append(seqAvgs, SeqAvg{Name: "Seq 3", Avg: s3.Float64}) }
			if s4.Valid { seqAvgs = append(seqAvgs, SeqAvg{Name: "Seq 4", Avg: s4.Float64}) }
			if ex.Valid { seqAvgs = append(seqAvgs, SeqAvg{Name: "Exam", Avg: ex.Float64}) }
		} else {
			rows, err := pgDB.Query(`SELECT COALESCE(s.name, 'Seq ' || m.sequence_id), COALESCE(AVG(m.score),0) FROM marks m LEFT JOIN sequences s ON m.sequence_id=s.id WHERE m.school_id=$1 GROUP BY s.name, m.sequence_id`, schoolID)
			if err == nil && rows != nil {
				defer rows.Close()
				for rows.Next() {
					var sa SeqAvg
					if scanErr := rows.Scan(&sa.Name, &sa.Avg); scanErr == nil {
						seqAvgs = append(seqAvgs, sa)
					}
				}
			}
		}
		if seqAvgs == nil { seqAvgs = []SeqAvg{} }

		stats = map[string]interface{}{
			"teachers": tc,
			"students": sc,
			"classes": cc,
			"marksEntered": mc,
			"avgScore": fmt.Sprintf("%.1f", avgScore),
			"chartData": seqAvgs,
		}
	} else {
		localDBMu.RLock()
		defer localDBMu.RUnlock()
		tc, sc, cc := 0, 0, 0
		for _, u := range localDB.Users {
			if u.SchoolID != schoolID { continue }
			if strings.EqualFold(u.Role, "Teacher") { tc++ }
			if strings.EqualFold(u.Role, "Student") { sc++ }
		}
		for _, c := range localDB.Classes { if c.SchoolID == schoolID { cc++ } }
		stats = map[string]interface{}{"teachers": tc, "students": sc, "classes": cc, "marksEntered": 0, "avgScore": "0", "chartData": []interface{}{}}
	}
	jsonResp(w, stats)
}

func teacherDashboardStats(w http.ResponseWriter, r *http.Request) {
	teacherID := chi.URLParam(r, "teacherId")
	schoolID := r.URL.Query().Get("schoolId")
	stats := map[string]interface{}{}
	if isOnline() {
		var classCount, studentCount, marksCount int
		// 1. Classes taught by this teacher
		if teacherID != "" && teacherID != "undefined" {
			pgDB.QueryRow(`SELECT COUNT(*) FROM classes WHERE (teacher_id=$1 OR teacher_id='' OR teacher_id IS NULL) AND school_id=$2`, teacherID, schoolID).Scan(&classCount)
			if classCount == 0 {
				pgDB.QueryRow(`SELECT COUNT(*) FROM classes WHERE school_id=$1`, schoolID).Scan(&classCount)
			}
			pgDB.QueryRow(`SELECT COUNT(DISTINCT student_id) FROM enrollments WHERE school_id=$1 AND (class_id IN (SELECT id FROM classes WHERE teacher_id=$2) OR $2='')`, schoolID, teacherID).Scan(&studentCount)
			if studentCount == 0 {
				pgDB.QueryRow(`SELECT COUNT(*) FROM users WHERE school_id=$1 AND LOWER(role)='student'`, schoolID).Scan(&studentCount)
			}
		} else {
			pgDB.QueryRow(`SELECT COUNT(*) FROM classes WHERE school_id=$1`, schoolID).Scan(&classCount)
			pgDB.QueryRow(`SELECT COUNT(*) FROM users WHERE school_id=$1 AND LOWER(role)='student'`, schoolID).Scan(&studentCount)
		}

		// 2. Marks count and average score
		var avgScore float64
		var meAvg float64
		var meCount int
		pgDB.QueryRow(`SELECT COUNT(*), COALESCE(AVG( (COALESCE(sequence1,0)+COALESCE(sequence2,0)+COALESCE(sequence3,0)+COALESCE(sequence4,0)+COALESCE(exam,0)) / NULLIF((CASE WHEN sequence1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN sequence2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN sequence3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN sequence4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN exam IS NOT NULL THEN 1 ELSE 0 END), 0) ), 0) FROM marks_entry WHERE school_id=$1 AND (teacher_id=$2 OR teacher_id='' OR $2='')`, schoolID, teacherID).Scan(&meCount, &meAvg)
		
		var mAvg float64
		var mCount int
		pgDB.QueryRow(`SELECT COUNT(*), COALESCE(AVG(score),0) FROM marks WHERE school_id=$1 AND (teacher_id=$2 OR teacher_id='' OR $2='')`, schoolID, teacherID).Scan(&mCount, &mAvg)
		
		if meCount > 0 {
			marksCount = meCount
			avgScore = meAvg
		} else if mCount > 0 {
			marksCount = mCount
			avgScore = mAvg
		}

		// 3. Pending assignments count
		var pendingAssignments int
		pgDB.QueryRow(`SELECT COUNT(*) FROM assignment_submissions WHERE school_id=$1 AND status='submitted' AND (class_id IN (SELECT id FROM classes WHERE teacher_id=$2) OR $2='')`, schoolID, teacherID).Scan(&pendingAssignments)

		// 4. Fetch sequence averages for chart
		type SeqAvg struct { Name string `json:"name"`; Avg float64 `json:"avg"` }
		var seqAvgs []SeqAvg
		
		if meCount > 0 {
			var s1, s2, s3, s4, ex sql.NullFloat64
			pgDB.QueryRow(`SELECT AVG(sequence1), AVG(sequence2), AVG(sequence3), AVG(sequence4), AVG(exam) FROM marks_entry WHERE school_id=$1 AND (teacher_id=$2 OR teacher_id='' OR $2='')`, schoolID, teacherID).Scan(&s1, &s2, &s3, &s4, &ex)
			if s1.Valid { seqAvgs = append(seqAvgs, SeqAvg{Name: "Seq 1", Avg: s1.Float64}) }
			if s2.Valid { seqAvgs = append(seqAvgs, SeqAvg{Name: "Seq 2", Avg: s2.Float64}) }
			if s3.Valid { seqAvgs = append(seqAvgs, SeqAvg{Name: "Seq 3", Avg: s3.Float64}) }
			if s4.Valid { seqAvgs = append(seqAvgs, SeqAvg{Name: "Seq 4", Avg: s4.Float64}) }
			if ex.Valid { seqAvgs = append(seqAvgs, SeqAvg{Name: "Exam", Avg: ex.Float64}) }
		} else {
			rows, err := pgDB.Query(`SELECT COALESCE(s.name, 'Seq ' || m.sequence_id), COALESCE(AVG(m.score),0) FROM marks m LEFT JOIN sequences s ON m.sequence_id=s.id WHERE m.school_id=$1 AND (m.teacher_id=$2 OR m.teacher_id='' OR $2='') GROUP BY s.name, m.sequence_id`, schoolID, teacherID)
			if err == nil && rows != nil {
				defer rows.Close()
				for rows.Next() {
					var sa SeqAvg
					if scanErr := rows.Scan(&sa.Name, &sa.Avg); scanErr == nil {
						seqAvgs = append(seqAvgs, sa)
					}
				}
			}
		}
		if seqAvgs == nil { seqAvgs = []SeqAvg{} }
		stats = map[string]interface{}{
			"classes": classCount,
			"students": studentCount,
			"marksEntered": marksCount,
			"avgScore": fmt.Sprintf("%.1f", avgScore),
			"pendingAssignments": pendingAssignments,
			"chartData": seqAvgs,
		}
	} else {
		localDBMu.RLock(); defer localDBMu.RUnlock()
		cc, sc := 0, 0
		for _, c := range localDB.Classes { if c.TeacherID == teacherID { cc++ } }
		stats = map[string]interface{}{"classes": cc, "students": sc, "marksEntered": 0, "avgScore": "0", "chartData": []interface{}{}}
	}
	jsonResp(w, stats)
}

func studentDashboardStats(w http.ResponseWriter, r *http.Request) {
	studentID := chi.URLParam(r, "studentId")
	schoolID := r.URL.Query().Get("schoolId")
	stats := map[string]interface{}{}
	if isOnline() {
		var classCount, unreadCount, assignCount, pendingAssignCount int
		pgDB.QueryRow(`SELECT COUNT(*) FROM enrollments WHERE student_id=$1`, studentID).Scan(&classCount)
		if classCount == 0 {
			pgDB.QueryRow(`SELECT COUNT(*) FROM classes WHERE school_id=$1`, schoolID).Scan(&classCount)
		}
		pgDB.QueryRow(`SELECT COUNT(*) FROM messages WHERE recipient_id=$1 AND is_read=false`, studentID).Scan(&unreadCount)
		pgDB.QueryRow(`SELECT COUNT(*) FROM assignments WHERE school_id=$1`, schoolID).Scan(&assignCount)
		pgDB.QueryRow(`SELECT COUNT(*) FROM assignments a WHERE a.school_id=$1 AND a.id NOT IN (SELECT assignment_id FROM assignment_submissions WHERE student_id=$2)`, schoolID, studentID).Scan(&pendingAssignCount)
		
		var avgScore float64
		var meAvg float64
		var meCount int
		pgDB.QueryRow(`SELECT COUNT(*), COALESCE(AVG( (COALESCE(sequence1,0)+COALESCE(sequence2,0)+COALESCE(sequence3,0)+COALESCE(sequence4,0)+COALESCE(exam,0)) / NULLIF((CASE WHEN sequence1 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN sequence2 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN sequence3 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN sequence4 IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN exam IS NOT NULL THEN 1 ELSE 0 END), 0) ), 0) FROM marks_entry WHERE student_id=$1`, studentID).Scan(&meCount, &meAvg)
		
		if meCount > 0 {
			avgScore = meAvg
		} else {
			pgDB.QueryRow(`SELECT COALESCE(AVG(score),0) FROM marks WHERE student_id=$1`, studentID).Scan(&avgScore)
		}

		var totalAtt, presentAtt int
		pgDB.QueryRow(`SELECT COUNT(*), COUNT(CASE WHEN LOWER(status)='present' THEN 1 END) FROM attendance WHERE student_id=$1`, studentID).Scan(&totalAtt, &presentAtt)
		attRate := 100.0
		if totalAtt > 0 {
			attRate = (float64(presentAtt) / float64(totalAtt)) * 100.0
		}

		type SeqAvg struct { Name string `json:"name"`; Avg float64 `json:"avg"` }
		var seqAvgs []SeqAvg
		if meCount > 0 {
			var s1, s2, s3, s4, ex sql.NullFloat64
			pgDB.QueryRow(`SELECT AVG(sequence1), AVG(sequence2), AVG(sequence3), AVG(sequence4), AVG(exam) FROM marks_entry WHERE student_id=$1`, studentID).Scan(&s1, &s2, &s3, &s4, &ex)
			if s1.Valid { seqAvgs = append(seqAvgs, SeqAvg{Name: "Seq 1", Avg: s1.Float64}) }
			if s2.Valid { seqAvgs = append(seqAvgs, SeqAvg{Name: "Seq 2", Avg: s2.Float64}) }
			if s3.Valid { seqAvgs = append(seqAvgs, SeqAvg{Name: "Seq 3", Avg: s3.Float64}) }
			if s4.Valid { seqAvgs = append(seqAvgs, SeqAvg{Name: "Seq 4", Avg: s4.Float64}) }
			if ex.Valid { seqAvgs = append(seqAvgs, SeqAvg{Name: "Exam", Avg: ex.Float64}) }
		} else {
			rows, err := pgDB.Query(`SELECT COALESCE(s.name, 'Seq ' || m.sequence_id), COALESCE(AVG(m.score),0) FROM marks m LEFT JOIN sequences s ON m.sequence_id=s.id WHERE m.student_id=$1 GROUP BY s.name, m.sequence_id`, studentID)
			if err != nil || rows == nil {
				if err != nil {
					log.Printf("[Dashboard] student chart query failed: %v", err)
				}
			} else {
				defer rows.Close()
				for rows.Next() { var sa SeqAvg; if scanErr := rows.Scan(&sa.Name, &sa.Avg); scanErr != nil { log.Printf("[Dashboard] student chart scan failed: %v", scanErr); continue }; seqAvgs = append(seqAvgs, sa) }
			}
		}
		if seqAvgs == nil { seqAvgs = []SeqAvg{} }

		stats = map[string]interface{}{
			"classes": classCount,
			"avgScore": fmt.Sprintf("%.1f", avgScore),
			"unread": unreadCount,
			"assignments": assignCount,
			"pendingAssignments": pendingAssignCount,
			"attendanceRate": fmt.Sprintf("%.0f%%", attRate),
			"chartData": seqAvgs,
		}
	} else {
		stats = map[string]interface{}{"classes": 0, "avgScore": "0", "unread": 0, "assignments": 0, "pendingAssignments": 0, "attendanceRate": "100%", "chartData": []interface{}{}}
	}
	jsonResp(w, stats)
}

