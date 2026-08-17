package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// =====================================================================
// SEQUENCE MANAGEMENT
// =====================================================================

func createSequence(w http.ResponseWriter, r *http.Request) {
	var seq Sequence
	if err := json.NewDecoder(r.Body).Decode(&seq); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if seq.ID == "" {
		seq.ID = uuid.New().String()
	}

	if isOnline() {
		pgDB.Exec(`
			INSERT INTO sequences (id, school_id, name, is_locked)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, is_locked=EXCLUDED.is_locked
		`, seq.ID, seq.SchoolID, seq.Name, seq.IsLocked)
	} else {
		localDBMu.Lock()
		found := false
		for i, s := range localDB.Sequences {
			if s.ID == seq.ID {
				localDB.Sequences[i] = seq
				found = true
				break
			}
		}
		if !found {
			localDB.Sequences = append(localDB.Sequences, seq)
		}
		saveLocalDB()
		localDBMu.Unlock()
		enqueue("UPSERT_SEQUENCE", seq)
	}
	jsonResp(w, seq)
}

func listSequences(w http.ResponseWriter, r *http.Request) {
	schoolID := r.URL.Query().Get("schoolId")
	var list []Sequence
	if isOnline() {
		rows, err := pgDB.Query(`SELECT id, school_id, name, is_locked FROM sequences WHERE school_id=$1`, schoolID)
		if err != nil || rows == nil {
			if err != nil {
				log.Printf("[Sequences] listSequences query failed: %v", err)
			}
			jsonResp(w, []Sequence{})
			return
		}
		defer rows.Close()
		for rows.Next() {
			var s Sequence
			if err := rows.Scan(&s.ID, &s.SchoolID, &s.Name, &s.IsLocked); err != nil {
				log.Printf("[Sequences] scan failed: %v", err)
				continue
			}
			list = append(list, s)
		}
	} else {
		localDBMu.RLock()
		defer localDBMu.RUnlock()
		for _, s := range localDB.Sequences {
			if s.SchoolID == schoolID {
				list = append(list, s)
			}
		}
	}
	jsonResp(w, list)
}

