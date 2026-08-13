import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, FileText, Award, CheckSquare, Mail, User, LogOut, Plus, Clock, ChevronRight, Bell } from 'lucide-react';
import { T, rgba, navItemStyle, cardStyle, inputStyle, btnStyle, badge } from '../styles/portalTheme';

export default function StudentPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [config, setConfig] = useState(null);
  const [parentName, setParentName] = useState('');
  const [parentGenSuccess, setParentGenSuccess] = useState(null);
  const [parentGenError, setParentGenError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('edvance_school_config');
    try {
      const p = JSON.parse(raw || '{}');
      if (p.userRole !== 'Student') { navigate('/login'); return; }
      setConfig(p);
    } catch { navigate('/login'); }
  }, [navigate]);

  if (!config) return null;
  const accent = config.primaryColor || '#2563eb';
  const name = config.name || 'Student';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'classes', label: 'My Classes', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'grades', label: 'Grades & Results', icon: Award },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare },
    { id: 'inbox', label: 'Inbox', icon: Mail },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 8px' }}>Student Portal</p>
        <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 38, fontWeight: 400, margin: 0, color: T.text }}>Welcome back, {name} 👋</h1>
        <p style={{ color: T.muted, margin: '8px 0 0', fontSize: 15 }}>Here's an overview of your academic progress.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[{ label: 'Attendance', value: '96%', color: '#059669' }, { label: 'GPA', value: '3.8', color: accent }, { label: 'Unread', value: '3', color: '#d97706' }, { label: 'Due Today', value: '2', color: '#dc2626' }].map(s => (
          <div key={s.label} style={{ ...cardStyle, borderTop: `3px solid ${s.color}` }}>
            <p style={{ color: T.muted, fontSize: 13, fontWeight: 500, margin: '0 0 10px' }}>{s.label}</p>
            <p style={{ fontFamily: T.fontSerif, fontSize: 42, margin: 0, color: T.text, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div style={cardStyle}>
        <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 6px', fontSize: 15 }}>Performance This Term</p>
        <p style={{ color: T.muted, fontSize: 13, margin: '0 0 20px' }}>Your average grade trend across all subjects</p>
        <svg viewBox="0 0 700 160" style={{ width: '100%', display: 'block' }}>
          <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity="0.15" /><stop offset="100%" stopColor={accent} stopOpacity="0" /></linearGradient></defs>
          {[0,40,80,120,160].map((y,i) => <line key={i} x1="0" y1={y} x2="700" y2={y} stroke={T.border} strokeWidth="1" />)}
          <polyline fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="0,120 116,100 232,75 348,88 464,55 580,45 700,30" />
          <polygon fill="url(#sg)" points="0,120 116,100 232,75 348,88 464,55 580,45 700,30 700,160 0,160" />
          {[[0,120],[116,100],[232,75],[348,88],[464,55],[580,45],[700,30]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="5" fill={accent} stroke="white" strokeWidth="2" />)}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>{['Week 1','Week 2','Week 3','Week 4','Week 5','Week 6','Week 7'].map(w => <span key={w} style={{ color: T.light, fontSize: 11, fontWeight: 500 }}>{w}</span>)}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Upcoming deadlines */}
        <div style={cardStyle}>
          <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 16px', fontSize: 15 }}>Upcoming Deadlines</p>
          {[{ title: 'Math Assignment 4', subject: 'Mathematics', due: 'Tomorrow', urgent: true }, { title: 'History Essay', subject: 'History', due: 'Oct 18', urgent: false }, { title: 'Science Lab Report', subject: 'Science', due: 'Oct 22', urgent: false }].map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 2 ? `1px solid ${T.borderLight}` : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.urgent ? '#dc2626' : accent, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: T.text }}>{a.title}</p>
                <p style={{ margin: 0, fontSize: 12, color: T.muted }}>{a.subject}</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: a.urgent ? '#dc2626' : T.muted }}>{a.due}</span>
            </div>
          ))}
        </div>
        {/* Recent grades */}
        <div style={cardStyle}>
          <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 16px', fontSize: 15 }}>Recent Grades</p>
          {[{ title: 'Math Test 3', grade: 'A', score: '92/100' }, { title: 'History Quiz', grade: 'B+', score: '84/100' }, { title: 'English Essay', grade: 'A-', score: '88/100' }].map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 2 ? `1px solid ${T.borderLight}` : 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: rgba(accent, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: accent, fontSize: 15, fontFamily: T.fontSerif, flexShrink: 0 }}>{g.grade}</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: T.text }}>{g.title}</p>
                <p style={{ margin: 0, fontSize: 12, color: T.muted }}>{g.score}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTimetable = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Schedule</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Weekly Timetable</h1></div>
      <div style={{ ...cardStyle, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans, minWidth: 600 }}>
          <thead><tr style={{ background: '#faf9f7' }}>{['Period', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.light, letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
          <tbody>{[
            ['8:00 – 9:00', 'Mathematics', 'English', 'Science', 'History', 'Mathematics'],
            ['9:00 – 10:00', 'History', 'Mathematics', 'English', 'Science', 'Art'],
            ['10:30 – 11:30', 'Science', 'History', 'Mathematics', 'English', 'PE'],
            ['11:30 – 12:30', 'English', 'Art', 'History', 'Mathematics', 'Science'],
            ['13:30 – 14:30', 'PE', 'Science', 'Art', 'PE', 'History'],
          ].map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: T.light, fontSize: 13 }}>{row[0]}</td>
              {row.slice(1).map((cell, j) => <td key={j} style={{ padding: '12px 16px', fontSize: 13, color: T.text }}><span style={{ background: rgba(accent, 0.08), color: accent, padding: '4px 10px', borderRadius: 100, fontWeight: 500, fontSize: 12 }}>{cell}</span></td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );

  const renderClasses = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Enrollment</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>My Classes</h1></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {[{ name: 'Advanced Mathematics', teacher: 'Mr. Okonkwo', progress: 72, students: 28 }, { name: 'English Literature', teacher: 'Mrs. Adeyemi', progress: 58, students: 24 }, { name: 'Biology', teacher: 'Dr. Nwosu', progress: 85, students: 32 }].map((cls, i) => (
          <div key={i} style={{ ...cardStyle, borderTop: `3px solid ${accent}` }}>
            <h3 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 20, margin: '0 0 4px', color: T.text }}>{cls.name}</h3>
            <p style={{ color: T.muted, fontSize: 13, margin: '0 0 16px' }}>{cls.teacher} · {cls.students} students</p>
            <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.muted }}>
              <span>Progress</span><strong style={{ color: accent }}>{cls.progress}%</strong>
            </div>
            <div style={{ height: 6, background: T.borderLight, borderRadius: 100 }}><div style={{ height: '100%', width: `${cls.progress}%`, background: accent, borderRadius: 100 }} /></div>
            <button style={{ ...btnStyle(accent, true), marginTop: 16, width: '100%', justifyContent: 'center' }}>View Materials <ChevronRight size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Tasks</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Assignments</h1></div>
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans }}>
          <thead><tr style={{ background: '#faf9f7' }}>{['Assignment', 'Subject', 'Due Date', 'Status', ''].map(h => <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.light, letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
          <tbody>
            {[{ title: 'Quadratic Equations HW', sub: 'Maths', due: 'Tomorrow', status: 'Pending' }, { title: 'Essay: Romeo & Juliet', sub: 'English', due: 'Oct 18', status: 'Submitted' }, { title: 'Cell Division Lab', sub: 'Biology', due: 'Oct 15', status: 'Graded' }, { title: 'World War II Analysis', sub: 'History', due: 'Oct 22', status: 'Pending' }].map((a, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                <td style={{ padding: '14px 20px', fontWeight: 600, color: T.text, fontSize: 14 }}>{a.title}</td>
                <td style={{ padding: '14px 20px', color: T.muted, fontSize: 13 }}>{a.sub}</td>
                <td style={{ padding: '14px 20px', fontSize: 13, color: T.muted }}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />{a.due}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={a.status === 'Graded' ? badge('#15803d', '#f0fdf4') : a.status === 'Submitted' ? badge(accent, rgba(accent, 0.1)) : badge('#d97706', '#fffbeb')}>{a.status}</span>
                </td>
                <td style={{ padding: '14px 20px' }}>{a.status === 'Pending' && <button style={btnStyle(accent)}>Submit</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderGrades = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Academic Record</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Grades & Results</h1></div>
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans }}>
          <thead><tr style={{ background: '#faf9f7' }}>{['Subject', 'Term 1', 'Term 2', 'Term 3', 'Average', 'Grade'].map(h => <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.light, letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
          <tbody>
            {[{ sub: 'Mathematics', t1: 88, t2: 91, t3: 94, avg: 91, grade: 'A' }, { sub: 'English Literature', t1: 82, t2: 85, t3: 83, avg: 83, grade: 'B+' }, { sub: 'Biology', t1: 90, t2: 88, t3: 92, avg: 90, grade: 'A' }, { sub: 'History', t1: 78, t2: 82, t3: 80, avg: 80, grade: 'B' }, { sub: 'Physical Education', t1: 95, t2: 96, t3: 94, avg: 95, grade: 'A+' }].map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                <td style={{ padding: '14px 20px', fontWeight: 600, color: T.text }}>{r.sub}</td>
                {[r.t1, r.t2, r.t3].map((v, j) => <td key={j} style={{ padding: '14px 20px', color: T.muted, fontSize: 13 }}>{v}%</td>)}
                <td style={{ padding: '14px 20px', fontWeight: 700, color: T.text }}>{r.avg}%</td>
                <td style={{ padding: '14px 20px' }}><span style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 18, fontWeight: 400, color: accent }}>{r.grade}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAttendance = () => {
    const days = Array.from({ length: 23 }, (_, i) => ({ day: i + 1, status: [3, 11, 19].includes(i + 1) ? 'absent' : [7].includes(i + 1) ? 'late' : 'present' }));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Attendance</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Attendance Record</h1></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
          <div style={cardStyle}>
            <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 16px' }}>Summary</p>
            {[{ label: 'Present', value: 19, color: '#059669' }, { label: 'Absent', value: 3, color: '#dc2626' }, { label: 'Late', value: 1, color: '#d97706' }].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.borderLight}` }}>
                <span style={{ color: T.muted, fontSize: 14 }}>{s.label}</span>
                <strong style={{ color: s.color }}>{s.value} days</strong>
              </div>
            ))}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <p style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 40, margin: 0, color: accent }}>96%</p>
              <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Overall Attendance</p>
            </div>
          </div>
          <div style={cardStyle}>
            <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 16px' }}>October 2026</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: T.light, marginBottom: 4 }}>{d}</div>)}
              {days.map(({ day, status }) => (
                <div key={day} style={{ aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, background: status === 'absent' ? '#fef2f2' : status === 'late' ? '#fffbeb' : rgba(accent, 0.1), color: status === 'absent' ? '#dc2626' : status === 'late' ? '#d97706' : accent, border: `1px solid ${status === 'absent' ? '#fecaca' : status === 'late' ? '#fde68a' : rgba(accent, 0.2)}` }}>{day}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInbox = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Communications</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Inbox</h1></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[{ sender: 'Mr. Okonkwo', role: 'Mathematics Teacher', title: 'Test next Monday — please revise Ch. 7 & 8', time: '10:30 AM', unread: true }, { sender: 'Mrs. Adeyemi', role: 'English Teacher', title: 'Your essay has been graded. Well done!', time: 'Yesterday', unread: true }, { sender: 'School Admin', role: 'Administration', title: 'School closed on Friday — staff professional day', time: 'Oct 05', unread: false }].map((msg, i) => (
          <div key={i} style={{ ...cardStyle, display: 'flex', gap: 14, cursor: 'pointer', border: msg.unread ? `1.5px solid ${rgba(accent, 0.3)}` : `1px solid ${T.border}`, transition: 'box-shadow 0.15s' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: msg.unread ? rgba(accent, 0.1) : '#f9f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 18, color: accent, flexShrink: 0 }}>{msg.sender.charAt(0)}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <strong style={{ color: T.text, fontSize: 14 }}>{msg.sender}</strong>
                <span style={{ fontSize: 12, color: T.light }}>{msg.time}</span>
              </div>
              <p style={{ margin: '0 0 3px', fontSize: 12, color: T.light }}>{msg.role}</p>
              <p style={{ margin: 0, fontSize: 13, color: msg.unread ? T.text : T.muted, fontWeight: msg.unread ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.title}</p>
            </div>
            {msg.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0, marginTop: 4 }} />}
          </div>
        ))}
      </div>
    </div>
  );

  const handleGenerateParent = async (e) => {
    e.preventDefault();
    setIsGenerating(true); setParentGenError(null); setParentGenSuccess(null);
    try {
      const API = 'http://localhost:8080';
      const res = await fetch(`${API}/api/parents/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentEmail: config.email, parentName: parentName })
      });
      if (!res.ok) throw new Error((await res.text()) || 'Failed to generate');
      setParentGenSuccess(await res.json());
      setParentName('');
    } catch (err) {
      setParentGenError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderProfile = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Account</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>My Profile</h1></div>
      <div style={{ ...cardStyle, maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, marginBottom: 20, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: rgba(accent, 0.1), border: `2px solid ${rgba(accent, 0.3)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 28, color: accent }}>{name.charAt(0)}</div>
          <div><p style={{ margin: 0, fontWeight: 700, fontSize: 18, color: T.text }}>{name}</p><p style={{ margin: 0, fontSize: 13, color: T.muted }}>{config.email}</p></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[{ label: 'School', value: config.schoolName }, { label: 'Role', value: 'Student' }, { label: 'Email', value: config.email }].map(f => (
            <div key={f.label}><p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{f.label}</p><p style={{ margin: 0, color: T.text, fontWeight: 500 }}>{f.value}</p></div>
          ))}
        </div>
      </div>

      <div style={{ ...cardStyle, maxWidth: 520 }}>
        <h3 style={{ fontFamily: T.fontSans, fontWeight: 700, margin: '0 0 12px', color: T.text }}>Parent Access</h3>
        {parentGenSuccess ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
            <p style={{ margin: '0 0 10px', color: '#15803d', fontWeight: 600 }}>Credentials Generated!</p>
            <p style={{ color: T.muted, fontSize: 13, margin: '0 0 12px' }}>Give these temporary credentials to your parent.</p>
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div><p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: T.light, textTransform: 'uppercase' }}>Email</p><strong style={{ color: T.text, fontSize: 14 }}>{parentGenSuccess.email}</strong></div>
              <div><p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: T.light, textTransform: 'uppercase' }}>Password</p><strong style={{ color: T.text, fontFamily: 'monospace', fontSize: 14 }}>{parentGenSuccess.password}</strong></div>
            </div>
            <button onClick={() => setParentGenSuccess(null)} style={{ ...btnStyle(accent), marginTop: 12, padding: '8px 16px', fontSize: 13 }}>Generate Another</button>
          </div>
        ) : (
          <form onSubmit={handleGenerateParent} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: '0 0 4px', color: T.muted, fontSize: 13 }}>Generate a login for your parent to view your portal.</p>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>Parent's Full Name</label>
              <input type="text" required value={parentName} onChange={e => setParentName(e.target.value)} placeholder="e.g. Richard Doe" style={{ ...inputStyle, padding: '10px 14px' }} />
            </div>
            {parentGenError && <p style={{ color: '#ef4444', fontSize: 12, margin: 0 }}>⚠️ {parentGenError}</p>}
            <button type="submit" disabled={isGenerating} style={{ ...btnStyle(accent), alignSelf: 'flex-start', padding: '10px 16px', fontSize: 13 }}>
              {isGenerating ? 'Generating...' : 'Generate Access'}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'timetable': return renderTimetable();
      case 'classes': return renderClasses();
      case 'assignments': return renderAssignments();
      case 'grades': return renderGrades();
      case 'attendance': return renderAttendance();
      case 'inbox': return renderInbox();
      case 'profile': return renderProfile();
      default: return renderDashboard();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: T.pageBg, fontFamily: T.fontSans }}>
      {/* SIDEBAR */}
      <div style={{ width: 252, background: T.sidebarBg, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${T.borderLight}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <img src="/logo.png" alt="Edvance Logo" style={{ height: 48, objectFit: 'contain', alignSelf: 'flex-start' }} />
            <span style={{ fontSize: 11, color: T.light, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Portal</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {navItems.map(item => <button key={item.id} onClick={() => setActiveTab(item.id)} style={navItemStyle(activeTab === item.id, accent)}><item.icon size={16} />{item.label}</button>)}
        </nav>
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${T.borderLight}` }}>
          <button onClick={() => { localStorage.removeItem('edvance_school_config'); navigate('/login'); }} style={{ ...navItemStyle(false, '#ef4444'), color: '#ef4444' }}><LogOut size={16} />Sign Out</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: '44px 52px', overflowY: 'auto' }}>{renderContent()}</div>

      {/* RIGHT PANEL */}
      <div style={{ width: 260, background: T.sidebarBg, borderLeft: `1px solid ${T.border}`, padding: '24px 18px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 22, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', paddingBottom: 18, borderBottom: `1px solid ${T.borderLight}` }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: rgba(accent, 0.1), border: `2px solid ${rgba(accent, 0.25)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 24, color: accent }}>{name.charAt(0)}</div>
          <p style={{ margin: '0 0 2px', fontWeight: 700, color: T.text, fontSize: 14 }}>{name}</p>
          <span style={badge(accent, rgba(accent, 0.1))}>Student</span>
        </div>
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Stats</p>
          {[{ label: 'GPA', value: '3.8' }, { label: 'Attendance', value: '96%' }, { label: 'Classes', value: '3' }, { label: 'Unread', value: '3' }].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.borderLight}` }}>
              <span style={{ color: T.muted, fontSize: 13 }}>{s.label}</span>
              <strong style={{ color: T.text }}>{s.value}</strong>
            </div>
          ))}
        </div>
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '1px' }}>Notifications</p>
          {[{ text: 'New grade: Math Test 3', time: '2h ago' }, { text: 'Assignment due tomorrow', time: 'Today' }].map((n, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: accent, marginTop: 4, flexShrink: 0 }} />
              <div><p style={{ margin: 0, fontSize: 13, color: T.text }}>{n.text}</p><p style={{ margin: 0, fontSize: 11, color: T.light }}>{n.time}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
