package main

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// =====================================================================
// GRADING HANDLERS
// =====================================================================

type BulkGradeUploadRequest struct {
	TermID    string  `json:"termId"`
	SubjectID string  `json:"subjectId"`
	SchoolID  string  `json:"schoolId"`
	Grades    []Grade `json:"grades"` // expects StudentID and Score to be set
}

func bulkUploadGrades(w http.ResponseWriter, r *http.Request) {
	var req BulkGradeUploadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	for _, g := range req.Grades {
		gradeID := uuid.New().String()
		grade := Grade{
			ID:        gradeID,
			SchoolID:  req.SchoolID,
			TermID:    req.TermID,
			SubjectID: req.SubjectID,
			StudentID: g.StudentID,
			Score:     g.Score,
		}

		if isOnline() {
			// Upsert logic for PostgreSQL
			pgDB.Exec(`
				INSERT INTO grades (id, school_id, term_id, subject_id, student_id, score) 
				VALUES ($1, $2, $3, $4, $5, $6)
				ON CONFLICT (term_id, subject_id, student_id) 
				DO UPDATE SET score = EXCLUDED.score
			`, grade.ID, grade.SchoolID, grade.TermID, grade.SubjectID, grade.StudentID, grade.Score)
		} else {
			localDBMu.Lock()
			// Simple upsert in local memory
			found := false
			for i, lg := range localDB.Grades {
				if lg.TermID == grade.TermID && lg.SubjectID == grade.SubjectID && lg.StudentID == grade.StudentID {
					localDB.Grades[i].Score = grade.Score
					grade = localDB.Grades[i]
					found = true
					break
				}
			}
			if !found {
				localDB.Grades = append(localDB.Grades, grade)
			}
			saveLocalDB()
			localDBMu.Unlock()
			
			// Note: offline queue needs an UPSERT_GRADE action
			enqueue("UPSERT_GRADE", grade)
		}
	}

	jsonResp(w, map[string]interface{}{"message": "Grades uploaded successfully"})
}

// =====================================================================
// REPORT CARD HANDLERS
// =====================================================================

type SubjectReport struct {
	SubjectName string  `json:"subjectName"`
	Score       float64 `json:"score"`
	Coefficient float64 `json:"coefficient"`
	Total       float64 `json:"total"` // Score * Coefficient
	Grade       string  `json:"grade"` // A, B, C etc. (or Très Bien)
}

type ReportCard struct {
	StudentID       string          `json:"studentId"`
	StudentName     string          `json:"studentName"`
	Subjects        []SubjectReport `json:"subjects"`
	TotalScore      float64         `json:"totalScore"`
	TotalCoeff      float64         `json:"totalCoeff"`
	Average         float64         `json:"average"`
	Rank            int             `json:"rank"`
	ClassAverage    float64         `json:"classAverage"`
	HighestAverage  float64         `json:"highestAverage"`
	LowestAverage   float64         `json:"lowestAverage"`
	Appreciation    string          `json:"appreciation"`
}

func getAppreciation(avg float64) string {
	if avg >= 16 { return "Très Bien" }
	if avg >= 14 { return "Bien" }
	if avg >= 12 { return "Assez Bien" }
	if avg >= 10 { return "Passable" }
	if avg >= 8 { return "Insuffisant" }
	return "Faible"
}

