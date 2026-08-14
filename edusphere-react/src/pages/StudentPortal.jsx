import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, FileText, Award, CheckSquare, Mail, User, LogOut, Plus, Clock, ChevronRight, Bell, Download, X } from 'lucide-react';
import { T, rgba, navItemStyle, cardStyle, inputStyle, btnStyle, badge } from '../styles/portalTheme';

export default function StudentPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [config, setConfig] = useState(null);
  
  // Data states
  const [dashboardData, setDashboardData] = useState({ classes: 0, avgScore: 0, unread: 0, chartData: [] });
  const [classesList, setClassesList] = useState([]);
  const [allSchoolClasses, setAllSchoolClasses] = useState([]);
  const [activeClassTab, setActiveClassTab] = useState('my-classes');
  const [selectedEnterClass, setSelectedEnterClass] = useState(null);
  const [classAnnouncements, setClassAnnouncements] = useState([]);
  const [classAssignments, setClassAssignments] = useState([]);
  const [marksList, setMarksList] = useState([]);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [inboxItems, setInboxItems] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile / Parent
  const [parentName, setParentName] = useState('');
  const [parentGenSuccess, setParentGenSuccess] = useState(null);
  const [parentGenError, setParentGenError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Compose Message
  const [showCompose, setShowCompose] = useState(false);
  const [msgRecipient, setMsgRecipient] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSending, setMsgSending] = useState(false);

  const API = 'http://localhost:8080';

  useEffect(() => {
    const raw = localStorage.getItem('edvance_school_config');
    try {
      const p = JSON.parse(raw || '{}');
      if (p.userRole !== 'Student') { navigate('/login'); return; }
      setConfig(p);
    } catch { navigate('/login'); }
  }, [navigate]);

  const fetchData = async () => {
    if (!config) return;
    setLoading(true);
    try {
      const sid = config.id || config.userId || '';
      const schoolId = config.schoolId || '';
      const qs = schoolId ? `?schoolId=${schoolId}` : '';
      
      // Dashboard
      const dashRes = await fetch(`${API}/api/dashboard/student/${sid}${qs}`);
      if (dashRes.ok) {
        const d = await dashRes.json();
        setDashboardData(d);
      }

      // Teachers
      const tRes = await fetch(`${API}/api/users${qs}&role=Teacher`);
      let teachers = [];
      if (tRes.ok) {
        teachers = await tRes.json();
        setTeachersList(teachers);
      }
      const getTeacherName = (id) => {
        const t = teachers.find(t => t.id === id);
        return t ? t.name : 'Unknown Teacher';
      };

      // Classes (Enrollments + Classes)
      const enRes = await fetch(`${API}/api/enrollments${qs}&studentId=${sid}`);
      const clsRes = await fetch(`${API}/api/classes${qs}`);
      if (clsRes.ok) {
        const allCls = await clsRes.json();
        const allWithTeacher = (allCls || []).map(c => ({
          ...c,
          teacherName: getTeacherName(c.teacherId)
        }));
        setAllSchoolClasses(allWithTeacher);

        if (enRes.ok) {
          const enrollments = await enRes.json();
          const myCls = (enrollments || []).map(e => {
            const c = allWithTeacher.find(ac => (ac.id || ac.ID) === e.classId);
            return c ? { ...c, enrollmentId: e.id } : null;
          }).filter(Boolean);
          setClassesList(myCls);
        }
      }

      // Marks
      const mkRes = await fetch(`${API}/api/marks/student/${sid}${qs}`);
      if (mkRes.ok) setMarksList(await mkRes.json());

      // Assignments
      const asmRes = await fetch(`${API}/api/assignments${qs}&studentId=${sid}`);
      if (asmRes.ok) setAssignmentsList(await asmRes.json());

      // Inbox (Messages + Announcements)
      const msgRes = await fetch(`${API}/api/messages?userId=${sid}&box=inbox`);
      const annRes = await fetch(`${API}/api/announcements${qs}&studentId=${sid}`);
      let inbox = [];
      if (msgRes.ok) {
        const msgs = await msgRes.json();
        inbox = [...inbox, ...msgs.map(m => ({ ...m, type: 'message' }))];
      }
      if (annRes.ok) {
        const anns = await annRes.json();
        inbox = [...inbox, ...anns.map(a => ({ ...a, type: 'announcement', isRead: true, senderName: a.teacherName, subject: 'Announcement: ' + (a.title || 'Notice'), body: a.message }))];
      }
      // sort by id descending (rough chronological)
      inbox.sort((a,b) => (b.id || 0) - (a.id || 0));
      setInboxItems(inbox);

      // Attendance
      const attRes = await fetch(`${API}/api/attendance${qs}&studentId=${sid}`);
      if (attRes.ok) {
        setAttendanceData(await attRes.json());
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

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

  // Helper for performance chart
  const renderChart = () => {
    const data = dashboardData.chartData || [];
    if (data.length === 0) {
      return <p style={{ color: T.muted, fontSize: 13, fontStyle: 'italic' }}>No grades recorded yet</p>;
    }
    const maxVal = 100;
    const width = 700;
    const height = 120; // max height of drawing area
    const topPad = 20;
    const spacing = width / Math.max(data.length, 2);
    
    const points = data.map((d, i) => {
      const x = i * spacing + (spacing / 2);
      const y = topPad + height - ((d.avg / maxVal) * height);
      return [x, y];
    });

    const pointsStr = points.map(p => p.join(',')).join(' ');
    const polyPoints = `0,${topPad+height} ${pointsStr} ${width},${topPad+height}`;

    return (
      <>
        <svg viewBox="0 0 700 160" style={{ width: '100%', display: 'block' }}>
          <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity="0.15" /><stop offset="100%" stopColor={accent} stopOpacity="0" /></linearGradient></defs>
          {[0, 40, 80, 120, 160].map((y, i) => <line key={i} x1="0" y1={y} x2="700" y2={y} stroke={T.border} strokeWidth="1" />)}
          <polygon fill="url(#sg)" points={polyPoints} />
          <polyline fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pointsStr} />
          {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill={accent} stroke="white" strokeWidth="2" />)}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {data.map((d, i) => <span key={i} style={{ color: T.light, fontSize: 11, fontWeight: 500 }}>{d.name}</span>)}
        </div>
      </>
    );
  };

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 8px' }}>Student Portal</p>
        <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 38, fontWeight: 400, margin: 0, color: T.text }}>Welcome back, {name} 👋</h1>
        <p style={{ color: T.muted, margin: '8px 0 0', fontSize: 15 }}>Here's an overview of your academic progress.</p>
      </div>

      {loading ? <p>Loading...</p> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Avg Score', value: dashboardData.avgScore.toFixed(1), color: accent },
              { label: 'Classes', value: dashboardData.classes, color: '#059669' },
              { label: 'Unread Msgs', value: dashboardData.unread, color: '#d97706' },
              { label: 'Assignments', value: assignmentsList.length, color: '#dc2626' }
            ].map(s => (
              <div key={s.label} style={{ ...cardStyle, borderTop: `3px solid ${s.color}` }}>
                <p style={{ color: T.muted, fontSize: 13, fontWeight: 500, margin: '0 0 10px' }}>{s.label}</p>
                <p style={{ fontFamily: T.fontSerif, fontSize: 42, margin: 0, color: T.text, lineHeight: 1 }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div style={cardStyle}>
            <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 6px', fontSize: 15 }}>Performance</p>
            <p style={{ color: T.muted, fontSize: 13, margin: '0 0 20px' }}>Average score trend per class</p>
            {renderChart()}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Upcoming deadlines */}
            <div style={cardStyle}>
              <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 16px', fontSize: 15 }}>Upcoming Deadlines</p>
              {assignmentsList.slice(0, 3).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 2 ? `1px solid ${T.borderLight}` : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: T.text }}>{a.title}</p>
                    <p style={{ margin: 0, fontSize: 12, color: T.muted }}>{a.className}</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>{new Date(a.dueDate).toLocaleDateString()}</span>
                </div>
              ))}
              {assignmentsList.length === 0 && <p style={{color: T.muted, fontSize: 13}}>No upcoming deadlines</p>}
            </div>
            {/* Recent grades */}
            <div style={cardStyle}>
              <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 16px', fontSize: 15 }}>Recent Grades</p>
              {marksList.slice(0, 3).map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 2 ? `1px solid ${T.borderLight}` : 'none' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: rgba(accent, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: accent, fontSize: 15, fontFamily: T.fontSerif, flexShrink: 0 }}>
                    {g.score >= 90 ? 'A' : g.score >= 80 ? 'B' : g.score >= 70 ? 'C' : 'D'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: T.text }}>{g.className}</p>
                    <p style={{ margin: 0, fontSize: 12, color: T.muted }}>{g.sequenceName} - {g.score}/100</p>
                  </div>
                </div>
              ))}
              {marksList.length === 0 && <p style={{color: T.muted, fontSize: 13}}>No recent grades</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderTimetable = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Schedule</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Weekly Timetable</h1></div>
      <p style={{color: T.muted, fontSize: 14}}>Timetable set by your school admin.</p>
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

  const handleEnrollSelf = async (classId) => {
    try {
      const res = await fetch(`${API}/api/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: config.schoolId, classId, studentId: config.id })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnenrollSelf = async (classId) => {
    if (!window.confirm('Are you sure you want to unenroll from this class?')) return;
    try {
      const res = await fetch(`${API}/api/enrollments?classId=${classId}&studentId=${config.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnterClassRoom = async (cls) => {
    setSelectedEnterClass(cls);
    const classId = cls.id || cls.ID;
    try {
      const [annRes, asmRes] = await Promise.all([
        fetch(`${API}/api/announcements?classId=${classId}&schoolId=${config.schoolId}`),
        fetch(`${API}/api/assignments?classId=${classId}&schoolId=${config.schoolId}`)
      ]);
      if (annRes.ok) setClassAnnouncements(await annRes.json());
      if (asmRes.ok) setClassAssignments(await asmRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const renderClasses = () => {
    const isEnrolled = (classId) => classesList.some(c => (c.id || c.ID) === classId);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Course Directory</p>
          <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Classes & Enrollment</h1>
        </div>

        {/* Tab pills */}
        <div style={{ display: 'flex', gap: 10, borderBottom: `1px solid ${T.border}`, paddingBottom: 12 }}>
          <button
            onClick={() => setActiveClassTab('my-classes')}
            style={{
              padding: '8px 18px', borderRadius: 100, border: 'none', cursor: 'pointer',
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
              background: activeClassTab === 'my-classes' ? accent : rgba(accent, 0.08),
              color: activeClassTab === 'my-classes' ? '#fff' : accent,
              transition: 'all 0.15s'
            }}
          >
            My Enrolled Classes ({classesList.length})
          </button>
          <button
            onClick={() => setActiveClassTab('available')}
            style={{
              padding: '8px 18px', borderRadius: 100, border: 'none', cursor: 'pointer',
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
              background: activeClassTab === 'available' ? accent : rgba(accent, 0.08),
              color: activeClassTab === 'available' ? '#fff' : accent,
              transition: 'all 0.15s'
            }}
          >
            Browse All School Classes ({allSchoolClasses.length})
          </button>
        </div>

        {loading ? <p style={{ color: T.muted }}>Loading classes...</p> : activeClassTab === 'my-classes' ? (
          classesList.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px' }}>
              <BookOpen size={36} style={{ color: T.light, marginBottom: 12 }} />
              <h3 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', margin: '0 0 6px', color: T.text }}>Not Enrolled in Any Class Yet</h3>
              <p style={{ color: T.muted, fontSize: 14, margin: '0 0 16px' }}>Explore available classes created by your teachers and enroll in one click!</p>
              <button onClick={() => setActiveClassTab('available')} style={btnStyle(accent)}>
                <Plus size={15} /> Browse Available Classes
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
              {classesList.map((cls, i) => {
                const classId = cls.id || cls.ID;
                return (
                  <div key={i} style={{ ...cardStyle, borderTop: `3px solid ${accent}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 20, margin: '0 0 4px', color: T.text }}>{cls.name}</h3>
                        <span style={badge('#15803d', '#f0fdf4')}>Enrolled</span>
                      </div>
                      <p style={{ color: accent, margin: '0 0 14px', fontSize: 13, fontWeight: 600 }}>{cls.subject} · {cls.teacherName}</p>
                      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.muted }}>
                        <span>Year / Level</span><strong style={{ color: T.text }}>{cls.year || 'All Levels'}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button onClick={() => handleEnterClassRoom(cls)} style={{ ...btnStyle(accent), flex: 1, justifyContent: 'center', fontSize: 13, padding: '9px 12px' }}>
                        Enter Class <ChevronRight size={14} />
                      </button>
                      <button onClick={() => handleUnenrollSelf(classId)} style={{ ...btnStyle('#ef4444', true), border: '1px solid #fecaca', background: '#fef2f2', padding: '8px 12px', fontSize: 12 }}>
                        Leave
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Available / All School Classes */
          allSchoolClasses.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px', color: T.muted }}>
              <p>No classes created in your school yet. Once your admin or teacher creates a class, it will appear here!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
              {allSchoolClasses.map((cls, i) => {
                const classId = cls.id || cls.ID;
                const enrolled = isEnrolled(classId);
                return (
                  <div key={i} style={{ ...cardStyle, borderTop: `3px solid ${enrolled ? '#10b981' : accent}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 20, margin: '0 0 4px', color: T.text }}>{cls.name}</h3>
                        {enrolled && <span style={badge('#15803d', '#f0fdf4')}>Enrolled</span>}
                      </div>
                      <p style={{ color: accent, margin: '0 0 14px', fontSize: 13, fontWeight: 600 }}>{cls.subject}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: T.muted, marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Teacher</span><strong style={{ color: T.text }}>{cls.teacherName}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Level / Year</span><strong style={{ color: T.text }}>{cls.year || 'All Levels'}</strong></div>
                      </div>
                    </div>
                    {enrolled ? (
                      <button onClick={() => handleEnterClassRoom(cls)} style={{ ...btnStyle(accent), width: '100%', justifyContent: 'center', fontSize: 13 }}>
                        Enter Class Portal <ChevronRight size={14} />
                      </button>
                    ) : (
                      <button onClick={() => handleEnrollSelf(classId)} style={{ ...btnStyle(accent), width: '100%', justifyContent: 'center', fontSize: 13 }}>
                        <Plus size={15} /> Enroll in Class
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* CLASS ROOM MODAL */}
        {selectedEnterClass && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ ...cardStyle, width: '100%', maxWidth: 640, padding: 32, position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}>
              <button onClick={() => setSelectedEnterClass(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={20} /></button>
              
              <div style={{ borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 16, marginBottom: 20 }}>
                <span style={badge(accent, rgba(accent, 0.1))}>{selectedEnterClass.subject}</span>
                <h2 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', margin: '8px 0 4px', fontSize: 30, color: T.text }}>{selectedEnterClass.name}</h2>
                <p style={{ margin: 0, fontSize: 13, color: T.muted }}>Teacher: <strong style={{ color: T.text }}>{selectedEnterClass.teacherName}</strong> · Level: <strong style={{ color: T.text }}>{selectedEnterClass.year || 'All Levels'}</strong></p>
              </div>

              {/* Class Announcements */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontFamily: T.fontSans, fontWeight: 700, fontSize: 15, color: T.text, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell size={16} color={accent} /> Class Announcements ({classAnnouncements.length})
                </h4>
                {classAnnouncements.length === 0 ? (
                  <p style={{ fontSize: 13, color: T.muted, fontStyle: 'italic' }}>No announcements for this class yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {classAnnouncements.map((a, idx) => (
                      <div key={idx} style={{ padding: '12px 14px', borderRadius: 8, background: '#faf9f7', border: `1px solid ${T.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <strong style={{ fontSize: 13, color: T.text }}>{a.teacherName || 'Teacher'}</strong>
                          <span style={{ fontSize: 11, color: T.light }}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: T.text, lineHeight: 1.5 }}>{a.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Class Assignments */}
              <div>
                <h4 style={{ fontFamily: T.fontSans, fontWeight: 700, fontSize: 15, color: T.text, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} color={accent} /> Class Assignments ({classAssignments.length})
                </h4>
                {classAssignments.length === 0 ? (
                  <p style={{ fontSize: 13, color: T.muted, fontStyle: 'italic' }}>No assignments posted for this class yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {classAssignments.map((asm, idx) => (
                      <div key={idx} style={{ padding: '14px', borderRadius: 8, background: '#fff', border: `1px solid ${T.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: 14, color: T.text, display: 'block' }}>{asm.title}</strong>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: T.muted }}>Due: {new Date(asm.dueDate).toLocaleDateString()}</p>
                          {asm.description && <p style={{ margin: '6px 0 0', fontSize: 13, color: T.text }}>{asm.description}</p>}
                        </div>
                        <button onClick={() => handleDownloadAssignment(asm)} style={{ ...btnStyle(accent, true), padding: '6px 12px', fontSize: 12 }}>
                          <Download size={13} /> Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleDownloadAssignment = (a) => {
    const text = `Assignment: ${a.title}\nClass: ${a.className}\nDue Date: ${a.dueDate}\n\nDescription:\n${a.description}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${a.title}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderAssignments = () => {
    const now = new Date();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Tasks</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Assignments</h1></div>
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans }}>
            <thead><tr style={{ background: '#faf9f7' }}>{['Assignment', 'Class', 'Due Date', 'Status', ''].map(h => <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.light, letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} style={{padding: 20}}>Loading...</td></tr> : assignmentsList.length === 0 ? <tr><td colSpan={5} style={{padding: 20, color: T.muted}}>No assignments found.</td></tr> : assignmentsList.map((a, i) => {
                const isOverdue = new Date(a.dueDate) < now;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: T.text, fontSize: 14 }}>{a.title}</td>
                    <td style={{ padding: '14px 20px', color: T.muted, fontSize: 13 }}>{a.className}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: T.muted }}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />{new Date(a.dueDate).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={isOverdue ? badge('#dc2626', '#fef2f2') : badge(accent, rgba(accent, 0.1))}>{isOverdue ? 'Overdue' : 'Upcoming'}</span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button onClick={() => handleDownloadAssignment(a)} style={{...btnStyle(accent, true), padding: '6px 12px', fontSize: 12}}><Download size={14}/> Download</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderGrades = () => {
    // Group marks by className
    const grouped = {};
    marksList.forEach(m => {
      if (!grouped[m.className]) grouped[m.className] = [];
      grouped[m.className].push(m);
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Academic Record</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Grades & Results</h1></div>
          <button onClick={() => alert('Report Card download coming soon')} style={{...btnStyle(accent)}}><Award size={16} /> Report Card</button>
        </div>
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans }}>
            <thead><tr style={{ background: '#faf9f7' }}>{['Class', 'Marks', 'Average', 'Grade'].map(h => <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.light, letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={4} style={{padding: 20}}>Loading...</td></tr> : Object.keys(grouped).length === 0 ? <tr><td colSpan={4} style={{padding: 20, color: T.muted}}>No grades recorded yet.</td></tr> : Object.entries(grouped).map(([cName, marks], i) => {
                const total = marks.reduce((sum, m) => sum + m.score, 0);
                const avg = total / marks.length;
                const grade = avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 60 ? 'D' : 'F';
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: T.text }}>{cName}</td>
                    <td style={{ padding: '14px 20px', color: T.muted, fontSize: 13 }}>
                      {marks.map((m, j) => <span key={j} style={{marginRight: 8}}>{m.sequenceName}: <strong>{m.score}</strong></span>)}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: T.text }}>{avg.toFixed(1)}%</td>
                    <td style={{ padding: '14px 20px' }}><span style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 18, fontWeight: 400, color: accent }}>{grade}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAttendance = () => {
    let present = 0, absent = 0, late = 0;
    attendanceData.forEach(a => {
      const status = a.records[config.id];
      if (status === 'Present') present++;
      else if (status === 'Absent') absent++;
      else if (status === 'Late') late++;
    });
    const total = present + absent + late;
    const pct = total === 0 ? 0 : Math.round((present / total) * 100);

    const getStatusForDay = (dayNum) => {
      // rough matching for demo: just match day of month if date string has it
      const record = attendanceData.find(a => new Date(a.date).getDate() === dayNum);
      if (record && record.records[config.id]) {
        return record.records[config.id].toLowerCase();
      }
      return null; // no record
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Attendance</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Attendance Record</h1></div>
        
        {loading ? <p>Loading attendance...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
            <div style={cardStyle}>
              <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 16px' }}>Summary</p>
              {[{ label: 'Present', value: present, color: '#059669' }, { label: 'Absent', value: absent, color: '#dc2626' }, { label: 'Late', value: late, color: '#d97706' }].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.borderLight}` }}>
                  <span style={{ color: T.muted, fontSize: 14 }}>{s.label}</span>
                  <strong style={{ color: s.color }}>{s.value} days</strong>
                </div>
              ))}
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <p style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 40, margin: 0, color: accent }}>{pct}%</p>
                <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Overall Attendance</p>
              </div>
            </div>
            <div style={cardStyle}>
              <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 16px' }}>Current Month</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: T.light, marginBottom: 4 }}>{d}</div>)}
                {Array.from({ length: 30 }, (_, i) => {
                  const day = i + 1;
                  const status = getStatusForDay(day) || 'present'; // default present if no specific record (or empty)
                  // For demo, if no record, show neutral, but instruction said show calendar
                  return (
                    <div key={day} style={{ aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, background: status === 'absent' ? '#fef2f2' : status === 'late' ? '#fffbeb' : rgba(accent, 0.1), color: status === 'absent' ? '#dc2626' : status === 'late' ? '#d97706' : accent, border: `1px solid ${status === 'absent' ? '#fecaca' : status === 'late' ? '#fde68a' : rgba(accent, 0.2)}` }}>{day}</div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleReadMessage = async (msg) => {
    if (msg.type !== 'message' || msg.isRead) return;
    try {
      await fetch(`${API}/api/messages/${msg.id}/read`, { method: 'PUT' });
      setInboxItems(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
      // update unread count locally
      setDashboardData(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setMsgSending(true);
    try {
      const payload = {
        schoolId: config.schoolId,
        senderId: config.id,
        senderName: config.name,
        senderRole: config.userRole,
        recipientId: parseInt(msgRecipient, 10),
        subject: msgSubject,
        body: msgBody
      };
      const res = await fetch(`${API}/api/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowCompose(false);
        setMsgSubject(''); setMsgBody(''); setMsgRecipient('');
        alert('Message sent!');
      }
    } catch (e) {
      alert('Error sending message');
    } finally {
      setMsgSending(false);
    }
  };

  const renderInbox = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Communications</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Inbox</h1></div>
        <button onClick={() => setShowCompose(true)} style={btnStyle(accent)}><Plus size={16}/> Compose</button>
      </div>

      {loading ? <p>Loading messages...</p> : inboxItems.length === 0 ? <p style={{color: T.muted}}>Inbox is empty</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {inboxItems.map((msg, i) => (
            <div key={i} onClick={() => handleReadMessage(msg)} style={{ ...cardStyle, display: 'flex', gap: 14, cursor: 'pointer', border: !msg.isRead ? `1.5px solid ${rgba(accent, 0.3)}` : `1px solid ${T.border}`, transition: 'box-shadow 0.15s' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: !msg.isRead ? rgba(accent, 0.1) : '#f9f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 18, color: accent, flexShrink: 0 }}>
                {msg.type === 'announcement' ? <Bell size={20} /> : msg.senderName ? msg.senderName.charAt(0) : '?'}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <strong style={{ color: T.text, fontSize: 14 }}>{msg.senderName || 'Unknown'} {msg.type === 'announcement' && <span style={badge('#059669', '#d1fae5')}>Announcement</span>}</strong>
                </div>
                <p style={{ margin: '0 0 3px', fontSize: 13, color: !msg.isRead ? T.text : T.muted, fontWeight: !msg.isRead ? 600 : 500 }}>{msg.subject}</p>
                <p style={{ margin: 0, fontSize: 13, color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.body}</p>
              </div>
              {!msg.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0, marginTop: 4 }} />}
            </div>
          ))}
        </div>
      )}

      {showCompose && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...cardStyle, width: '100%', maxWidth: 500, padding: 30, position: 'relative' }}>
            <button onClick={() => setShowCompose(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: T.light }}><X size={20}/></button>
            <h2 style={{ fontFamily: T.fontSerif, margin: '0 0 20px', fontSize: 24, color: T.text }}>Compose Message</h2>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>To (Teacher)</label>
                <select required value={msgRecipient} onChange={e => setMsgRecipient(e.target.value)} style={{...inputStyle, width: '100%'}}>
                  <option value="">Select a teacher...</option>
                  {teachersList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>Subject</label>
                <input required type="text" value={msgSubject} onChange={e => setMsgSubject(e.target.value)} style={{...inputStyle, width: '100%'}} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>Message</label>
                <textarea required rows={5} value={msgBody} onChange={e => setMsgBody(e.target.value)} style={{...inputStyle, width: '100%', resize: 'none'}} />
              </div>
              <button disabled={msgSending} type="submit" style={{ ...btnStyle(accent), alignSelf: 'flex-end', marginTop: 10 }}>{msgSending ? 'Sending...' : 'Send Message'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const handleGenerateParent = async (e) => {
    e.preventDefault();
    setIsGenerating(true); setParentGenError(null); setParentGenSuccess(null);
    try {
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
          {[{ label: 'School', value: config.schoolName || 'Your School' }, { label: 'Role', value: 'Student' }, { label: 'Email', value: config.email }].map(f => (
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
          {[{ label: 'Avg Score', value: dashboardData.avgScore.toFixed(1) }, { label: 'Classes', value: dashboardData.classes }, { label: 'Unread', value: dashboardData.unread }].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.borderLight}` }}>
              <span style={{ color: T.muted, fontSize: 13 }}>{s.label}</span>
              <strong style={{ color: T.text }}>{s.value}</strong>
            </div>
          ))}
        </div>
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '1px' }}>Recent</p>
          {dashboardData.unread > 0 && (
            <div style={{ padding: '10px 0', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: accent, marginTop: 4, flexShrink: 0 }} />
              <div><p style={{ margin: 0, fontSize: 13, color: T.text }}>You have {dashboardData.unread} unread messages</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
