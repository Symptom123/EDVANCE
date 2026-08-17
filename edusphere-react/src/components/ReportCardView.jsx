import React, { useState } from 'react';

// --- Appreciation Helper ---
function getGradeInfo(mark) {
  if (mark >= 18) return { grade: 'A+', app: 'Excellent',        color: '#15803d' };
  if (mark >= 16) return { grade: 'A',  app: 'Très Bien',        color: '#16a34a' };
  if (mark >= 14) return { grade: 'B',  app: 'Bien',             color: '#2563eb' };
  if (mark >= 12) return { grade: 'C',  app: 'Assez Bien',       color: '#7c3aed' };
  if (mark >= 10) return { grade: 'D',  app: 'Passable',         color: '#d97706' };
  return           { grade: 'E',  app: 'Insuffisant / Faible', color: '#dc2626' };
}

// --- Editable Text Field (inline input when editing) ---
function EditableField({ value, onChange, isEditing, style = {}, inputStyle = {} }) {
  if (!isEditing) return <span style={style}>{value}</span>;
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        border: '1.5px dashed #2563eb',
        borderRadius: 4,
        padding: '2px 8px',
        fontSize: 'inherit',
        fontWeight: 'inherit',
        fontFamily: 'inherit',
        background: '#eff6ff',
        color: '#1e3a8a',
        outline: 'none',
        width: '100%',
        ...inputStyle,
      }}
    />
  );
}

