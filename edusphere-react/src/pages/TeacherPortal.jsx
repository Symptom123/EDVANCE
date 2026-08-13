import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, GraduationCap, FileText, UserPlus, Megaphone, User, LogOut, Plus, Loader2, CheckCircle2, X, TrendingUp } from 'lucide-react';
import { T, rgba, navItemStyle, cardStyle, inputStyle, btnStyle, badge } from '../styles/portalTheme';
import * as XLSX from 'xlsx';

export default function TeacherPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [config, setConfig] = useState(null);
  const [attendance, setAttendance] = useState({ 'Alice Johnson': 'present', 'Bob Smith': 'present', 'Clara Obi': 'absent', 'David Lee': 'present', 'Emma Nwosu': 'late' });
  const [announcementText, setAnnouncementText] = useState('');
  const [selectedClass, setSelectedClass] = useState('Mathematics - JSS 1A');
  const [announcements, setAnnouncements] = useState([{ class: 'Mathematics - JSS 1A', text: 'Test next Monday. Please revise Chapters 7 & 8.', date: 'Oct 10, 2026' }, { class: 'English - JSS 1B', text: 'Essays due Friday. Submit via the portal.', date: 'Oct 08, 2026' }]);
  const [grades, setGrades] = useState([{ name: 'Alice Johnson', assignment: 'Math HW 4', mark: 88, grade: 'B+' }, { name: 'Bob Smith', assignment: 'Math HW 4', mark: 95, grade: 'A' }, { name: 'Clara Obi', assignment: 'Math HW 4', mark: 72, grade: 'B-' }, { name: 'David Lee', assignment: 'Math HW 4', mark: 90, grade: 'A-' }, { name: 'Emma Nwosu', assignment: 'Math HW 4', mark: 78, grade: 'B' }]);
  const [requests, setRequests] = useState([{ id: 1, student: 'Frank Eze', class: 'Mathematics - JSS 2A', date: 'Oct 11' }, { id: 2, student: 'Grace Okafor', class: 'Mathematics - JSS 1A', date: 'Oct 12' }, { id: 3, student: 'Henry Bello', class: 'Mathematics - JSS 2A', date: 'Oct 12' }]);

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [gradingClassId, setGradingClassId] = useState('');
  const [gradingTermId, setGradingTermId] = useState('T1');
  const [uploadStatus, setUploadStatus] = useState(null);

  useEffect(() => {
    if (!config) return;
    fetch(`http://localhost:8080/api/classes?schoolId=${config.schoolId}`)
      .then(r => r.json()).then(c => setClasses(c || []));
    fetch(`http://localhost:8080/api/users?schoolId=${config.schoolId}&role=Student`)
      .then(r => r.json()).then(s => setStudents(s || []));
  }, [config]);

  useEffect(() => {
    const raw = localStorage.getItem('edvance_school_config');
    try {
      const p = JSON.parse(raw || '{}');
      if (p.userRole !== 'Teacher') { navigate('/login'); return; }
      setConfig(p);
    } catch { navigate('/login'); }
  }, [navigate]);

  if (!config) return null;
  const accent = config.primaryColor || '#2563eb';
  const name = config.name || 'Teacher';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Take Attendance', icon: ClipboardCheck },
    { id: 'grading', label: 'Grading', icon: GraduationCap },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'requests', label: 'Enrollment Requests', icon: UserPlus },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 8px' }}>Teacher Dashboard</p>
        <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 38, fontWeight: 400, margin: 0, color: T.text }}>Good morning, {name} 👋</h1>
        <p style={{ color: T.muted, margin: '8px 0 0', fontSize: 15 }}>Here's your class overview for today.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[{ label: 'Total Students', value: '87', color: accent }, { label: 'Avg Grade', value: 'B+', color: '#059669' }, { label: 'Attendance Rate', value: '94%', color: '#d97706' }, { label: 'Pending Requests', value: requests.length, color: '#dc2626' }].map(s => (
          <div key={s.label} style={{ ...cardStyle, borderTop: `3px solid ${s.color}` }}>
            <p style={{ color: T.muted, fontSize: 13, fontWeight: 500, margin: '0 0 10px' }}>{s.label}</p>
            <p style={{ fontFamily: T.fontSerif, fontSize: 42, margin: 0, color: T.text, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>
      <div style={cardStyle}>
        <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 4px', fontSize: 15 }}>Class Performance Over Weeks</p>
        <p style={{ color: T.muted, fontSize: 13, margin: '0 0 20px' }}>Average score across all active classes</p>
        <svg viewBox="0 0 700 160" style={{ width: '100%', display: 'block' }}>
          <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity="0.15" /><stop offset="100%" stopColor={accent} stopOpacity="0" /></linearGradient></defs>
          {[0,40,80,120,160].map((y,i) => <line key={i} x1="0" y1={y} x2="700" y2={y} stroke={T.border} strokeWidth="1" />)}
          <polyline fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="0,130 87.5,115 175,85 262.5,100 350,60 437.5,72 525,42 612.5,52 700,28" />
          <polygon fill="url(#tg)" points="0,130 87.5,115 175,85 262.5,100 350,60 437.5,72 525,42 612.5,52 700,28 700,160 0,160" />
          {[[0,130],[87.5,115],[175,85],[262.5,100],[350,60],[437.5,72],[525,42],[612.5,52],[700,28]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="5" fill={accent} stroke="white" strokeWidth="2" />)}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>{['Wk1','Wk2','Wk3','Wk4','Wk5','Wk6','Wk7','Wk8','Wk9'].map(w => <span key={w} style={{ color: T.light, fontSize: 11, fontWeight: 500 }}>{w}</span>)}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={cardStyle}>
          <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 14px', fontSize: 15 }}>Recent Submissions</p>
          {[{ name: 'Alice Johnson', assignment: 'Math HW 4', time: '2h ago' }, { name: 'Bob Smith', assignment: 'Math HW 4', time: '3h ago' }, { name: 'Clara Obi', assignment: 'Essay Draft', time: 'Yesterday' }].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 2 ? `1px solid ${T.borderLight}` : 'none', alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: rgba(accent, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontFamily: T.fontSerif, fontStyle: 'italic', flexShrink: 0 }}>{s.name.charAt(0)}</div>
              <div style={{ flex: 1 }}><p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: T.text }}>{s.name}</p><p style={{ margin: 0, fontSize: 12, color: T.muted }}>{s.assignment}</p></div>
              <span style={{ fontSize: 11, color: T.light }}>{s.time}</span>
            </div>
          ))}
        </div>
        <div style={cardStyle}>
          <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 14px', fontSize: 15 }}>Top Performers</p>
          {[{ name: 'Bob Smith', avg: '95%', rank: 1 }, { name: 'Alice Johnson', avg: '92%', rank: 2 }, { name: 'Emma Nwosu', avg: '89%', rank: 3 }].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 2 ? `1px solid ${T.borderLight}` : 'none', alignItems: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#fef3c7' : T.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: i === 0 ? '#d97706' : T.muted, flexShrink: 0 }}>#{s.rank}</div>
              <p style={{ margin: 0, flex: 1, fontWeight: 600, fontSize: 13, color: T.text }}>{s.name}</p>
              <strong style={{ color: accent, fontSize: 14 }}>{s.avg}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAttendanceView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Daily Record</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Take Attendance</h1></div>
      <div style={{ ...cardStyle, maxWidth: 560 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Select Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
            {['Mathematics - JSS 1A', 'Mathematics - JSS 2A', 'English - JSS 1B'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        {Object.entries(attendance).map(([student, status]) => (
          <div key={student} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${T.borderLight}` }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: rgba(accent, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontSerif, fontStyle: 'italic', color: accent }}>{student.charAt(0)}</div>
              <strong style={{ fontSize: 14, color: T.text }}>{student}</strong>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['present', 'absent', 'late'].map(s => (
                <button key={s} onClick={() => setAttendance(a => ({ ...a, [student]: s }))}
                  style={{ padding: '6px 14px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: T.fontSans, background: status === s ? (s === 'present' ? '#dcfce7' : s === 'absent' ? '#fee2e2' : '#fef9c3') : T.borderLight, color: status === s ? (s === 'present' ? '#15803d' : s === 'absent' ? '#dc2626' : '#d97706') : T.muted, transition: 'all 0.15s', textTransform: 'capitalize' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button style={{ ...btnStyle(accent), marginTop: 20 }}><CheckCircle2 size={15} />Save Attendance</button>
      </div>
    </div>
  );
  const handleExcelTemplateDownload = () => {
    if (!gradingClassId) { alert("Please select a class first."); return; }
    const templateData = students.map(s => ({
      studentId: s.id,
      studentName: s.name,
      score: ''
    }));
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
    XLSX.writeFile(wb, "marks_template.xlsx");
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !gradingClassId || !gradingTermId) {
      alert("Please select class, term, and a file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const formattedGrades = data.map(r => ({
          studentId: r.studentId,
          score: Number(r.score) || 0
        })).filter(g => g.studentId);

        setUploadStatus('Uploading...');
        // Assume the subject is just the class's subject for now.
        // We fetch class details to get the subject ID (if we had it). For now, use the class ID as a proxy for the single subject it teaches.
        const res = await fetch(`http://localhost:8080/api/grades/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grades: formattedGrades, subjectId: gradingClassId, termId: gradingTermId, schoolId: config.schoolId })
        });
        if (res.ok) {
          setUploadStatus('Upload successful!');
          setTimeout(() => setUploadStatus(null), 3000);
        } else {
          setUploadStatus('Upload failed.');
        }
      } catch (err) {
        setUploadStatus('Error reading file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const renderGrading = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Assessment</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Grading</h1></div>
      
      <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Select Class</label>
            <select value={gradingClassId} onChange={e => setGradingClassId(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
              <option value="">-- Choose Class --</option>
              {classes.map(c => <option key={c.ID || c.id} value={c.ID || c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Term</label>
            <select value={gradingTermId} onChange={e => setGradingTermId(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
              <option value="T1">First Term (T1)</option>
              <option value="T2">Second Term (T2)</option>
              <option value="T3">Third Term (T3)</option>
            </select>
          </div>
        </div>
        
        <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={handleExcelTemplateDownload} style={{ ...btnStyle('#10b981'), background: 'transparent', color: '#10b981', border: '1px solid #10b981' }}>
             Download Mark Sheet
          </button>
          
          <label style={{ ...btnStyle('#10b981'), cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
             Upload Excel Marks
            <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleExcelUpload} />
          </label>
          {uploadStatus && <span style={{ fontSize: 13, color: T.text }}>{uploadStatus}</span>}
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans }}>
          <thead><tr style={{ background: '#faf9f7' }}>{['Student', 'Assignment', 'Mark / 20', 'Grade', 'Action'].map(h => <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.light, letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
          <tbody>
            {grades.map((g, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                <td style={{ padding: '14px 20px', fontWeight: 600, color: T.text }}>{g.name}</td>
                <td style={{ padding: '14px 20px', color: T.muted, fontSize: 13 }}>{g.assignment}</td>
                <td style={{ padding: '14px 20px' }}>
                  <input type="number" min="0" max="20" value={g.mark} onChange={e => setGrades(gs => gs.map((r, j) => j === i ? { ...r, mark: Number(e.target.value) } : r))} style={{ ...inputStyle, width: 80, padding: '6px 10px', textAlign: 'center' }} />
                </td>
                <td style={{ padding: '14px 20px' }}><span style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 18, color: accent }}>{g.grade}</span></td>
                <td style={{ padding: '14px 20px' }}><button style={{ ...btnStyle(accent), padding: '7px 14px', fontSize: 12 }}>Save</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Tasks</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Assignments</h1></div>
        <button style={btnStyle(accent)}><Plus size={15} />Create Assignment</button>
      </div>
      <p style={{ color: T.muted, fontWeight: 600, margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[{ title: 'Quadratic Equations HW', due: 'Oct 15, 2026', submissions: 18, total: 28 }, { title: 'Trigonometry Quiz', due: 'Oct 19, 2026', submissions: 22, total: 28 }].map((a, i) => (
          <div key={i} style={{ ...cardStyle, borderLeft: `4px solid ${accent}` }}>
            <h3 style={{ fontFamily: T.fontSans, fontWeight: 700, fontSize: 15, margin: '0 0 4px', color: T.text }}>{a.title}</h3>
            <p style={{ color: T.muted, fontSize: 13, margin: '0 0 12px' }}>Due: {a.due}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: T.muted }}>Submissions</span><strong style={{ color: accent }}>{a.submissions}/{a.total}</strong></div>
            <div style={{ marginTop: 8, height: 5, background: T.borderLight, borderRadius: 100 }}><div style={{ height: '100%', width: `${(a.submissions / a.total) * 100}%`, background: accent, borderRadius: 100 }} /></div>
          </div>
        ))}
      </div>
      <p style={{ color: T.muted, fontWeight: 600, margin: '8px 0 0', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Past</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[{ title: 'Algebra Basics HW', due: 'Oct 5, 2026', submissions: 27, total: 28 }, { title: 'Number Theory Test', due: 'Oct 2, 2026', submissions: 28, total: 28 }].map((a, i) => (
          <div key={i} style={{ ...cardStyle, borderLeft: `4px solid ${T.border}`, opacity: 0.8 }}>
            <h3 style={{ fontFamily: T.fontSans, fontWeight: 700, fontSize: 15, margin: '0 0 4px', color: T.text }}>{a.title}</h3>
            <p style={{ color: T.muted, fontSize: 13, margin: '0 0 12px' }}>Due: {a.due}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: T.muted }}>Submissions</span><strong style={{ color: '#059669' }}>{a.submissions}/{a.total}</strong></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRequests = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Enrollment</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Enrollment Requests</h1></div>
      {requests.length === 0 ? <div style={{ ...cardStyle, textAlign: 'center', padding: '48px', color: T.muted }}>No pending requests.</div> : requests.map(req => (
        <div key={req.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: rgba(accent, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 20, color: accent, flexShrink: 0 }}>{req.student.charAt(0)}</div>
          <div style={{ flex: 1 }}>
            <strong style={{ color: T.text }}>{req.student}</strong>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: T.muted }}>{req.class} · {req.date}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setRequests(r => r.filter(x => x.id !== req.id))} style={btnStyle(accent)}>Approve</button>
            <button onClick={() => setRequests(r => r.filter(x => x.id !== req.id))} style={{ ...btnStyle('#ef4444', true), border: '1.5px solid #fecaca', color: '#ef4444', background: '#fef2f2' }}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAnnouncements = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Communications</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Announcements</h1></div>
      <div style={{ ...cardStyle, maxWidth: 560 }}>
        <p style={{ fontFamily: T.fontSans, fontWeight: 700, fontSize: 15, color: T.text, margin: '0 0 16px' }}>New Announcement</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Select Class</label><select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>{['Mathematics - JSS 1A', 'Mathematics - JSS 2A', 'English - JSS 1B'].map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Message</label><textarea value={announcementText} onChange={e => setAnnouncementText(e.target.value)} rows={4} placeholder="Write your announcement here…" style={{ ...inputStyle, resize: 'vertical' }} /></div>
          <button onClick={() => { if (announcementText.trim()) { setAnnouncements(a => [{ class: selectedClass, text: announcementText, date: 'Just now' }, ...a]); setAnnouncementText(''); } }} style={btnStyle(accent)}><Megaphone size={15} />Send to Class</button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {announcements.map((a, i) => (
          <div key={i} style={{ ...cardStyle, borderLeft: `4px solid ${accent}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={badge(accent, rgba(accent, 0.1))}>{a.class}</span>
              <span style={{ fontSize: 12, color: T.light }}>{a.date}</span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: T.text, lineHeight: 1.6 }}>{a.text}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Account</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>My Profile</h1></div>
      <div style={{ ...cardStyle, maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, marginBottom: 20, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: rgba(accent, 0.1), border: `2px solid ${rgba(accent, 0.3)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 28, color: accent }}>{name.charAt(0)}</div>
          <div><p style={{ margin: 0, fontWeight: 700, fontSize: 18, color: T.text }}>{name}</p><p style={{ margin: 0, fontSize: 13, color: T.muted }}>{config.email}</p></div>
        </div>
        {[{ label: 'School', value: config.schoolName }, { label: 'Role', value: 'Teacher' }, { label: 'Email', value: config.email }].map(f => (
          <div key={f.label} style={{ marginBottom: 16 }}><p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{f.label}</p><p style={{ margin: 0, color: T.text, fontWeight: 500 }}>{f.value}</p></div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'attendance': return renderAttendanceView();
      case 'grading': return renderGrading();
      case 'assignments': return renderAssignments();
      case 'requests': return renderRequests();
      case 'announcements': return renderAnnouncements();
      case 'profile': return renderProfile();
      default: return renderDashboard();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: T.pageBg, fontFamily: T.fontSans }}>
      <div style={{ width: 252, background: T.sidebarBg, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${T.borderLight}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <img src="/logo.png" alt="Edvance Logo" style={{ height: 48, objectFit: 'contain', alignSelf: 'flex-start' }} />
            <span style={{ fontSize: 11, color: T.light, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Teacher Portal</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {navItems.map(item => <button key={item.id} onClick={() => setActiveTab(item.id)} style={navItemStyle(activeTab === item.id, accent)}><item.icon size={16} />{item.label}</button>)}
        </nav>
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${T.borderLight}` }}>
          <button onClick={() => { localStorage.removeItem('edvance_school_config'); navigate('/login'); }} style={{ ...navItemStyle(false, '#ef4444'), color: '#ef4444' }}><LogOut size={16} />Sign Out</button>
        </div>
      </div>
      <div style={{ flex: 1, padding: '44px 52px', overflowY: 'auto' }}>{renderContent()}</div>
      <div style={{ width: 256, background: T.sidebarBg, borderLeft: `1px solid ${T.border}`, padding: '24px 18px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 22, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', paddingBottom: 18, borderBottom: `1px solid ${T.borderLight}` }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: rgba(accent, 0.1), border: `2px solid ${rgba(accent, 0.25)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 24, color: accent }}>{name.charAt(0)}</div>
          <p style={{ margin: '0 0 4px', fontWeight: 700, color: T.text, fontSize: 14 }}>{name}</p>
          <span style={badge(accent, rgba(accent, 0.1))}>Teacher</span>
        </div>
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Stats</p>
          {[{ label: 'Students', value: 87 }, { label: 'Classes', value: 3 }, { label: 'Pending', value: requests.length }].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${T.borderLight}` }}>
              <span style={{ color: T.muted, fontSize: 13 }}>{s.label}</span>
              <strong style={{ color: T.text }}>{s.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