func fetchClassReportCards(schoolID, classID, termID string) ([]ReportCard, error) {
	if !isOnline() {
		return []ReportCard{}, nil // Offline report generation not fully supported in this snippet
	}

	// 1. Get Subjects for the class
	rows, err := pgDB.Query(`SELECT id, name, coefficient FROM course_subjects WHERE class_id=$1`, classID)
	if err != nil { return nil, err }
	defer rows.Close()

	type Subj struct { id, name string; coeff float64 }
	var subjects []Subj
	for rows.Next() {
		var s Subj
		rows.Scan(&s.id, &s.name, &s.coeff)
		subjects = append(subjects, s)
	}

	// 2. Get all students in the school (ideally we'd link students to classes, but for now we fetch all students who have grades in this class's subjects)
	// We'll get all grades for these subjects in this term
	gradeRows, err := pgDB.Query(`
		SELECT g.student_id, u.name, g.subject_id, g.score 
		FROM grades g
		JOIN users u ON g.student_id = u.id
		WHERE g.term_id=$1 AND g.subject_id IN (SELECT id FROM course_subjects WHERE class_id=$2)
	`, termID, classID)
	if err != nil { return nil, err }
	defer gradeRows.Close()

	// Map StudentID -> ReportCard
	studentMap := make(map[string]*ReportCard)

	for gradeRows.Next() {
		var sID, sName, subjID string
		var score float64
		gradeRows.Scan(&sID, &sName, &subjID, &score)

		if _, exists := studentMap[sID]; !exists {
			studentMap[sID] = &ReportCard{StudentID: sID, StudentName: sName, Subjects: []SubjectReport{}}
		}

		// Find subject details
		var sNameStr string
		var sCoeff float64
		for _, s := range subjects {
			if s.id == subjID {
				sNameStr = s.name
				sCoeff = s.coeff
				break
			}
		}

		sr := SubjectReport{
			SubjectName: sNameStr,
			Score:       score,
			Coefficient: sCoeff,
			Total:       score * sCoeff,
			Grade:       getAppreciation(score),
		}

		rc := studentMap[sID]
		rc.Subjects = append(rc.Subjects, sr)
		rc.TotalScore += sr.Total
		rc.TotalCoeff += sr.Coefficient
	}

	// Calculate averages and stats
	var cards []ReportCard
	var highest = 0.0
	var lowest = 20.0
	var sumAvgs = 0.0

	for _, rc := range studentMap {
		if rc.TotalCoeff > 0 {
			rc.Average = rc.TotalScore / rc.TotalCoeff
		}
		rc.Appreciation = getAppreciation(rc.Average)
		
		if rc.Average > highest { highest = rc.Average }
		if rc.Average < lowest { lowest = rc.Average }
		sumAvgs += rc.Average

		cards = append(cards, *rc)
	}

	classAvg := 0.0
	if len(cards) > 0 {
		classAvg = sumAvgs / float64(len(cards))
	}

	// Sort by average for ranking
	for i := 0; i < len(cards); i++ {
		rank := 1
		for j := 0; j < len(cards); j++ {
			if cards[j].Average > cards[i].Average {
				rank++
			}
		}
		cards[i].Rank = rank
		cards[i].ClassAverage = classAvg
		cards[i].HighestAverage = highest
		cards[i].LowestAverage = lowest
	}

	return cards, nil
}

func getStudentReportCard(w http.ResponseWriter, r *http.Request) {
	studentID := chi.URLParam(r, "id")
	termID := r.URL.Query().Get("term_id")
	classID := r.URL.Query().Get("class_id") // Needs class context

	cards, err := fetchClassReportCards("", classID, termID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, c := range cards {
		if c.StudentID == studentID {
			jsonResp(w, c)
			return
		}
	}
	http.Error(w, "Report card not found", http.StatusNotFound)
}

func getClassReportCards(w http.ResponseWriter, r *http.Request) {
	classID := chi.URLParam(r, "class_id")
	termID := r.URL.Query().Get("term_id")

	cards, err := fetchClassReportCards("", classID, termID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	jsonResp(w, cards)
}

func saveReportCardTemplate(w http.ResponseWriter, r *http.Request) {
	var tmpl ReportCardTemplate
	if err := json.NewDecoder(r.Body).Decode(&tmpl); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if tmpl.ID == "" {
		tmpl.ID = uuid.New().String()
	}

	if isOnline() {
		pgDB.Exec(`
			INSERT INTO report_card_templates (id, school_id, logo_url, motto, principal, passing_score)
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT (school_id)
			DO UPDATE SET logo_url=EXCLUDED.logo_url, motto=EXCLUDED.motto, principal=EXCLUDED.principal, passing_score=EXCLUDED.passing_score
		`, tmpl.ID, tmpl.SchoolID, tmpl.LogoURL, tmpl.Motto, tmpl.Principal, tmpl.PassingScore)
	} else {
		localDBMu.Lock()
		found := false
		for i, t := range localDB.Templates {
			if t.SchoolID == tmpl.SchoolID {
				localDB.Templates[i] = tmpl
				found = true
				break
			}
		}
		if !found {
			localDB.Templates = append(localDB.Templates, tmpl)
		}
		saveLocalDB()
		localDBMu.Unlock()
		enqueue("UPSERT_TEMPLATE", tmpl)
	}

	jsonResp(w, tmpl)
}