func lockSequence(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID       string `json:"id"`
		IsLocked bool   `json:"isLocked"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	if isOnline() {
		pgDB.Exec(`UPDATE sequences SET is_locked=$1 WHERE id=$2`, req.IsLocked, req.ID)
	} else {
		localDBMu.Lock()
		for i, s := range localDB.Sequences {
			if s.ID == req.ID {
				localDB.Sequences[i].IsLocked = req.IsLocked
				enqueue("UPSERT_SEQUENCE", localDB.Sequences[i])
				break
			}
		}
		saveLocalDB()
		localDBMu.Unlock()
	}
	jsonResp(w, map[string]interface{}{"message": "Sequence locked status updated"})
}

// =====================================================================
// MARK HANDLERS
// =====================================================================

type BulkMarkUploadRequest struct {
	SequenceID string `json:"sequenceId"`
	SubjectID  string `json:"subjectId"`
	ClassID    string `json:"classId"`
	SchoolID   string `json:"schoolId"`
	TeacherID  string `json:"teacherId"`
	Marks      []Mark `json:"marks"`
}

func bulkUploadMarks(w http.ResponseWriter, r *http.Request) {
	var req BulkMarkUploadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Validate Sequence Lock Status
	if isOnline() {
		var isLocked bool
		err := pgDB.QueryRow(`SELECT is_locked FROM sequences WHERE id=$1`, req.SequenceID).Scan(&isLocked)
		if err == nil && isLocked {
			http.Error(w, "Sequence is locked. Marks cannot be edited.", http.StatusForbidden)
			return
		}
	}

	now := time.Now().Format(time.RFC3339)
	for _, m := range req.Marks {
		if m.Score < 0 || m.Score > 20 {
			continue // skip invalid marks
		}
		
		markID := uuid.New().String()
		mark := Mark{
			ID:          markID,
			SchoolID:    req.SchoolID,
			StudentID:   m.StudentID,
			ClassID:     req.ClassID,
			SubjectID:   req.SubjectID,
			SequenceID:  req.SequenceID,
			Score:       m.Score,
			TeacherID:   req.TeacherID,
			DateEntered: now,
		}

		if isOnline() {
			pgDB.Exec(`
				INSERT INTO marks (id, school_id, student_id, class_id, subject_id, sequence_id, score, teacher_id, date_entered) 
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
				ON CONFLICT (student_id, subject_id, sequence_id) 
				DO UPDATE SET score = EXCLUDED.score, teacher_id = EXCLUDED.teacher_id, date_entered = EXCLUDED.date_entered
			`, mark.ID, mark.SchoolID, mark.StudentID, mark.ClassID, mark.SubjectID, mark.SequenceID, mark.Score, mark.TeacherID, mark.DateEntered)
		} else {
			localDBMu.Lock()
			found := false
			for i, lm := range localDB.Marks {
				if lm.SequenceID == mark.SequenceID && lm.SubjectID == mark.SubjectID && lm.StudentID == mark.StudentID {
					localDB.Marks[i].Score = mark.Score
					localDB.Marks[i].TeacherID = mark.TeacherID
					localDB.Marks[i].DateEntered = mark.DateEntered
					mark = localDB.Marks[i]
					found = true
					break
				}
			}
			if !found {
				localDB.Marks = append(localDB.Marks, mark)
			}
			saveLocalDB()
			localDBMu.Unlock()
			enqueue("UPSERT_MARK", mark)
		}
	}

	jsonResp(w, map[string]interface{}{"message": "Marks uploaded successfully"})
}

// Keep the old grade upload for backward compatibility if needed, or return not implemented.
func bulkUploadGrades(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "Deprecated. Use /api/marks/bulk", http.StatusBadRequest)
}

// =====================================================================
// REPORT CARD HANDLERS (Cameroon System)
// =====================================================================

func getCameroonGrade(avg float64) (string, string) {
	if avg >= 18 { return "Excellent", "Excellent work, keep it up." }
	if avg >= 16 { return "Very Good", "Excellent work, keep it up." }
	if avg >= 14 { return "Good", "Very satisfactory performance." }
	if avg >= 12 { return "Fairly Good", "Good effort, continue working." }
	if avg >= 10 { return "Average", "Satisfactory, improvement needed." }
	if avg >= 8 { return "Weak", "Unsatisfactory, requires serious improvement." }
	return "Poor", "Unsatisfactory, requires serious improvement."
}

type SubjectResult struct {
	SubjectName string  `json:"subjectName"`
	TeacherName string  `json:"teacherName"`
	Coefficient float64 `json:"coefficient"`
	Seq1Mark    float64 `json:"seq1Mark"`
	Seq2Mark    float64 `json:"seq2Mark"`
	TermAverage float64 `json:"termAverage"`
	WeightedScore float64 `json:"weightedScore"`
	SubjectRank int     `json:"subjectRank"`
	SubjectAvg  float64 `json:"subjectAvg"`
	Grade       string  `json:"grade"`
	Remark      string  `json:"remark"`
}

type CameroonReportCard struct {
	StudentID       string          `json:"studentId"`
	StudentName     string          `json:"studentName"`
	Gender          string          `json:"gender"`
	Subjects        []SubjectResult `json:"subjects"`
	TotalScore      float64         `json:"totalScore"`
	TotalCoeff      float64         `json:"totalCoeff"`
	Average         float64         `json:"average"`
	Rank            int             `json:"rank"`
	ClassAverage    float64         `json:"classAverage"`
	HighestAverage  float64         `json:"highestAverage"`
	LowestAverage   float64         `json:"lowestAverage"`
	PromotionStatus string          `json:"promotionStatus"`
	PrincipalRemark string          `json:"principalRemark"`
	Term            string          `json:"term"`
}

func fetchCameroonReportCards(schoolID, classID, termID string) ([]CameroonReportCard, error) {
	if !isOnline() {
		return []CameroonReportCard{}, nil
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

	// 2. Fetch marks for this class
	markRows, err := pgDB.Query(`
		SELECT m.student_id, u.name, m.subject_id, s.name as seq_name, m.score, t.name as teacher_name
		FROM marks m
		JOIN users u ON m.student_id = u.id
		JOIN sequences s ON m.sequence_id = s.id
		LEFT JOIN users t ON m.teacher_id = t.id
		WHERE m.class_id=$1
	`, classID)
	if err != nil { return nil, err }
	defer markRows.Close()

	type MarkEntry struct { score float64; teacher string }
	data := make(map[string]map[string]map[string]MarkEntry)
	studentNames := make(map[string]string)

	for markRows.Next() {
		var sID, sName, subjID, seqName, tName string
		var score float64
		markRows.Scan(&sID, &sName, &subjID, &seqName, &score, &tName)
		studentNames[sID] = sName

		if data[sID] == nil { data[sID] = make(map[string]map[string]MarkEntry) }
		if data[sID][subjID] == nil { data[sID][subjID] = make(map[string]MarkEntry) }
		data[sID][subjID][seqName] = MarkEntry{score: score, teacher: tName}
	}

	var cards []CameroonReportCard
	var highest = 0.0
	var lowest = 20.0
	var sumAvgs = 0.0

	subjTotals := make(map[string]float64)
	subjCounts := make(map[string]int)

	for sID, name := range studentNames {
		rc := CameroonReportCard{StudentID: sID, StudentName: name, Term: termID, Subjects: []SubjectResult{}}
		
		for _, subj := range subjects {
			marks := data[sID][subj.id]
			if marks == nil { continue }
			
			var termAvg float64
			var teacher string
			
			// Simplified term logic for testing, maps T1 to First & Second Sequences, etc.
			if termID == "T1" {
				m1, ok1 := marks["First Sequence"]
				m2, ok2 := marks["Second Sequence"]
				if ok1 && ok2 { termAvg = (m1.score + m2.score) / 2; teacher = m1.teacher } else if ok1 { termAvg = m1.score; teacher = m1.teacher } else if ok2 { termAvg = m2.score; teacher = m2.teacher }
			} else if termID == "T2" {
				m1, ok1 := marks["Third Sequence"]
				m2, ok2 := marks["Fourth Sequence"]
				if ok1 && ok2 { termAvg = (m1.score + m2.score) / 2; teacher = m1.teacher } else if ok1 { termAvg = m1.score; teacher = m1.teacher } else if ok2 { termAvg = m2.score; teacher = m2.teacher }
			} else if termID == "Annual" {
				m1, ok1 := marks["First Sequence"]
				m2, ok2 := marks["Second Sequence"]
				m3, ok3 := marks["Third Sequence"]
				m4, ok4 := marks["Fourth Sequence"]
				ex, okEx := marks["Examination"]
				
				t1 := 0.0
				if ok1 && ok2 { t1 = (m1.score + m2.score) / 2 } else if ok1 { t1 = m1.score } else if ok2 { t1 = m2.score }
				t2 := 0.0
				if ok3 && ok4 { t2 = (m3.score + m4.score) / 2 } else if ok3 { t2 = m3.score } else if ok4 { t2 = m4.score }
				
				if okEx {
					termAvg = (t1 + t2 + ex.score) / 3
				} else {
					termAvg = (t1 + t2) / 2 // Fallback if no exam
				}
				teacher = ex.teacher
			} else {
				sum, count := 0.0, 0.0
				for _, m := range marks { sum += m.score; count++; teacher = m.teacher }
				if count > 0 { termAvg = sum / count }
			}

			if teacher == "" { teacher = "Unknown" }

			ws := termAvg * subj.coeff
			grade, remark := getCameroonGrade(termAvg)

			sr := SubjectResult{
				SubjectName: subj.name,
				TeacherName: teacher,
				Coefficient: subj.coeff,
				TermAverage: termAvg,
				WeightedScore: ws,
				Grade: grade,
				Remark: remark,
			}
			
			if termID == "T1" || termID == "Annual" {
				if m, ok := marks["First Sequence"]; ok { sr.Seq1Mark = m.score }
				if m, ok := marks["Second Sequence"]; ok { sr.Seq2Mark = m.score }
			} else if termID == "T2" {
				if m, ok := marks["Third Sequence"]; ok { sr.Seq1Mark = m.score }
				if m, ok := marks["Fourth Sequence"]; ok { sr.Seq2Mark = m.score }
			}

			rc.Subjects = append(rc.Subjects, sr)
			rc.TotalScore += ws
			rc.TotalCoeff += subj.coeff

			subjTotals[subj.id] += termAvg
			subjCounts[subj.id]++
		}

		if rc.TotalCoeff > 0 {
			rc.Average = rc.TotalScore / rc.TotalCoeff
		}
		
		if rc.Average > highest { highest = rc.Average }
		if rc.Average < lowest { lowest = rc.Average }
		sumAvgs += rc.Average

		if rc.Average >= 10 {
			rc.PromotionStatus = "Promoted"
		} else {
			rc.PromotionStatus = "Not Promoted"
		}
		
		_, pRemark := getCameroonGrade(rc.Average)
		rc.PrincipalRemark = pRemark

		cards = append(cards, rc)
	}

	classAvg := 0.0
	if len(cards) > 0 {
		classAvg = sumAvgs / float64(len(cards))
	}

	// Calculate Ranks
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
		
		for k, sub := range cards[i].Subjects {
			var subID string
			for _, s := range subjects { if s.name == sub.SubjectName { subID = s.id; break } }
			if counts := subjCounts[subID]; counts > 0 {
				cards[i].Subjects[k].SubjectAvg = subjTotals[subID] / float64(counts)
			}
			
			sRank := 1
			for _, c2 := range cards {
				for _, sub2 := range c2.Subjects {
					if sub2.SubjectName == sub.SubjectName && sub2.TermAverage > sub.TermAverage {
						sRank++
					}
				}
			}
			cards[i].Subjects[k].SubjectRank = sRank
		}
	}

	return cards, nil
}

func getStudentReportCard(w http.ResponseWriter, r *http.Request) {
	studentID := chi.URLParam(r, "id")
	termID := r.URL.Query().Get("term_id")
	classID := r.URL.Query().Get("class_id")

	cards, err := fetchCameroonReportCards("", classID, termID)
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

	cards, err := fetchCameroonReportCards("", classID, termID)
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

// =====================================================================
// MARK ENTRY — MULTI-SEQUENCE
// =====================================================================

type MarkEntryRow struct {
	ID           string   `json:"id"`
	SchoolID     string   `json:"schoolId"`
	TeacherID    string   `json:"teacherId"`
	SubjectID    string   `json:"subjectId"`
	ClassID      string   `json:"classId"`
	AcademicYear string   `json:"academicYear"`
	Term         int      `json:"term"`
	StudentID    string   `json:"studentId"`
	StudentName  string   `json:"studentName"`
	Sequence1    *float64 `json:"sequence1"`
	Sequence2    *float64 `json:"sequence2"`
	Sequence3    *float64 `json:"sequence3"`
	Sequence4    *float64 `json:"sequence4"`
	Exam         *float64 `json:"exam"`
	CreatedAt    string   `json:"createdAt"`
	UpdatedAt    string   `json:"updatedAt"`
}

// saveMarksBatch upserts multi-sequence marks for a class/subject/term
func saveMarksBatch(w http.ResponseWriter, r *http.Request) {
	type BatchReq struct {
		SchoolID     string         `json:"schoolId"`
		TeacherID    string         `json:"teacherId"`
		SubjectID    string         `json:"subjectId"`
		ClassID      string         `json:"classId"`
		AcademicYear string         `json:"academicYear"`
		Term         int            `json:"term"`
		Coefficient  float64        `json:"coefficient"`
		Marks        []MarkEntryRow `json:"marks"`
	}
	var req BatchReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if !isOnline() {
		http.Error(w, "Database offline", http.StatusServiceUnavailable)
		return
	}
	if req.Term == 0 { req.Term = 1 }
	if req.Coefficient <= 0 { req.Coefficient = 1.0 }

	// Upsert into course_subjects so the coefficient is recorded
	if req.ClassID != "" && req.SubjectID != "" {
		subjID := uuid.New().String()
		pgDB.Exec(`INSERT INTO course_subjects (id, school_id, class_id, name, coefficient, teacher_id)
			VALUES($1, $2, $3, $4, $5, $6)
			ON CONFLICT (id) DO UPDATE SET coefficient=EXCLUDED.coefficient, teacher_id=EXCLUDED.teacher_id`,
			subjID, req.SchoolID, req.ClassID, req.SubjectID, req.Coefficient, req.TeacherID)
		pgDB.Exec(`UPDATE course_subjects SET coefficient=$1, teacher_id=$2 WHERE class_id=$3 AND (id=$4 OR name=$4)`,
			req.Coefficient, req.TeacherID, req.ClassID, req.SubjectID)
	}

	saved := 0
	now := time.Now().Format(time.RFC3339)
	for _, m := range req.Marks {
		if m.StudentID == "" { continue }
		id := uuid.New().String()
		_, err := pgDB.Exec(`INSERT INTO marks_entry
			(id, school_id, teacher_id, subject_id, class_id, academic_year, term, student_id,
			 sequence1, sequence2, sequence3, sequence4, exam, coefficient, created_at, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)
			ON CONFLICT(student_id, subject_id, class_id, term, academic_year)
			DO UPDATE SET
				sequence1=EXCLUDED.sequence1,
				sequence2=EXCLUDED.sequence2,
				sequence3=EXCLUDED.sequence3,
				sequence4=EXCLUDED.sequence4,
				exam=EXCLUDED.exam,
				coefficient=EXCLUDED.coefficient,
				teacher_id=EXCLUDED.teacher_id,
				updated_at=EXCLUDED.updated_at`,
			id, req.SchoolID, req.TeacherID, req.SubjectID, req.ClassID,
			req.AcademicYear, req.Term, m.StudentID,
			m.Sequence1, m.Sequence2, m.Sequence3, m.Sequence4, m.Exam, req.Coefficient, now)
		if err == nil { saved++ }
	}
	jsonResp(w, map[string]interface{}{"saved": saved, "coefficient": req.Coefficient, "message": fmt.Sprintf("%d marks saved with coefficient %.1f", saved, req.Coefficient)})
}

// getTeacherMarks fetches saved marks for a teacher's class/subject/term
func getTeacherMarks(w http.ResponseWriter, r *http.Request) {
	schoolID := r.URL.Query().Get("schoolId")
	teacherID := r.URL.Query().Get("teacherId")
	classID := r.URL.Query().Get("classId")
	subjectID := r.URL.Query().Get("subjectId")
	academicYear := r.URL.Query().Get("academicYear")
	termStr := r.URL.Query().Get("term")
	term := 1
	if termStr != "" { fmt.Sscanf(termStr, "%d", &term) }
	if !isOnline() { jsonResp(w, []MarkEntryRow{}); return }

	// Check if subject coefficient exists in course_subjects
	var coeff float64 = 1.0
	pgDB.QueryRow(`SELECT COALESCE(coefficient, 1.0) FROM course_subjects WHERE class_id=$1 AND (id=$2 OR name=$2)`, classID, subjectID).Scan(&coeff)

	rows, err := pgDB.Query(`
		SELECT me.id, me.school_id, COALESCE(me.teacher_id,''), me.subject_id, me.class_id,
		       me.academic_year, me.term, me.student_id, COALESCE(u.name,''),
		       me.sequence1, me.sequence2, me.sequence3, me.sequence4, me.exam,
		       COALESCE(me.coefficient, 1.0), me.created_at, me.updated_at
		FROM marks_entry me
		LEFT JOIN users u ON me.student_id = u.id
		WHERE me.school_id=$1 AND me.class_id=$2 AND me.subject_id=$3 AND me.term=$4
		AND ($5='' OR me.academic_year=$5)
		AND ($6='' OR me.teacher_id=$6)
		ORDER BY u.name ASC`,
		schoolID, classID, subjectID, term, academicYear, teacherID)
	if err != nil { jsonResp(w, map[string]interface{}{"marks": []MarkEntryRow{}, "coefficient": coeff}); return }
	defer rows.Close()
	var result []MarkEntryRow
	for rows.Next() {
		var m MarkEntryRow
		var c float64
		rows.Scan(&m.ID, &m.SchoolID, &m.TeacherID, &m.SubjectID, &m.ClassID,
			&m.AcademicYear, &m.Term, &m.StudentID, &m.StudentName,
			&m.Sequence1, &m.Sequence2, &m.Sequence3, &m.Sequence4, &m.Exam,
			&c, &m.CreatedAt, &m.UpdatedAt)
		if c > 0 { coeff = c }
		result = append(result, m)
	}
	if result == nil { result = []MarkEntryRow{} }
	jsonResp(w, map[string]interface{}{"marks": result, "coefficient": coeff})
}

// getClassMarks fetches all marks for a class & term
func getClassMarks(w http.ResponseWriter, r *http.Request) {
	classID := chi.URLParam(r, "classId")
	termStr := chi.URLParam(r, "term")
	term := 1
	if termStr != "" { fmt.Sscanf(termStr, "%d", &term) }
	schoolID := r.URL.Query().Get("schoolId")
	academicYear := r.URL.Query().Get("academicYear")
	if !isOnline() { jsonResp(w, []MarkEntryRow{}); return }
	rows, err := pgDB.Query(`
		SELECT me.id, me.school_id, COALESCE(me.teacher_id,''), me.subject_id, me.class_id,
		       me.academic_year, me.term, me.student_id, COALESCE(u.name,''),
		       me.sequence1, me.sequence2, me.sequence3, me.sequence4, me.exam,
		       me.created_at, me.updated_at
		FROM marks_entry me
		LEFT JOIN users u ON me.student_id = u.id
		WHERE me.class_id=$1 AND me.term=$2
		AND ($3='' OR me.school_id=$3)
		AND ($4='' OR me.academic_year=$4)
		ORDER BY u.name ASC`,
		classID, term, schoolID, academicYear)
	if err != nil { jsonResp(w, []MarkEntryRow{}); return }
	defer rows.Close()
	var result []MarkEntryRow
	for rows.Next() {
		var m MarkEntryRow
		rows.Scan(&m.ID, &m.SchoolID, &m.TeacherID, &m.SubjectID, &m.ClassID, &m.AcademicYear,
			&m.Term, &m.StudentID, &m.StudentName,
			&m.Sequence1, &m.Sequence2, &m.Sequence3, &m.Sequence4, &m.Exam,
			&m.CreatedAt, &m.UpdatedAt)
		result = append(result, m)
	}
	if result == nil { result = []MarkEntryRow{} }
	jsonResp(w, result)
}

// =====================================================================
// REPORT CARDS — GENERATE, PUBLISH, LIST
// =====================================================================

type ReportCardFull struct {
	ID              string               `json:"id"`
	SchoolID        string               `json:"schoolId"`
	StudentID       string               `json:"studentId"`
	StudentName     string               `json:"studentName"`
	ClassID         string               `json:"classId"`
	ClassName       string               `json:"className"`
	AcademicYear    string               `json:"academicYear"`
	Term            int                  `json:"term"`
	Subjects        []ReportSubjectEntry `json:"subjects"`
	TotalScore      float64              `json:"totalScore"`
	TotalCoeff      float64              `json:"totalCoeff"`
	TermAverage     float64              `json:"termAverage"`
	ClassAverage    float64              `json:"classAverage"`
	HighestAverage  float64              `json:"highestAverage"`
	LowestAverage   float64              `json:"lowestAverage"`
	PassMark        float64              `json:"passMark"`
	PromotionStatus string               `json:"promotionStatus"`
	PrincipalRemark string               `json:"principalRemark"`
	Rank            int                  `json:"rank"`
	TotalStudents   int                  `json:"totalStudents"`
	Status          string               `json:"status"`
	GeneratedAt     string               `json:"generatedAt"`
	PublishedAt     *string              `json:"publishedAt"`
}

type ReportSubjectEntry struct {
	SubjectID   string   `json:"subjectId"`
	SubjectName string   `json:"subjectName"`
	Coefficient float64  `json:"coefficient"`
	Sequence1   *float64 `json:"sequence1"`
	Sequence2   *float64 `json:"sequence2"`
	Sequence3   *float64 `json:"sequence3"`
	Sequence4   *float64 `json:"sequence4"`
	Exam        *float64 `json:"exam"`
	SeqAvg      float64  `json:"seqAvg"`
	SubjectAvg  float64  `json:"subjectAvg"`
	HasMarks    bool     `json:"hasMarks"`
}

func buildReportCardsForTerm(classID, schoolID, academicYear string, term int) []ReportCardFull {
	if !isOnline() { return []ReportCardFull{} }
	type StudentRow struct{ ID, Name string }
	var students []StudentRow
	rows, err := pgDB.Query(`
		SELECT u.id, u.name FROM enrollments e
		JOIN users u ON e.student_id=u.id
		WHERE e.class_id=$1 ORDER BY u.name ASC`, classID)
	if err != nil { return []ReportCardFull{} }
	defer rows.Close()
	for rows.Next() {
		var s StudentRow; rows.Scan(&s.ID, &s.Name); students = append(students, s)
	}
	if len(students) == 0 { return []ReportCardFull{} }
	className := ""
	passMark := 10.0
	pgDB.QueryRow(`SELECT COALESCE(name,''), COALESCE(pass_mark, 10.0) FROM classes WHERE id=$1`, classID).Scan(&className, &passMark)
	if passMark <= 0 { passMark = 10.0 }

	type SubjectCoef struct{ ID, Name string; Coef float64 }
	var subjects []SubjectCoef
	subRows, err := pgDB.Query(`SELECT id, name, coefficient FROM course_subjects WHERE class_id=$1`, classID)
	if err != nil || subRows == nil {
		if err != nil {
			log.Printf("[ReportCards] subject query failed: %v", err)
		}
	} else {
		defer subRows.Close()
		for subRows.Next() {
			var s SubjectCoef
			if scanErr := subRows.Scan(&s.ID, &s.Name, &s.Coef); scanErr != nil {
				log.Printf("[ReportCards] subject scan failed: %v", scanErr)
				continue
			}
			subjects = append(subjects, s)
		}
	}

	type EntryRow struct {
		StudentID string
		SubjectID string
		Coefficient *float64
		Seq1, Seq2, Seq3, Seq4, Exam *float64
	}
	marksMap := map[string]map[string]EntryRow{}
	mRows, err := pgDB.Query(`
		SELECT student_id, subject_id, sequence1, sequence2, sequence3, sequence4, exam, coefficient
		FROM marks_entry
		WHERE class_id=$1 AND term=$2
		AND ($3='' OR school_id=$3)
		AND ($4='' OR academic_year=$4)`,
		classID, term, schoolID, academicYear)
	if err != nil || mRows == nil {
		if err != nil {
			log.Printf("[ReportCards] marks query failed: %v", err)
		}
	} else {
		defer mRows.Close()
		for mRows.Next() {
			var e EntryRow
			if scanErr := mRows.Scan(&e.StudentID, &e.SubjectID, &e.Seq1, &e.Seq2, &e.Seq3, &e.Seq4, &e.Exam, &e.Coefficient); scanErr != nil {
				log.Printf("[ReportCards] marks scan failed: %v", scanErr)
				continue
			}
			if marksMap[e.StudentID] == nil { marksMap[e.StudentID] = map[string]EntryRow{} }
			marksMap[e.StudentID][e.SubjectID] = e
		}
	}

	if len(subjects) == 0 {
		subjectSet := map[string]float64{}
		for _, subjMap := range marksMap {
			for subj, entry := range subjMap {
				coef := 1.0
				if entry.Coefficient != nil && *entry.Coefficient > 0 { coef = *entry.Coefficient }
				subjectSet[subj] = coef
			}
		}
		for s, c := range subjectSet {
			subjects = append(subjects, SubjectCoef{ID: s, Name: s, Coef: c})
		}
	}

	var cards []ReportCardFull
	for _, stu := range students {
		var subjectRows []ReportSubjectEntry
		totalWeightedSum := 0.0
		totalCoef := 0.0
		for _, subj := range subjects {
			entry, exists := marksMap[stu.ID][subj.ID]
			if !exists { entry, exists = marksMap[stu.ID][subj.Name] }
			coef := subj.Coef
			if exists && entry.Coefficient != nil && *entry.Coefficient > 0 {
				coef = *entry.Coefficient
			}
			if coef <= 0 { coef = 1.0 }
			var seqAvg, subjectAvg float64
			seqCount := 0; seqSum := 0.0
			if exists {
				if entry.Seq1 != nil { seqSum += *entry.Seq1; seqCount++ }
				if entry.Seq2 != nil { seqSum += *entry.Seq2; seqCount++ }
				if entry.Seq3 != nil { seqSum += *entry.Seq3; seqCount++ }
				if entry.Seq4 != nil { seqSum += *entry.Seq4; seqCount++ }
				if seqCount > 0 { seqAvg = seqSum / float64(seqCount) }
				if entry.Exam != nil {
					subjectAvg = seqAvg*0.6 + (*entry.Exam)*0.4
				} else { subjectAvg = seqAvg }
				subjectAvg = math.Round(subjectAvg*100) / 100
				totalWeightedSum += subjectAvg * coef
				totalCoef += coef
			}
			row := ReportSubjectEntry{
				SubjectID: subj.ID, SubjectName: subj.Name, Coefficient: coef,
				SeqAvg: math.Round(seqAvg*100) / 100, SubjectAvg: subjectAvg, HasMarks: exists,
			}
			if exists {
				row.Sequence1 = entry.Seq1; row.Sequence2 = entry.Seq2
				row.Sequence3 = entry.Seq3; row.Sequence4 = entry.Seq4; row.Exam = entry.Exam
			}
			subjectRows = append(subjectRows, row)
		}
		termAvg := 0.0
		if totalCoef > 0 { termAvg = math.Round((totalWeightedSum/totalCoef)*100) / 100 }
		
		promotionStatus := "Not Promoted"
		if termAvg >= passMark {
			promotionStatus = "Promoted"
		}
		remark := "Satisfactory"
		if termAvg >= 16 { remark = "Excellent work, keep it up." } else if termAvg >= 14 { remark = "Very good performance." } else if termAvg >= 12 { remark = "Good effort, continue working." } else if termAvg >= passMark { remark = "Satisfactory performance." } else { remark = "Unsatisfactory, requires serious improvement." }

		cards = append(cards, ReportCardFull{
			SchoolID: schoolID, StudentID: stu.ID, StudentName: stu.Name,
			ClassID: classID, ClassName: className,
			AcademicYear: academicYear, Term: term,
			Subjects: subjectRows,
			TotalScore: math.Round(totalWeightedSum*100) / 100,
			TotalCoeff: totalCoef,
			TermAverage: termAvg,
			PassMark: passMark,
			PromotionStatus: promotionStatus,
			PrincipalRemark: remark,
			Status: "draft", GeneratedAt: time.Now().Format(time.RFC3339),
		})
	}
	totalClassAvg := 0.0
	highestAvg := 0.0
	lowestAvg := 20.0
	for _, c := range cards {
		totalClassAvg += c.TermAverage
		if c.TermAverage > highestAvg { highestAvg = c.TermAverage }
		if c.TermAverage < lowestAvg { lowestAvg = c.TermAverage }
	}
	classAvg := 0.0
	if len(cards) > 0 { classAvg = math.Round((totalClassAvg/float64(len(cards)))*100) / 100 }
	for i := range cards {
		cards[i].ClassAverage = classAvg
		cards[i].HighestAverage = highestAvg
		cards[i].LowestAverage = lowestAvg
		cards[i].TotalStudents = len(cards)
		rank := 1
		for j := range cards {
			if j != i && cards[j].TermAverage > cards[i].TermAverage { rank++ }
		}
		cards[i].Rank = rank
	}
	return cards
}

func storeReportCards(cards []ReportCardFull, adminID string) {
	if !isOnline() { return }
	for _, card := range cards {
		id := uuid.New().String()
		dataBytes, _ := json.Marshal(card)
		pgDB.Exec(`INSERT INTO report_cards
			(id, school_id, student_id, class_id, academic_year, term, term_average, class_average,
			 rank, status, data_json, generated_at, generated_by_admin_id)
			VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10,NOW(),$11)
			ON CONFLICT(student_id, class_id, term, academic_year)
			DO UPDATE SET term_average=EXCLUDED.term_average, class_average=EXCLUDED.class_average,
			rank=EXCLUDED.rank, data_json=EXCLUDED.data_json, generated_at=NOW(),
			generated_by_admin_id=EXCLUDED.generated_by_admin_id`,
			id, card.SchoolID, card.StudentID, card.ClassID, card.AcademicYear, card.Term,
			card.TermAverage, card.ClassAverage, card.Rank, string(dataBytes), adminID)
	}
}

func generateSingleReportCard(w http.ResponseWriter, r *http.Request) {
	type Req struct {
		SchoolID     string `json:"schoolId"`
		StudentID    string `json:"studentId"`
		ClassID      string `json:"classId"`
		AcademicYear string `json:"academicYear"`
		Term         int    `json:"term"`
		AdminID      string `json:"adminId"`
	}
	var req Req
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest); return
	}
	if req.Term == 0 { req.Term = 1 }
	cards := buildReportCardsForTerm(req.ClassID, req.SchoolID, req.AcademicYear, req.Term)
	for _, card := range cards {
		if card.StudentID == req.StudentID {
			storeReportCards([]ReportCardFull{card}, req.AdminID)
			jsonResp(w, card); return
		}
	}
	http.Error(w, "Student not found", http.StatusNotFound)
}

func generateBulkReportCards(w http.ResponseWriter, r *http.Request) {
	type Req struct {
		SchoolID     string `json:"schoolId"`
		ClassID      string `json:"classId"`
		AcademicYear string `json:"academicYear"`
		Term         int    `json:"term"`
		AdminID      string `json:"adminId"`
	}
	var req Req
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest); return
	}
	if req.Term == 0 { req.Term = 1 }
	cards := buildReportCardsForTerm(req.ClassID, req.SchoolID, req.AcademicYear, req.Term)
	storeReportCards(cards, req.AdminID)
	jsonResp(w, map[string]interface{}{"generated": len(cards), "cards": cards})
}

func publishReportCard(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if !isOnline() { http.Error(w, "offline", http.StatusServiceUnavailable); return }
	now := time.Now().Format(time.RFC3339)
	_, err := pgDB.Exec(`UPDATE report_cards SET status='published', published_at=$1 WHERE id=$2`, now, id)
	if err != nil { http.Error(w, err.Error(), http.StatusInternalServerError); return }
	jsonResp(w, map[string]string{"status": "published", "id": id})
}

func listReportCards(w http.ResponseWriter, r *http.Request) {
	classID := r.URL.Query().Get("classId")
	schoolID := r.URL.Query().Get("schoolId")
	academicYear := r.URL.Query().Get("academicYear")
	termStr := r.URL.Query().Get("term")
	term := 0
	if termStr != "" { fmt.Sscanf(termStr, "%d", &term) }
	if !isOnline() { jsonResp(w, []map[string]interface{}{}); return }
	rows, err := pgDB.Query(`
		SELECT rc.id, rc.student_id, COALESCE(u.name,''), rc.class_id, rc.academic_year, rc.term,
		       rc.term_average, rc.class_average, rc.rank, rc.status,
		       rc.generated_at, rc.published_at, rc.data_json
		FROM report_cards rc
		LEFT JOIN users u ON rc.student_id = u.id
		WHERE ($1='' OR rc.class_id=$1)
		AND ($2='' OR rc.school_id=$2)
		AND ($3='' OR rc.academic_year=$3)
		AND ($4=0 OR rc.term=$4)
		ORDER BY rc.rank ASC`, classID, schoolID, academicYear, term)
	if err != nil { jsonResp(w, []map[string]interface{}{}); return }
	defer rows.Close()
	var result []map[string]interface{}
	for rows.Next() {
		var id, studentID, studentName, clsID, acYear, status, generatedAt, dataJson string
		var rcTerm, rank int
		var termAvg, classAvg float64
		var publishedAt *string
		rows.Scan(&id, &studentID, &studentName, &clsID, &acYear, &rcTerm,
			&termAvg, &classAvg, &rank, &status, &generatedAt, &publishedAt, &dataJson)
		
		var fullCard ReportCardFull
		json.Unmarshal([]byte(dataJson), &fullCard)
			
		result = append(result, map[string]interface{}{
			"id": id, "studentId": studentID, "studentName": studentName,
			"classId": clsID, "academicYear": acYear, "term": rcTerm,
			"termAverage": termAvg, "classAverage": classAvg, "rank": rank,
			"status": status, "generatedAt": generatedAt, "publishedAt": publishedAt,
			"data": fullCard,
		})
	}
	if result == nil { result = []map[string]interface{}{} }
	jsonResp(w, result)
}

