package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"time"
)

// =====================================================================
// JSON DATABASE MODELS
// =====================================================================

type EdusphereDB struct {
	Schools map[string]json.RawMessage `json:"schools"`
	Users   map[string]json.RawMessage `json:"users"`
	Classes map[string]json.RawMessage `json:"classes"`
	Parents []ParentStudentLink        `json:"parentLinks"`
}

// =====================================================================
// SYNC ENGINE - AUTO SYNC FROM JSON TO POSTGRESQL
// =====================================================================

type SyncEngine struct {
	jsonFile string
	db       *sql.DB
	mu       sync.Mutex
	lastSync time.Time
}

var syncEngine *SyncEngine

func initSyncEngine(db *sql.DB) {
	syncEngine = &SyncEngine{
		jsonFile: "edusphere_db.json",
		db:       db,
		lastSync: time.Now(),
	}
}

// SyncFromJSONToPostgres - Automatically migrate data from JSON to PostgreSQL
func (se *SyncEngine) SyncFromJSONToPostgres() error {
	se.mu.Lock()
	defer se.mu.Unlock()

	if se.db == nil {
		return fmt.Errorf("database not connected")
	}

	// Load JSON data
	jsonData, err := se.loadJSONDatabase()
	if err != nil {
		log.Printf("[Sync] ⚠️ Failed to load JSON: %v", err)
		return err
	}

	if jsonData == nil {
		log.Println("[Sync] JSON database is empty, skipping sync")
		return nil
	}

	log.Println("[Sync] 🔄 Starting automatic sync from JSON to PostgreSQL...")

	// Sync schools
	schoolCount := 0
	for _, rawSchool := range jsonData.Schools {
		var school School
		if err := json.Unmarshal(rawSchool, &school); err != nil {
			log.Printf("[Sync] ⚠️ Failed to parse school: %v", err)
			continue
		}
		// Convert numeric ID to string if needed
		if school.ID == "" {
			// Try to extract ID from the raw JSON key
			var schoolData map[string]interface{}
			json.Unmarshal(rawSchool, &schoolData)
			if id, ok := schoolData["ID"]; ok {
				school.ID = fmt.Sprintf("%v", id)
			}
		}
		if school.ID == "" {
			log.Printf("[Sync] ⚠️ School has no ID, skipping")
			continue
		}
		if err := se.syncSchool(school); err != nil {
			log.Printf("[Sync] ⚠️ Failed to sync school %s: %v", school.ID, err)
		} else {
			schoolCount++
		}
	}

	// Sync users
	userCount := 0
	for _, rawUser := range jsonData.Users {
		var user User
		if err := json.Unmarshal(rawUser, &user); err != nil {
			log.Printf("[Sync] ⚠️ Failed to parse user: %v", err)
			continue
		}
		// Convert numeric ID to string if needed
		if user.ID == "" {
			var userData map[string]interface{}
			json.Unmarshal(rawUser, &userData)
			if id, ok := userData["ID"]; ok {
				user.ID = fmt.Sprintf("%v", id)
			}
		}
		if user.ID == "" {
			log.Printf("[Sync] ⚠️ User has no ID, skipping")
			continue
		}
		if err := se.syncUser(user); err != nil {
			log.Printf("[Sync] ⚠️ Failed to sync user %s: %v", user.ID, err)
		} else {
			userCount++
		}
	}

	// Sync classes
	classCount := 0
	for _, rawClass := range jsonData.Classes {
		var class Class
		if err := json.Unmarshal(rawClass, &class); err != nil {
			log.Printf("[Sync] ⚠️ Failed to parse class: %v", err)
			continue
		}
		if err := se.syncClass(class); err != nil {
			log.Printf("[Sync] ⚠️ Failed to sync class %s: %v", class.ID, err)
		} else {
			classCount++
		}
	}

	// Sync parent-student links
	linkCount := 0
	for i, link := range jsonData.Parents {
		// Generate ID if it doesn't exist
		if link.ID == "" {
			link.ID = fmt.Sprintf("parent-link-%d", i)
		}
		if err := se.syncParentLink(link); err != nil {
			log.Printf("[Sync] ⚠️ Failed to sync parent link: %v", err)
		} else {
			linkCount++
		}
	}

	se.lastSync = time.Now()
	log.Printf("[Sync] ✅ Sync complete! Schools: %d | Users: %d | Classes: %d | Links: %d",
		schoolCount, userCount, classCount, linkCount)

	return nil
}

