package main

import (
    "bytes"
    "fmt"
    "net/http"
    "github.com/jung-kurt/gofpdf"
    "github.com/go-chi/chi/v5"
)

// generatePDF creates a PDF document for one or more ReportCardFull structs.
// It returns the PDF as a byte slice.
func generatePDF(cards []ReportCardFull) ([]byte, error) {
    pdf := gofpdf.New("P", "mm", "A4", "")
    pdf.SetMargins(15, 15, 15)
    pdf.SetFont("Arial", "", 12)

    for _, card := range cards {
        pdf.AddPage()
        // Header
        pdf.SetFontSize(18)
        pdf.CellFormat(0, 10, fmt.Sprintf("%s Report Card", card.SchoolID), "", 1, "C", false, 0, "")
        pdf.Ln(5)

        // Student Info
        pdf.SetFontSize(12)
        pdf.CellFormat(0, 8, fmt.Sprintf("Student: %s (ID: %s)", card.StudentName, card.StudentID), "", 1, "L", false, 0, "")
        pdf.CellFormat(0, 8, fmt.Sprintf("Class: %s   Term: %d   Year: %s", card.ClassName, card.Term, card.AcademicYear), "", 1, "L", false, 0, "")
        pdf.Ln(3)

        // Table Header
        pdf.SetFillColor(240, 240, 250) // pastel header background
        pdf.CellFormat(30, 8, "Subject", "1", 0, "C", true, 0, "")
        pdf.CellFormat(30, 8, "Teacher", "1", 0, "C", true, 0, "")
        pdf.CellFormat(15, 8, "Coef", "1", 0, "C", true, 0, "")
        pdf.CellFormat(15, 8, "Seq1", "1", 0, "C", true, 0, "")
        pdf.CellFormat(15, 8, "Seq2", "1", 0, "C", true, 0, "")
        pdf.CellFormat(15, 8, "Term Avg", "1", 0, "C", true, 0, "")
        pdf.CellFormat(20, 8, "Weighted", "1", 0, "C", true, 0, "")
        pdf.CellFormat(15, 8, "Grade", "1", 0, "C", true, 0, "")
        pdf.CellFormat(30, 8, "Remark", "1", 1, "C", true, 0, "")

        // Table Rows
        pdf.SetFontSize(11)
        for _, sub := range card.Subjects {
            seq1 := ""
            if sub.Sequence1 != nil { seq1 = fmt.Sprintf("%.1f", *sub.Sequence1) }
            seq2 := ""
            if sub.Sequence2 != nil { seq2 = fmt.Sprintf("%.1f", *sub.Sequence2) }
            
            pdf.CellFormat(30, 8, sub.SubjectName, "1", 0, "L", false, 0, "")
            pdf.CellFormat(30, 8, "", "1", 0, "L", false, 0, "")
            pdf.CellFormat(15, 8, fmt.Sprintf("%.1f", sub.Coefficient), "1", 0, "C", false, 0, "")
            pdf.CellFormat(15, 8, seq1, "1", 0, "C", false, 0, "")
            pdf.CellFormat(15, 8, seq2, "1", 0, "C", false, 0, "")
            pdf.CellFormat(15, 8, fmt.Sprintf("%.2f", sub.SubjectAvg), "1", 0, "C", false, 0, "")
            pdf.CellFormat(20, 8, fmt.Sprintf("%.2f", sub.SubjectAvg * sub.Coefficient), "1", 0, "C", false, 0, "")
            pdf.CellFormat(20, 8, "", "1", 0, "C", false, 0, "")
            pdf.CellFormat(30, 8, "", "1", 1, "L", false, 0, "")
        }
        pdf.Ln(3)
        // Summary
        promotionStatus := "Not Promoted"
        if card.TermAverage >= 10 {
            promotionStatus = "Promoted"
        }
        pdf.CellFormat(0, 8, fmt.Sprintf("Average: %.2f   Rank: %d   Promotion: %s", card.TermAverage, card.Rank, promotionStatus), "", 1, "L", false, 0, "")
        pdf.CellFormat(0, 8, fmt.Sprintf("Principal's Remark: %s", ""), "", 1, "L", false, 0, "")
    }

    var buf bytes.Buffer
    err := pdf.Output(&buf)
    if err != nil {
        return nil, err
    }
    return buf.Bytes(), nil
}

// getStudentReportPDF handles PDF download for a single student.
func getStudentReportPDF(w http.ResponseWriter, r *http.Request) {
    studentID := chi.URLParam(r, "id")
    termStr := r.URL.Query().Get("term_id")
    classID := r.URL.Query().Get("class_id")
    term := 1
    fmt.Sscanf(termStr, "%d", &term)

    // Fetch the single report card
    cards := buildReportCardsForTerm(classID, "", "", term)
    var target *ReportCardFull
    for _, c := range cards {
        if c.StudentID == studentID {
            target = &c
            break
        }
    }
    if target == nil {
        http.Error(w, "Report card not found", http.StatusNotFound)
        return
    }
    pdfBytes, err := generatePDF([]ReportCardFull{*target})
    if err != nil {
        http.Error(w, "Failed to generate PDF", http.StatusInternalServerError)
        return
    }
    // Email notification (stub – can be wired later)
    go sendReportCardEmail(studentID, pdfBytes)

    w.Header().Set("Content-Type", "application/pdf")
    w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=report_%s.pdf", studentID))
    w.Write(pdfBytes)
}

// getClassReportPDF generates a multi‑page PDF for all students in a class.
func getClassReportPDF(w http.ResponseWriter, r *http.Request) {
    classID := chi.URLParam(r, "class_id")
    termStr := r.URL.Query().Get("term_id")
    term := 1
    fmt.Sscanf(termStr, "%d", &term)

    cards := buildReportCardsForTerm(classID, "", "", term)
    if len(cards) == 0 {
        http.Error(w, "No report cards found for class", http.StatusNotFound)
        return
    }
    pdfBytes, err := generatePDF(cards)
    if err != nil {
        http.Error(w, "Failed to generate PDF", http.StatusInternalServerError)
        return
    }
    // Optional email notification for each student could be added here.

    w.Header().Set("Content-Type", "application/pdf")
    w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=class_%s_report.pdf", classID))
    w.Write(pdfBytes)
}

// sendReportCardEmail is a placeholder for future email integration.
func sendReportCardEmail(studentID string, pdf []byte) {
    // TODO: integrate SMTP or email service.
    fmt.Printf("[Email stub] Sent report card PDF to student %s (size %d bytes)\n", studentID, len(pdf))
}
