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

const dsn = "host=localhost port=5432 user=postgres password=Black@123 dbname=postgres sslmode=disable"

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
		`CREATE TABLE IF NOT EXISTS schools (
			id VARCHAR(36) PRIMARY KEY,
			name TEXT NOT NULL,
			primary_color TEXT,
			has_primary BOOLEAN DEFAULT true,
			has_secondary BOOLEAN DEFAULT false,
			config_json TEXT,
			admin_id VARCHAR(36),
			features JSONB DEFAULT '{}'
		)`,
		`CREATE TABLE IF NOT EXISTS users (
			id VARCHAR(36) PRIMARY KEY,
			school_id VARCHAR(36),
			name TEXT NOT NULL,
			email TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL,
			role TEXT NOT NULL,
			first_login BOOLEAN DEFAULT true
		)`,
		`CREATE TABLE IF NOT EXISTS classes (
			id VARCHAR(36) PRIMARY KEY,
			school_id VARCHAR(36),
			name TEXT NOT NULL,
			subject TEXT,
			teacher_id VARCHAR(36),
			year TEXT
		)`,
		`CREATE TABLE IF NOT EXISTS parent_student_links (
			id VARCHAR(36) PRIMARY KEY,
			parent_id VARCHAR(36) NOT NULL,
			student_id VARCHAR(36) NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS terms (
			id VARCHAR(36) PRIMARY KEY,
			school_id VARCHAR(36),
			name TEXT NOT NULL,
			year TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS course_subjects (
			id VARCHAR(36) PRIMARY KEY,
			school_id VARCHAR(36),
			class_id VARCHAR(36),
			name TEXT NOT NULL,
			coefficient REAL NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS grades (
			id VARCHAR(36) PRIMARY KEY,
			school_id VARCHAR(36),
			term_id VARCHAR(36),
			subject_id VARCHAR(36),
			student_id VARCHAR(36),
			score REAL NOT NULL,
			UNIQUE(term_id, subject_id, student_id)
		)`,
		`CREATE TABLE IF NOT EXISTS report_card_templates (
			id VARCHAR(36) PRIMARY KEY,
			school_id VARCHAR(36) UNIQUE,
			logo_url TEXT,
			motto TEXT,
			principal TEXT,
			passing_score REAL DEFAULT 10.0
		)`,
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
	Schools     []School             `json:"schools"`
	Users       []User               `json:"users"`
	Classes     []Class              `json:"classes"`
	ParentLinks []ParentStudentLink  `json:"parentLinks"`
	Terms       []Term               `json:"terms"`
	Subjects    []CourseSubject      `json:"subjects"`
	Grades      []Grade              `json:"grades"`
	Templates   []ReportCardTemplate `json:"templates"`
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

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
	}))

	r.Get("/api/status", func(w http.ResponseWriter, r *http.Request) {
		syncQueueMu.Lock()
		q := len(syncQueue)
		syncQueueMu.Unlock()
		jsonResp(w, map[string]interface{}{"online": isOnline(), "pendingSync": q})
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

	r.Post("/api/grades/bulk", bulkUploadGrades)
	r.Get("/api/report-cards/student/{id}", getStudentReportCard)
	r.Get("/api/report-cards/class/{class_id}", getClassReportCards)
	r.Post("/api/report-cards/templates", saveReportCardTemplate)

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
		row := pgDB.QueryRow(`SELECT id,school_id,name,email,password,role,first_login FROM users WHERE email=$1 AND password=$2`, email, password)
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

	cleanName := strings.ReplaceAll(strings.ToLower(req.Name), " ", ".")
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
	var list []Class
	if isOnline() {
		q := `SELECT id,school_id,name,subject,teacher_id,year FROM classes WHERE 1=1`
		args := []interface{}{}
		if schoolID != "" { q += " AND school_id=$1"; args = append(args, schoolID) }
		rows, _ := pgDB.Query(q, args...)
		defer rows.Close()
		for rows.Next() {
			var c Class
			rows.Scan(&c.ID, &c.SchoolID, &c.Name, &c.Subject, &c.TeacherID, &c.Year)
			list = append(list, c)
		}
	} else {
		localDBMu.RLock()
		defer localDBMu.RUnlock()
		for _, c := range localDB.Classes {
			if schoolID != "" && c.SchoolID != schoolID { continue }
			list = append(list, c)
		}
	}
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