// loadJSONDatabase - Read the JSON database file with flexible parsing
func (se *SyncEngine) loadJSONDatabase() (*EdusphereDB, error) {
	data, err := os.ReadFile(se.jsonFile)
	if err != nil {
		return nil, fmt.Errorf("failed to read %s: %v", se.jsonFile, err)
	}

	// First parse as raw maps to handle mixed types
	var rawData map[string]interface{}
	if err := json.Unmarshal(data, &rawData); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %v", err)
	}

	db := &EdusphereDB{
		Schools: make(map[string]json.RawMessage),
		Users:   make(map[string]json.RawMessage),
		Classes: make(map[string]json.RawMessage),
		Parents: []ParentStudentLink{},
	}

	// Parse schools
	if schools, ok := rawData["schools"].(map[string]interface{}); ok {
		for _, val := range schools {
			if schoolMap, ok := val.(map[string]interface{}); ok {
				// Convert numeric ID to string
				schoolData := map[string]interface{}{}
				for k, v := range schoolMap {
					if k == "ID" || k == "adminId" || k == "schoolId" {
						schoolData[k] = fmt.Sprintf("%v", v)
					} else {
						schoolData[k] = v
					}
				}
				if data, err := json.Marshal(schoolData); err == nil {
					db.Schools[fmt.Sprintf("%v", schoolMap["ID"])] = data
				}
			}
		}
	}

	// Parse users
	if users, ok := rawData["users"].(map[string]interface{}); ok {
		for _, val := range users {
			if userMap, ok := val.(map[string]interface{}); ok {
				// Convert numeric IDs to strings
				userData := map[string]interface{}{}
				for k, v := range userMap {
					if k == "ID" || k == "schoolId" {
						userData[k] = fmt.Sprintf("%v", v)
					} else {
						userData[k] = v
					}
				}
				if data, err := json.Marshal(userData); err == nil {
					db.Users[fmt.Sprintf("%v", userMap["ID"])] = data
				}
			}
		}
	}

	// Parse classes
	if classes, ok := rawData["classes"].(map[string]interface{}); ok {
		for key, val := range classes {
			if data, err := json.Marshal(val); err == nil {
				db.Classes[key] = data
			}
		}
	}

	// Parse parent links - handle both array and map formats
	if parentLinks, ok := rawData["parentLinks"]; ok {
		switch v := parentLinks.(type) {
		case []interface{}:
			// Array format
			for _, link := range v {
				linkMap := link.(map[string]interface{})
				pl := ParentStudentLink{
					ID:        fmt.Sprintf("%v", linkMap["id"]),
					ParentID:  fmt.Sprintf("%v", linkMap["parentId"]),
					StudentID: fmt.Sprintf("%v", linkMap["studentId"]),
				}
				if pl.ID == "" || pl.ID == "<nil>" {
					pl.ID = fmt.Sprintf("parent-link-%d", len(db.Parents))
				}
				db.Parents = append(db.Parents, pl)
			}
		case map[string]interface{}:
			// Map format
			for _, link := range v {
				linkMap := link.(map[string]interface{})
				pl := ParentStudentLink{
					ID:        fmt.Sprintf("%v", linkMap["id"]),
					ParentID:  fmt.Sprintf("%v", linkMap["parentId"]),
					StudentID: fmt.Sprintf("%v", linkMap["studentId"]),
				}
				if pl.ID == "" || pl.ID == "<nil>" {
					pl.ID = fmt.Sprintf("parent-link-%d", len(db.Parents))
				}
				db.Parents = append(db.Parents, pl)
			}
		}
	}

	return db, nil
}

// syncSchool - Sync a single school record
func (se *SyncEngine) syncSchool(school School) error {
	// Ensure ID is string
	if school.ID == "" {
		return fmt.Errorf("school has no ID")
	}
	
	// Convert AdminID to string if it looks like a number
	adminID := school.AdminID
	if adminID == "" {
		adminID = "0"
	}

	query := `
		INSERT INTO schools (id, name, primary_color, has_primary, has_secondary, config_json, admin_id, features)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			primary_color = EXCLUDED.primary_color,
			has_primary = EXCLUDED.has_primary,
			has_secondary = EXCLUDED.has_secondary,
			config_json = EXCLUDED.config_json,
			admin_id = EXCLUDED.admin_id,
			features = EXCLUDED.features
	`

	_, err := se.db.Exec(query,
		school.ID,
		school.Name,
		school.PrimaryColor,
		school.HasPrimary,
		school.HasSecondary,
		school.ConfigJSON,
		adminID,
		featuresJSON(school.Features),
	)
	return err
}

