import React, { useState, useEffect } from 'react';
import { CheckCircle2, Download, Upload, Loader2, AlertCircle } from 'lucide-react';
import { T, cardStyle, inputStyle, btnStyle } from '../styles/portalTheme';
import * as XLSX from 'xlsx';

export default function TeacherMarkEntryForm({ config, myClasses, accent }) {
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [term, setTerm] = useState('1');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // When class/subject/term changes, fetch students and existing marks
  useEffect(() => {
    if (!config || !classId || !subjectId) return;
    fetchData();
  }, [config, classId, subjectId, term, academicYear]);

  const fetchData = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      // 1. Fetch enrolled students
      const enrRes = await fetch(`${import.meta.env.VITE_API_URL}/api/enrollments?schoolId=${config.schoolId}&classId=${classId}`);
      const enrollments = await enrRes.json();
      
      // 2. Fetch existing marks for this class, subject, term
      const marksRes = await fetch(`${import.meta.env.VITE_API_URL}/api/marks/teacher?schoolId=${config.schoolId}&classId=${classId}&subjectId=${subjectId}&term=${term}&academicYear=${academicYear}&teacherId=${config.id}`);
      const existingMarks = await marksRes.json();
      
      const stList = Array.isArray(enrollments) ? enrollments : [];
      setStudents(stList);
      
      const marksMap = {};
      if (Array.isArray(existingMarks)) {
        existingMarks.forEach(m => {
          marksMap[m.studentId] = {
            sequence1: m.sequence1,
            sequence2: m.sequence2,
            sequence3: m.sequence3,
            sequence4: m.sequence4,
            exam: m.exam
          };
        });
      }
      setMarks(marksMap);
    } catch (err) {
      setMessage({ text: 'Failed to load data', type: 'error' });
    }
    setLoading(false);
  };

  const handleMarkChange = (studentId, field, value) => {
    let numVal = parseFloat(value);
    if (isNaN(numVal)) numVal = null;
    if (numVal !== null && (numVal < 0 || numVal > 20)) return; // 0-20 scale validation
    
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: numVal
      }
    }));
  };

  const handleSave = async () => {
    if (!classId || !subjectId) return;
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    const payloadMarks = students.map(s => {
      const sm = marks[s.studentId] || {};
      return {
        studentId: s.studentId,
        sequence1: sm.sequence1,
        sequence2: sm.sequence2,
        sequence3: sm.sequence3,
        sequence4: sm.sequence4,
        exam: sm.exam
      };
    });

    const payload = {
      schoolId: config.schoolId,
      teacherId: config.id,
      classId,
      subjectId,
      term: parseInt(term),
      academicYear,
      marks: payloadMarks
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/marks/save-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save marks');
      setMessage({ text: 'Marks saved successfully', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Error saving marks', type: 'error' });
    }
    setSaving(false);
  };

  const selectedClass = myClasses.find(c => (c.id || c.ID) === classId);
  
  // Quick hack: Use the class subject name as the subjectId for now since it is attached to the class in this simplified schema
  useEffect(() => {
      if (selectedClass && selectedClass.subject) {
          setSubjectId(selectedClass.subject);
      }
  }, [selectedClass]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Assessment</p>
        <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Mark Entry (Multi-Sequence)</h1>
      </div>
      
      <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Academic Year</label>
            <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} style={{ ...inputStyle, width: 120, background: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Term</label>
            <select value={term} onChange={e => setTerm(e.target.value)} style={{ ...inputStyle, width: 100, background: '#fff' }}>
              <option value="1">Term 1</option>
              <option value="2">Term 2</option>
              <option value="3">Term 3</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Select Class</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
              <option value="">-- Choose Class --</option>
              {myClasses.map(c => <option key={c.ID || c.id} value={c.ID || c.id}>{c.name} {c.subject ? `(${c.subject})` : ''}</option>)}
            </select>
          </div>
        </div>
      </div>

      {classId && subjectId && (
        <div style={{ ...cardStyle }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: T.text }}>Student Marks (0 - 20)</h3>
            {message.text && (
              <span style={{ fontSize: 13, fontWeight: 600, color: message.type === 'error' ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                {message.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />} {message.text}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.muted }}><Loader2 className="spin" size={24} style={{ margin: '0 auto 10px' }}/> Loading students...</div>
          ) : students.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: T.muted, background: T.background, borderRadius: 8 }}>No students enrolled in this class.</div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, paddingBottom: 10, borderBottom: `1px solid ${T.borderLight}`, fontWeight: 600, color: T.muted, fontSize: 12, textTransform: 'uppercase' }}>
                <span>Student Name</span>
                <span>Seq 1</span>
                <span>Seq 2</span>
                <span>Exam</span>
              </div>
              
              <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                {students.map((s, idx) => (
                  <div key={s.studentId} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, padding: '12px 0', borderBottom: `1px solid ${T.borderLight}`, alignItems: 'center', background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                    <strong style={{ fontSize: 14, color: T.text }}>{s.studentName}</strong>
                    
                    <input 
                      type="number" step="0.1" min="0" max="20"
                      value={marks[s.studentId]?.sequence1 ?? ''} 
                      onChange={e => handleMarkChange(s.studentId, 'sequence1', e.target.value)} 
                      style={{ ...inputStyle, padding: '6px 10px' }} 
                      placeholder=" / 20" 
                    />
                    
                    <input 
                      type="number" step="0.1" min="0" max="20"
                      value={marks[s.studentId]?.sequence2 ?? ''} 
                      onChange={e => handleMarkChange(s.studentId, 'sequence2', e.target.value)} 
                      style={{ ...inputStyle, padding: '6px 10px' }} 
                      placeholder=" / 20" 
                    />

                    <input 
                      type="number" step="0.1" min="0" max="20"
                      value={marks[s.studentId]?.exam ?? ''} 
                      onChange={e => handleMarkChange(s.studentId, 'exam', e.target.value)} 
                      style={{ ...inputStyle, padding: '6px 10px', borderColor: accent }} 
                      placeholder=" / 20" 
                    />
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleSave} disabled={saving} style={{ ...btnStyle(accent), opacity: saving ? 0.7 : 1 }}>
                  {saving ? <><Loader2 className="spin" size={15}/> Saving...</> : <><CheckCircle2 size={15}/> Save Marks</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
