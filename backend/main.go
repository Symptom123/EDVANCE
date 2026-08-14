package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
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
	ID           string       `json:"ID"`
	Name         string       `json:"name"`
	PrimaryColor string       `json:"primaryColor"`
	HasPrimary   bool         `json:"hasPrimary"`
	HasSecondary bool         `json:"hasSecondary"`
	ConfigJSON   string       `json:"configJson"`
	AdminID      string       `json:"adminId"`
	Features     FeatureFlags `json:"features"`
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
	ID        string `json:"ID"`
	SchoolID  string `json:"schoolId"`
	Name      string `json:"name"`
	Subject   string `json:"subject"`
	TeacherID string `json:"teacherId"`
	Year      string `json:"year"`
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
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Printf("[DB] Failed to open DB: %v. Running offline.", err)
		setOffline()
		return
	}
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

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
		`CREATE TABLE IF NOT EXISTS grades (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), term_id VARCHAR(36), subject_id VARCHAR(36), student_id VARCHAR(36), score REAL NOT NULL, UNIQUE(term_id, subject_id, student_id))`,
		`CREATE TABLE IF NOT EXISTS academic_years (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), year_name TEXT NOT NULL, is_current BOOLEAN DEFAULT false)`,
		`CREATE TABLE IF NOT EXISTS sequences (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), name TEXT NOT NULL, is_locked BOOLEAN DEFAULT false)`,
		`CREATE TABLE IF NOT EXISTS marks (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), student_id VARCHAR(36), class_id VARCHAR(36), subject_id VARCHAR(36), sequence_id VARCHAR(36), score REAL NOT NULL, teacher_id VARCHAR(36), date_entered TEXT, UNIQUE(student_id, subject_id, sequence_id))`,
		`CREATE TABLE IF NOT EXISTS report_card_templates (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36) UNIQUE, logo_url TEXT, motto TEXT, principal TEXT, passing_score REAL DEFAULT 10.0)`,
		`CREATE TABLE IF NOT EXISTS enrollments (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), student_id VARCHAR(36), class_id VARCHAR(36), year TEXT)`,
		`CREATE TABLE IF NOT EXISTS announcements (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), title TEXT, content TEXT, author_id VARCHAR(36), created_at TIMESTAMP)`,
		`CREATE TABLE IF NOT EXISTS assignments (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), title TEXT, class_id VARCHAR(36), due_date TIMESTAMP)`,
		`CREATE TABLE IF NOT EXISTS messages (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), sender_id VARCHAR(36), recipient_id VARCHAR(36), body TEXT, sent_at TIMESTAMP)`,
		`CREATE TABLE IF NOT EXISTS attendance (id VARCHAR(36) PRIMARY KEY, school_id VARCHAR(36), student_id VARCHAR(36), date DATE, status TEXT)`,
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
	err := row.Scan(&s.ID, &s.Name, &s.PrimaryColor, &s.HasPrimary, &s.HasSecondary, &s.ConfigJSON, &s.AdminID, &featJSON)
	if err == nil {
		json.Unmarshal([]byte(featJSON), &s.Features)
	}
	return s, err
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
	r.Post("/api/classes", createClass)
	r.Delete("/api/classes/{id}", deleteClass)
	r.Post("/api/parents/generate", generateParent)
	r.Post("/api/parents/claim", claimParentAccount)
	r.Post("/api/parents/link-child", linkChildToParent)
	r.Get("/api/parents/{id}/children", getParentChildren)

	r.Post("/api/marks/bulk", bulkUploadMarks)
	r.Post("/api/marks", upsertMark)
	r.Get("/api/marks", listMarks)
	r.Get("/api/marks/student/{id}", getStudentMarks)
	r.Post("/api/sequences/lock", lockSequence)
	r.Get("/api/sequences", listSequences)
	r.Post("/api/sequences", createSequence)

	r.Post("/api/grades/bulk", bulkUploadGrades)
	r.Get("/api/report-cards/student/{id}", getStudentReportCard)
	r.Get("/api/report-cards/class/{class_id}", getClassReportCards)
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
	AdminName    string `json:"adminName"`
	AdminEmail   string `json:"adminEmail"`
	AdminPass    string `json:"adminPass"`
	SchoolName   string `json:"schoolName"`
	PrimaryColor string `json:"primaryColor"`
	HasPrimary   bool   `json:"hasPrimary"`
	HasSecondary bool   `json:"hasSecondary"`
	ConfigJSON   string `json:"configJson"`
}