export default function ReportCardView({ reportCards, accent, config, isEditing, customFields, onFieldChange }) {
  if (!reportCards || reportCards.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '64px 24px', color: '#94a3b8',
        background: '#fff', borderRadius: 12, border: '2px dashed #e2e8f0'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No Report Cards Generated Yet</p>
        <p style={{ fontSize: 14 }}>Select a Class and Term above, then click "Fetch Report Cards".</p>
      </div>
    );
  }

  // Merge config defaults with custom overrides
  const fields = {
    schoolName:   customFields?.schoolName   || config?.schoolName || 'SCHOOL NAME',
    academicYear: customFields?.academicYear || `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`,
    termLabel:    customFields?.termLabel    || '',
    classMaster:  customFields?.classMaster  || '-',
    principalName:customFields?.principalName|| '-',
    examSession:  customFields?.examSession  || 'Regular Session',
  };

  const upd = (key) => (val) => onFieldChange && onFieldChange(key, val);

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; color: black !important; margin: 0; padding: 0; }
          .print-hide { display: none !important; }
          .print-main { padding: 0 !important; overflow: visible !important; }
          .report-page {
            page-break-after: always;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            padding: 10mm !important;
            margin: 0 !important;
            width: 100% !important;
            border: none !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          input { border: none !important; background: transparent !important; color: inherit !important; }
        }
        .report-page {
          background: white;
          color: black;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto 28px auto;
          padding: 14mm;
          box-sizing: border-box;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          font-family: "Times New Roman", serif;
          border-radius: 4px;
          transition: box-shadow 0.2s;
        }
        .report-page:hover {
          box-shadow: 0 12px 40px rgba(0,0,0,0.18);
        }
        .rc-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double black; margin-bottom: 12px; padding-bottom: 10px; }
        .rc-header-col { text-align: center; flex: 1; line-height: 1.5; }
        .rc-title { font-size: 17px; font-weight: bold; text-transform: uppercase; margin: 10px 0 4px; text-align: center; text-decoration: underline; letter-spacing: 1px; }
        .rc-subtitle { font-size: 12px; text-align: center; margin-bottom: 14px; color: #444; }
        .rc-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 14px; font-size: 13px; border: 1px solid #ccc; padding: 10px; background: #fafafa; }
        .rc-info-row { display: flex; gap: 6px; margin: 2px 0; }
        .rc-info-label { font-weight: bold; white-space: nowrap; }
        .grades-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 12px; }
        .grades-table th, .grades-table td { border: 1px solid #333; padding: 5px 7px; text-align: center; }
        .grades-table thead th { background-color: #1e293b; color: white; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
        .grades-table td.subject-name { text-align: left; font-weight: bold; }
        .grades-table tr:nth-child(even) { background: #f8fafc; }
        .rc-summary { display: flex; justify-content: space-around; border: 2px solid #1e293b; padding: 12px 16px; margin-bottom: 14px; font-size: 14px; background: #f0f9ff; border-radius: 4px; }
        .rc-summary-stat { text-align: center; }
        .rc-summary-stat .val { font-size: 22px; font-weight: bold; display: block; }
        .rc-summary-stat .lbl { font-size: 11px; color: #64748b; text-transform: uppercase; }
        .rc-remarks { border: 1px solid #ccc; padding: 8px 12px; min-height: 40px; margin-bottom: 14px; font-size: 12px; }
        .rc-signatures { display: flex; justify-content: space-between; margin-top: 16px; font-size: 12px; gap: 16px; }
        .rc-sig-box { text-align: center; flex: 1; }
        .rc-sig-line { margin-top: 50px; border-top: 1px solid #333; width: 80%; margin-inline: auto; padding-top: 4px; font-size: 11px; color: #555; }
        .appreciation-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-weight: bold; font-size: 11px; }
      `}</style>

      <div>
        {reportCards.map((rc, index) => {
          // Support both old CameroonReportCard and new ReportCardFull shapes
          const avg = rc.termAverage ?? rc.average ?? 0;
          const totalStudents = rc.totalStudents ?? rc.classSize ?? '-';
          const promotionStatus = rc.promotionStatus ?? (avg >= 10 ? 'Promoted' : 'Not Promoted');
          const principalRemark = rc.principalRemark ?? (avg >= 16 ? 'Excellent work, keep it up.' : avg >= 10 ? 'Satisfactory performance.' : 'Requires serious improvement.');
          const classAvg = rc.classAverage ?? 0;
          const highestAvg = rc.highestAverage ?? 0;
          const lowestAvg = rc.lowestAverage ?? 0;
          const totalScore = rc.totalScore ?? null;
          const totalCoeff = rc.totalCoeff ?? null;
          const { grade: overallGrade, app: overallApp, color: overallColor } = getGradeInfo(avg);
          const isLast = index === reportCards.length - 1;

          return (
            <div key={rc.studentId || index} className={`report-page${!isLast ? '' : ''}`}>

              {/* ── HEADER ── */}
              <div className="rc-header">
                <div className="rc-header-col" style={{ fontSize: 11 }}>
                  <strong>REPUBLIQUE DU CAMEROUN</strong><br/>
                  <em>Paix - Travail - Patrie</em><br/><br/>
                  <span style={{ fontSize: 10 }}>MINISTERE DES ENSEIGNEMENTS<br/>SECONDAIRES</span>
                </div>
                <div className="rc-header-col">
                  <img src="/logo.png" alt="Logo" style={{ height: 65, objectFit: 'contain', marginBottom: 4 }}
                    onError={e => { e.target.style.display = 'none'; }} />
                  <div style={{ fontSize: 13, fontWeight: 'bold', marginTop: 2 }}>
                    {isEditing
                      ? <input type="text" value={fields.schoolName} onChange={e => upd('schoolName')(e.target.value)}
                          style={{ border: '1.5px dashed #2563eb', borderRadius: 4, padding: '2px 8px', fontWeight: 'bold', fontSize: 13, background: '#eff6ff', color: '#1e3a8a', outline: 'none', textAlign: 'center', width: '90%' }} />
                      : fields.schoolName
                    }
                  </div>
                </div>
                <div className="rc-header-col" style={{ fontSize: 11 }}>
                  <strong>REPUBLIC OF CAMEROON</strong><br/>
                  <em>Peace - Work - Fatherland</em><br/><br/>
                  <span style={{ fontSize: 10 }}>MINISTRY OF SECONDARY<br/>EDUCATION</span>
                </div>
              </div>

              {/* ── TITLE ── */}
              <div className="rc-title">BULLETIN DE NOTES / REPORT CARD</div>
              <div className="rc-subtitle">
                {isEditing ? (
                  <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                    <input type="text" value={fields.examSession} onChange={e => upd('examSession')(e.target.value)}
                      style={{ border: '1.5px dashed #2563eb', borderRadius: 4, padding: '2px 8px', fontSize: 12, background: '#eff6ff', color: '#1e3a8a', outline: 'none', textAlign: 'center', width: 160 }} />
                    <span>|</span>
                    <input type="text" value={fields.academicYear} onChange={e => upd('academicYear')(e.target.value)}
                      style={{ border: '1.5px dashed #2563eb', borderRadius: 4, padding: '2px 8px', fontSize: 12, background: '#eff6ff', color: '#1e3a8a', outline: 'none', textAlign: 'center', width: 130 }} />
                  </span>
                ) : (
                  `${fields.examSession}  |  Academic Year: ${fields.academicYear}`
                )}
              </div>

              {/* ── STUDENT INFO ── */}
              <div className="rc-info-grid">
                <div>
                  <div className="rc-info-row"><span className="rc-info-label">Name / Noms:</span> <span>{rc.studentName}</span></div>
                  <div className="rc-info-row"><span className="rc-info-label">Matricule:</span> <span>{rc.studentId || '-'}</span></div>
                  <div className="rc-info-row"><span className="rc-info-label">Class / Classe:</span> <span>{rc.className || '-'}</span></div>
                </div>
                <div>
                  <div className="rc-info-row">
                    <span className="rc-info-label">Term / Trimestre:</span>
                    <span>
                      {isEditing
                        ? <input type="text" value={fields.termLabel || (rc.termName || rc.termId || '')} onChange={e => upd('termLabel')(e.target.value)}
                            style={{ border: '1.5px dashed #2563eb', borderRadius: 4, padding: '1px 6px', fontSize: 12, background: '#eff6ff', color: '#1e3a8a', outline: 'none', width: 100 }} />
                        : (fields.termLabel || rc.termName || rc.termId || '-')
                      }
                    </span>
                  </div>
                  <div className="rc-info-row"><span className="rc-info-label">Class Size / Effectif:</span> <span>{totalStudents}</span></div>
                  <div className="rc-info-row">
                    <span className="rc-info-label">Class Master:</span>
                    <span>
                      {isEditing
                        ? <input type="text" value={fields.classMaster} onChange={e => upd('classMaster')(e.target.value)}
                            style={{ border: '1.5px dashed #2563eb', borderRadius: 4, padding: '1px 6px', fontSize: 12, background: '#eff6ff', color: '#1e3a8a', outline: 'none', width: 110 }} />
                        : fields.classMaster
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* ── GRADES TABLE ── */}
              <table className="grades-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', width: '25%' }}>Subject / Matière</th>
                    <th>Coef</th>
                    <th>Seq 1<br/><span style={{ fontSize: 10, fontWeight: 400 }}>S1</span></th>
                    <th>Seq 2<br/><span style={{ fontSize: 10, fontWeight: 400 }}>S2</span></th>
                    <th>Avg /20<br/><span style={{ fontSize: 10, fontWeight: 400 }}>Moy</span></th>
                    <th>Weighted<br/><span style={{ fontSize: 10, fontWeight: 400 }}>Total</span></th>
                    <th>Grade<br/><span style={{ fontSize: 10, fontWeight: 400 }}>Cote</span></th>
                    <th>Rank<br/><span style={{ fontSize: 10, fontWeight: 400 }}>Rang</span></th>
                    <th>Teacher<br/><span style={{ fontSize: 10, fontWeight: 400 }}>Enseignant</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rc.subjects && rc.subjects.length > 0 ? rc.subjects.map((sub, i) => {
                    const coef = sub.coefficient || 1;
                    // Support both old (seq1Mark/termAverage/weightedScore) and new (sequence1/subjectAvg) shapes
                    const seq1Raw = sub.sequence1 ?? sub.seq1Mark;
                    const seq2Raw = sub.sequence2 ?? sub.seq2Mark;
                    const seq1 = seq1Raw != null ? Number(seq1Raw).toFixed(2) : '-';
                    const seq2 = seq2Raw != null ? Number(seq2Raw).toFixed(2) : '-';
                    const avgMark = sub.subjectAvg ?? sub.termAverage ?? 0;
                    const total = sub.weightedScore != null ? Number(sub.weightedScore) : (avgMark > 0 ? avgMark * coef : null);
                    const { grade, color: gradeColor } = getGradeInfo(avgMark);
                    const rank = sub.subjectRank || '-';
                    const teacher = sub.teacherName || '-';
                    
                    return (
                      <tr key={i}>
                        <td className="subject-name">{sub.subjectName || `Subject ${i+1}`}</td>
                        <td style={{ fontWeight: 'bold' }}>{coef}</td>
                        <td>{seq1}</td>
                        <td>{seq2}</td>
                        <td style={{ fontWeight: 'bold', fontSize: 13, background: '#f8fafc', color: avgMark > 0 ? gradeColor : '#888' }}>{avgMark > 0 ? avgMark.toFixed(2) : '-'}</td>
                        <td style={{ fontWeight: 'bold' }}>{total != null ? total.toFixed(2) : '-'}</td>
                        <td><strong style={{ color: gradeColor }}>{grade}</strong></td>
                        <td>{rank}</td>
                        <td style={{ fontSize: 11, color: '#555' }}>{teacher}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', padding: 16 }}>
                        No subject grades available for this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* ── SUMMARY BOX ── */}
              <div className="rc-summary">
                <div className="rc-summary-stat">
                  <span className="val">{totalScore != null ? Number(totalScore).toFixed(1) : '-'}</span>
                  <span className="lbl">Total Marks</span>
                </div>
                <div className="rc-summary-stat">
                  <span className="val">{totalCoeff ?? '-'}</span>
                  <span className="lbl">Total Coef</span>
                </div>
                <div className="rc-summary-stat">
                  <span className="val" style={{ color: overallColor }}>{avg ? avg.toFixed(2) : '-'}<span style={{ fontSize: 14 }}>/20</span></span>
                  <span className="lbl">Term Average</span>
                </div>
                <div className="rc-summary-stat">
                  <span className="val">{rc.rank || '-'}{totalStudents ? `/${totalStudents}` : ''}</span>
                  <span className="lbl">Class Rank</span>
                </div>
                <div className="rc-summary-stat">
                  <span className="val" style={{ color: overallColor, fontSize: 18 }}>{overallGrade}</span>
                  <span className="lbl" style={{ color: overallColor }}>{overallApp}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
                <div style={{ border: '1px solid #ccc', padding: 8, fontSize: 12, background: '#fafafa' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>Class Statistics</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Class Average:</span> <strong>{classAvg > 0 ? classAvg.toFixed(2) : '-'}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Highest Average:</span> <strong>{highestAvg > 0 ? highestAvg.toFixed(2) : '-'}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Lowest Average:</span> <strong>{lowestAvg > 0 ? lowestAvg.toFixed(2) : '-'}</strong></div>
                </div>
                <div style={{ border: '1px solid #ccc', padding: 8, fontSize: 12, background: '#fafafa' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>Promotion / Decision</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: promotionStatus === 'Promoted' ? '#15803d' : '#dc2626' }}>
                    <span style={{ fontWeight: 'bold', fontSize: 16 }}>{promotionStatus}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontStyle: 'italic', color: '#555' }}>{principalRemark}</p>
                </div>
              </div>

              {/* ── REMARKS ── */}
              <div style={{ marginBottom: 12, fontSize: 12 }}>
                <strong>Remarks / Observations:</strong>
                <div className="rc-remarks" style={{ marginTop: 4 }}>
                  {principalRemark || overallApp}
                </div>
              </div>

              {/* ── SIGNATURES ── */}
              <div className="rc-signatures">
                <div className="rc-sig-box">
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: 12 }}>Class Master / Titulaire</p>
                  <div className="rc-sig-line">
                    {isEditing
                      ? <input type="text" value={fields.classMaster} onChange={e => upd('classMaster')(e.target.value)}
                          style={{ border: '1.5px dashed #2563eb', borderRadius: 4, padding: '1px 6px', fontSize: 11, background: '#eff6ff', color: '#1e3a8a', outline: 'none', width: '100%', textAlign: 'center' }} />
                      : fields.classMaster
                    }
                  </div>
                </div>
                <div className="rc-sig-box">
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: 12 }}>Parent / Tuteur</p>
                  <div className="rc-sig-line">Signature</div>
                </div>
                <div className="rc-sig-box">
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: 12 }}>Principal / Directeur</p>
                  <div className="rc-sig-line">
                    {isEditing
                      ? <input type="text" value={fields.principalName} onChange={e => upd('principalName')(e.target.value)}
                          style={{ border: '1.5px dashed #2563eb', borderRadius: 4, padding: '1px 6px', fontSize: 11, background: '#eff6ff', color: '#1e3a8a', outline: 'none', width: '100%', textAlign: 'center' }} />
                      : fields.principalName
                    }
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </>
  );
}
