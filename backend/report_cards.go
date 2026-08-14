package main

import (
	"encoding/json"
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
		rows, _ := pgDB.Query(`SELECT id, school_id, name, is_locked FROM sequences WHERE school_id=$1`, schoolID)
		defer rows.Close()
		for rows.Next() {
			var s Sequence
			rows.Scan(&s.ID, &s.SchoolID, &s.Name, &s.IsLocked)
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