func createSchool(w http.ResponseWriter, r *http.Request) {
	var req CreateSchoolRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	schoolID := uuid.New().String()
	adminID := uuid.New().String()

	school := School{ID: schoolID, Name: req.SchoolName, PrimaryColor: req.PrimaryColor,
		HasPrimary: req.HasPrimary, HasSecondary: req.HasSecondary, ConfigJSON: req.ConfigJSON,
		AdminID: adminID, Features: FeatureFlags{true, true, true, true, true, true}}
	admin := User{ID: adminID, SchoolID: schoolID, Name: req.AdminName, Email: req.AdminEmail,
		Password: req.AdminPass, Role: "Admin", FirstLogin: false}

	if isOnline() {
		pgDB.Exec(`INSERT INTO schools(id,name,primary_color,has_primary,has_secondary,config_json,admin_id,features) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
			school.ID, school.Name, school.PrimaryColor, school.HasPrimary, school.HasSecondary, school.ConfigJSON, school.AdminID, featuresJSON(school.Features))
		pgDB.Exec(`INSERT INTO users(id,school_id,name,email,password,role,first_login) VALUES($1,$2,$3,$4,$5,$6,$7)`,
			admin.ID, admin.SchoolID, admin.Name, admin.Email, admin.Password, admin.Role, admin.FirstLogin)
	} else {
		localDBMu.Lock()
		localDB.Schools = append(localDB.Schools, school)
		localDB.Users = append(localDB.Users, admin)
		saveLocalDB()
		localDBMu.Unlock()
		enqueue("CREATE_SCHOOL", school)
		enqueue("CREATE_USER", admin)
	}
	jsonResp(w, map[string]interface{}{"schoolId": schoolID, "adminId": adminID, "message": "School created"})
}

func getSchool(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if isOnline() {
		row := pgDB.QueryRow(`SELECT id,name,primary_color,has_primary,has_secondary,config_json,admin_id,features FROM schools WHERE id=$1`, id)
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
		rows, _ := pgDB.Query(`SELECT id, name FROM schools`)
		defer rows.Close()
		for rows.Next() {
			var s SS
			rows.Scan(&s.ID, &s.Name)
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
		rows, _ := pgDB.Query(q, args...)
		defer rows.Close()
		for rows.Next() {
			var u SafeUser
			rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.FirstLogin)
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
	if schoolID == "undefined" || schoolID == "null" { schoolID = "" }
	var list []Class
	if isOnline() {
		q := `SELECT id, school_id, name, COALESCE(subject,''), COALESCE(teacher_id,''), COALESCE(year,'') FROM classes WHERE 1=1`
		args := []interface{}{}
		if schoolID != "" { q += " AND school_id=$1"; args = append(args, schoolID) }
		rows, err := pgDB.Query(q, args...)
		if err == nil && rows != nil {
			defer rows.Close()
			for rows.Next() {
				var c Class
				rows.Scan(&c.ID, &c.SchoolID, &c.Name, &c.Subject, &c.TeacherID, &c.Year)
				list = append(list, c)
			}
		}
	} else {
		localDBMu.RLock()
		defer localDBMu.RUnlock()
		for _, c := range localDB.Classes {
			if schoolID != "" && c.SchoolID != schoolID { continue }
			list = append(list, c)
		}
	}
	if list == nil { list = []Class{} }
	jsonResp(w, list)
}

type CreateClassRequest struct {
	SchoolID  string `json:"schoolId"`
	Name      string `json:"name"`
	Subject   string `json:"subject"`
	TeacherID string `json:"teacherId"`
	Year      string `json:"year"`
}

func createClass(w http.ResponseWriter, r *http.Request) {
	var req CreateClassRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	c := Class{ID: uuid.New().String(), SchoolID: req.SchoolID, Name: req.Name, Subject: req.Subject, TeacherID: req.TeacherID, Year: req.Year}
	if isOnline() {
		pgDB.Exec(`INSERT INTO classes(id,school_id,name,subject,teacher_id,year) VALUES($1,$2,$3,$4,$5,$6)`, c.ID, c.SchoolID, c.Name, c.Subject, c.TeacherID, c.Year)
	} else {
		localDBMu.Lock()
		localDB.Classes = append(localDB.Classes, c)
		saveLocalDB()
		localDBMu.Unlock()
		enqueue("CREATE_CLASS", c)
	}
	jsonResp(w, c)
}

func deleteClass(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if isOnline() {
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
		rows, _ := pgDB.Query(`SELECT u.id, u.name, u.school_id, COALESCE(s.name,'') FROM parent_student_links l JOIN users u ON l.student_id=u.id LEFT JOIN schools s ON u.school_id=s.id WHERE l.parent_id=$1`, parentID)
		defer rows.Close()
		for rows.Next() {
			var c ChildData
			rows.Scan(&c.ID, &c.Name, &c.SchoolID, &c.SchoolName)
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
	ID          string `json:"id"`
	SchoolID    string `json:"schoolId"`
	ClassID     string `json:"classId"`
	ClassName   string `json:"className"`
	TeacherID   string `json:"teacherId"`
	TeacherName string `json:"teacherName"`
	Title       string `json:"title"`
	Description string `json:"description"`
	DueDate     string `json:"dueDate"`
	CreatedAt   string `json:"createdAt"`
}

func listAssignments(w http.ResponseWriter, r *http.Request) {
	schoolID := r.URL.Query().Get("schoolId")
	classID := r.URL.Query().Get("classId")
	studentID := r.URL.Query().Get("studentId")
	var list []Assignment
	if isOnline() {
		var q string; var args []interface{}
		if studentID != "" {
			q = `SELECT a.id,a.school_id,a.class_id,COALESCE(c.name,''),a.teacher_id,COALESCE(u.name,''),a.title,a.description,a.due_date,a.created_at
				FROM assignments a LEFT JOIN classes c ON a.class_id=c.id LEFT JOIN users u ON a.teacher_id=u.id
				WHERE a.school_id=$1 AND a.class_id IN (SELECT class_id FROM enrollments WHERE student_id=$2)
				ORDER BY a.due_date ASC`
			args = []interface{}{schoolID, studentID}
		} else if classID != "" {
			q = `SELECT a.id,a.school_id,a.class_id,COALESCE(c.name,''),a.teacher_id,COALESCE(u.name,''),a.title,a.description,a.due_date,a.created_at
				FROM assignments a LEFT JOIN classes c ON a.class_id=c.id LEFT JOIN users u ON a.teacher_id=u.id
				WHERE a.class_id=$1 ORDER BY a.due_date ASC`
			args = []interface{}{classID}
		} else {
			q = `SELECT a.id,a.school_id,a.class_id,COALESCE(c.name,''),a.teacher_id,COALESCE(u.name,''),a.title,a.description,a.due_date,a.created_at
				FROM assignments a LEFT JOIN classes c ON a.class_id=c.id LEFT JOIN users u ON a.teacher_id=u.id
				WHERE a.school_id=$1 ORDER BY a.due_date ASC`
			args = []interface{}{schoolID}
		}
		rows, err := pgDB.Query(q, args...)
		if err != nil { jsonResp(w, []Assignment{}); return }
		defer rows.Close()
		for rows.Next() {
			var a Assignment
			rows.Scan(&a.ID, &a.SchoolID, &a.ClassID, &a.ClassName, &a.TeacherID, &a.TeacherName, &a.Title, &a.Description, &a.DueDate, &a.CreatedAt)
			list = append(list, a)
		}
	}
	if list == nil { list = []Assignment{} }
	jsonResp(w, list)
}

type CreateAssignmentRequest struct {
	SchoolID    string `json:"schoolId"`
	ClassID     string `json:"classId"`
	TeacherID   string `json:"teacherId"`
	TeacherName string `json:"teacherName"`
	Title       string `json:"title"`
	Description string `json:"description"`
	DueDate     string `json:"dueDate"`
}

func createAssignment(w http.ResponseWriter, r *http.Request) {
	var req CreateAssignmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil { http.Error(w, err.Error(), http.StatusBadRequest); return }
	id := uuid.New().String()
	now := time.Now().Format(time.RFC3339)
	if isOnline() {
		_, err := pgDB.Exec(`INSERT INTO assignments(id,school_id,class_id,teacher_id,teacher_name,title,description,due_date,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
			id, req.SchoolID, req.ClassID, req.TeacherID, req.TeacherName, req.Title, req.Description, req.DueDate, now)
		if err != nil { http.Error(w, err.Error(), http.StatusInternalServerError); return }
	}
	jsonResp(w, Assignment{ID: id, SchoolID: req.SchoolID, ClassID: req.ClassID, TeacherID: req.TeacherID, TeacherName: req.TeacherName, Title: req.Title, Description: req.Description, DueDate: req.DueDate, CreatedAt: now})
}

func deleteAssignment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if isOnline() { pgDB.Exec(`DELETE FROM assignments WHERE id=$1`, id) }
	jsonResp(w, map[string]string{"message": "Deleted"})
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
			q = `SELECT m.id,m.school_id,m.sender_id,COALESCE(su.name,''),COALESCE(su.role,''),m.recipient_id,COALESCE(ru.name,''),m.subject,m.body,m.is_read,m.created_at
				FROM messages m LEFT JOIN users su ON m.sender_id=su.id LEFT JOIN users ru ON m.recipient_id=ru.id
				WHERE m.sender_id=$1 ORDER BY m.created_at DESC`
			args = []interface{}{userID}
		} else {
			q = `SELECT m.id,m.school_id,m.sender_id,COALESCE(su.name,''),COALESCE(su.role,''),m.recipient_id,COALESCE(ru.name,''),m.subject,m.body,m.is_read,m.created_at
				FROM messages m LEFT JOIN users su ON m.sender_id=su.id LEFT JOIN users ru ON m.recipient_id=ru.id
				WHERE m.recipient_id=$1 ORDER BY m.created_at DESC`
			args = []interface{}{userID}
		}
		rows, err := pgDB.Query(q, args...)
		if err != nil { jsonResp(w, []Message{}); return }
		defer rows.Close()
		for rows.Next() {
			var msg Message
			rows.Scan(&msg.ID, &msg.SchoolID, &msg.SenderID, &msg.SenderName, &msg.SenderRole, &msg.RecipientID, &msg.RecipientName, &msg.Subject, &msg.Body, &msg.IsRead, &msg.CreatedAt)
			list = append(list, msg)
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
		if err != nil { http.Error(w, err.Error(), http.StatusInternalServerError); return }
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
	var list []AttendanceRecord
	if isOnline() {
		q := `SELECT id,school_id,class_id,student_id,date,status,COALESCE(teacher_id,'') FROM attendance WHERE 1=1`
		args := []interface{}{}; n := 1
		if schoolID != "" { q += fmt.Sprintf(" AND school_id=$%d", n); args = append(args, schoolID); n++ }
		if classID != "" { q += fmt.Sprintf(" AND class_id=$%d", n); args = append(args, classID); n++ }
		if studentID != "" { q += fmt.Sprintf(" AND student_id=$%d", n); args = append(args, studentID); n++ }
		q += " ORDER BY date DESC"
		rows, err := pgDB.Query(q, args...)
		if err != nil { jsonResp(w, []AttendanceRecord{}); return }
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
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil { http.Error(w, err.Error(), http.StatusBadRequest); return }
	if req.Date == "" { req.Date = time.Now().Format("2006-01-02") }
	if isOnline() {
		for studentID, status := range req.Records {
			id := uuid.New().String()
			pgDB.Exec(`INSERT INTO attendance(id,school_id,class_id,student_id,date,status,teacher_id)
				VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(class_id,student_id,date) DO UPDATE SET status=EXCLUDED.status`,
				id, req.SchoolID, req.ClassID, studentID, req.Date, status, req.TeacherID)
		}
	}
	jsonResp(w, map[string]interface{}{"message": "Attendance saved", "date": req.Date, "count": len(req.Records)})
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
		pgDB.QueryRow(`SELECT COUNT(*) FROM marks WHERE school_id=$1`, schoolID).Scan(&mc)
		var avgScore float64
		pgDB.QueryRow(`SELECT COALESCE(AVG(score),0) FROM marks WHERE school_id=$1`, schoolID).Scan(&avgScore)
		stats = map[string]interface{}{
			"teachers": tc, "students": sc, "classes": cc, "marksEntered": mc, "avgScore": fmt.Sprintf("%.1f", avgScore),
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
		stats = map[string]interface{}{"teachers": tc, "students": sc, "classes": cc, "marksEntered": 0, "avgScore": "0"}
	}
	jsonResp(w, stats)
}

func teacherDashboardStats(w http.ResponseWriter, r *http.Request) {
	teacherID := chi.URLParam(r, "teacherId")
	schoolID := r.URL.Query().Get("schoolId")
	stats := map[string]interface{}{}
	if isOnline() {
		var classCount, studentCount, marksCount int
		pgDB.QueryRow(`SELECT COUNT(*) FROM classes WHERE teacher_id=$1`, teacherID).Scan(&classCount)
		pgDB.QueryRow(`SELECT COUNT(DISTINCT student_id) FROM enrollments WHERE class_id IN (SELECT id FROM classes WHERE teacher_id=$1)`, teacherID).Scan(&studentCount)
		pgDB.QueryRow(`SELECT COUNT(*) FROM marks WHERE teacher_id=$1 AND school_id=$2`, teacherID, schoolID).Scan(&marksCount)
		var avgScore float64
		pgDB.QueryRow(`SELECT COALESCE(AVG(score),0) FROM marks WHERE teacher_id=$1`, teacherID).Scan(&avgScore)
		// Fetch sequence averages for chart
		type SeqAvg struct { Name string `json:"name"`; Avg float64 `json:"avg"` }
		var seqAvgs []SeqAvg
		rows, _ := pgDB.Query(`SELECT s.name, COALESCE(AVG(m.score),0) FROM marks m JOIN sequences s ON m.sequence_id=s.id WHERE m.teacher_id=$1 GROUP BY s.name,s.id ORDER BY s.id`, teacherID)
		if rows != nil {
			defer rows.Close()
			for rows.Next() { var sa SeqAvg; rows.Scan(&sa.Name, &sa.Avg); seqAvgs = append(seqAvgs, sa) }
		}
		if seqAvgs == nil { seqAvgs = []SeqAvg{} }
		stats = map[string]interface{}{"classes": classCount, "students": studentCount, "marksEntered": marksCount, "avgScore": fmt.Sprintf("%.1f", avgScore), "chartData": seqAvgs}
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
		var classCount, unreadCount int
		pgDB.QueryRow(`SELECT COUNT(*) FROM enrollments WHERE student_id=$1`, studentID).Scan(&classCount)
		pgDB.QueryRow(`SELECT COUNT(*) FROM messages WHERE recipient_id=$1 AND is_read=false`, studentID).Scan(&unreadCount)
		var avgScore float64
		pgDB.QueryRow(`SELECT COALESCE(AVG(score),0) FROM marks WHERE student_id=$1 AND school_id=$2`, studentID, schoolID).Scan(&avgScore)
		// Sequence performance for chart
		type SeqAvg struct { Name string `json:"name"`; Avg float64 `json:"avg"` }
		var seqAvgs []SeqAvg
		rows, _ := pgDB.Query(`SELECT s.name, COALESCE(AVG(m.score),0) FROM marks m JOIN sequences s ON m.sequence_id=s.id WHERE m.student_id=$1 GROUP BY s.name,s.id ORDER BY s.id`, studentID)
		if rows != nil { defer rows.Close(); for rows.Next() { var sa SeqAvg; rows.Scan(&sa.Name, &sa.Avg); seqAvgs = append(seqAvgs, sa) } }
		if seqAvgs == nil { seqAvgs = []SeqAvg{} }
		stats = map[string]interface{}{"classes": classCount, "avgScore": fmt.Sprintf("%.1f", avgScore), "unread": unreadCount, "chartData": seqAvgs}
	} else {
		stats = map[string]interface{}{"classes": 0, "avgScore": "0", "unread": 0, "chartData": []interface{}{}}
	}
	jsonResp(w, stats)
}