// syncUser - Sync a single user record
func (se *SyncEngine) syncUser(user User) error {
	// Ensure ID is string
	if user.ID == "" {
		return fmt.Errorf("user has no ID")
	}

	// Handle empty email by converting to unique email
	if user.Email == "" {
		user.Email = fmt.Sprintf("user-%s@noemail.local", user.ID)
	}

	// Ensure SchoolID is string
	if user.SchoolID == "" {
		user.SchoolID = "0"
	}

	query := `
		INSERT INTO users (id, school_id, name, email, password, role, first_login)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (id) DO UPDATE SET
			school_id = EXCLUDED.school_id,
			name = EXCLUDED.name,
			email = EXCLUDED.email,
			password = EXCLUDED.password,
			role = EXCLUDED.role,
			first_login = EXCLUDED.first_login
	`

	_, err := se.db.Exec(query,
		user.ID,
		user.SchoolID,
		user.Name,
		user.Email,
		user.Password,
		user.Role,
		user.FirstLogin,
	)

	// If email conflict, try with a modified email
	if err != nil && strings.Contains(err.Error(), "duplicate key") {
		user.Email = fmt.Sprintf("%s-id%s", strings.Split(user.Email, "@")[0], user.ID)
		_, err = se.db.Exec(query,
			user.ID,
			user.SchoolID,
			user.Name,
			user.Email,
			user.Password,
			user.Role,
			user.FirstLogin,
		)
	}

	return err
}

// syncClass - Sync a single class record
func (se *SyncEngine) syncClass(class Class) error {
	query := `
		INSERT INTO classes (id, school_id, name, subject, teacher_id, year)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (id) DO UPDATE SET
			school_id = EXCLUDED.school_id,
			name = EXCLUDED.name,
			subject = EXCLUDED.subject,
			teacher_id = EXCLUDED.teacher_id,
			year = EXCLUDED.year
	`

	_, err := se.db.Exec(query,
		class.ID,
		class.SchoolID,
		class.Name,
		class.Subject,
		class.TeacherID,
		class.Year,
	)
	return err
}

// syncParentLink - Sync a single parent-student link
func (se *SyncEngine) syncParentLink(link ParentStudentLink) error {
	query := `
		INSERT INTO parent_student_links (id, parent_id, student_id)
		VALUES ($1, $2, $3)
		ON CONFLICT (id) DO UPDATE SET
			parent_id = EXCLUDED.parent_id,
			student_id = EXCLUDED.student_id
	`

	_, err := se.db.Exec(query,
		link.ID,
		link.ParentID,
		link.StudentID,
	)
	return err
}

// =====================================================================
// AUTO SYNC WORKER - Monitors connection and syncs when online
// =====================================================================

func syncOnConnectionRestoration() {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	wasOnline := isOnline()
	lastSyncAttempt := time.Now()

	for range ticker.C {
		currentOnline := isOnline()

		// If just came online, trigger sync
		if currentOnline && !wasOnline {
			log.Println("[Sync] 🔗 Connection restored! Starting automatic sync...")
			if err := syncEngine.SyncFromJSONToPostgres(); err != nil {
				log.Printf("[Sync] ❌ Auto-sync failed: %v", err)
			}
			lastSyncAttempt = time.Now()
		}

		// Periodic sync every 5 minutes even if online (to catch updates)
		if currentOnline && time.Since(lastSyncAttempt) > 5*time.Minute {
			log.Println("[Sync] 🔄 Periodic sync check...")
			if err := syncEngine.SyncFromJSONToPostgres(); err != nil {
				log.Printf("[Sync] ❌ Periodic sync failed: %v", err)
			}
			lastSyncAttempt = time.Now()
		}

		wasOnline = currentOnline
	}
}

// =====================================================================
// SYNC STATUS ENDPOINT
// =====================================================================

type SyncStatus struct {
	Online       bool      `json:"online"`
	PendingSync  int       `json:"pendingSync"`
	LastSync     time.Time `json:"lastSync"`
	SyncDuration string    `json:"syncDuration"`
}

func getSyncStatus() SyncStatus {
	return SyncStatus{
		Online:      isOnline(),
		PendingSync: len(syncQueue),
		LastSync:    syncEngine.lastSync,
		SyncDuration: fmt.Sprintf("%.2f seconds", time.Since(syncEngine.lastSync).Seconds()),
	}
}
