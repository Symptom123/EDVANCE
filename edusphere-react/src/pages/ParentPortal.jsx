import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Award, Mail, LogOut, FileText, Send, X, Plus, User, Menu, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Eye, Paperclip, Download, FileCheck } from 'lucide-react';
import { T, rgba, navItemStyle, cardStyle, badge, inputStyle, btnStyle } from '../styles/portalTheme';
import DocumentViewerModal, { triggerFileDownload, formatFileSize } from '../components/DocumentViewerModal';

export default function ParentPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [config, setConfig] = useState(null);
  
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [linkChildEmail, setLinkChildEmail] = useState('');
  const [linkChildPass, setLinkChildPass] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [linkError, setLinkError] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // Data states
  const [dashboardData, setDashboardData] = useState({ classes: 0, avgScore: 0, unread: 0, chartData: [] });
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [marks, setMarks] = useState([]);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [studentSubmissions, setStudentSubmissions] = useState({});
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [teachers, setTeachers] = useState([]);

  // Compose Message
  const [showCompose, setShowCompose] = useState(false);
  const [composeRecip, setComposeRecip] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchChildren = async (parentId) => {
    try {
      const API = import.meta.env.VITE_API_URL;
      const res = await fetch(`${API}/api/parents/${parentId}/children`);
      const data = await res.json();
      setChildren(data || []);
      if (data && data.length > 0 && !selectedChild) {
        setSelectedChild(data[0]);
      }
    } catch (err) { console.error(err); }
  };

  const fetchMessages = async (userId) => {
    try {
      setLoadingMessages(true);
      const API = import.meta.env.VITE_API_URL;
      const res = await fetch(`${API}/api/messages?userId=${userId}&box=inbox`);
      const data = await res.json();
      setMessages(data || []);
    } catch(err) { console.error(err); } finally { setLoadingMessages(false); }
  };

  useEffect(() => {
    const raw = localStorage.getItem('edvance_school_config');
    try {
      const p = JSON.parse(raw || '{}');
      if (p.userRole !== 'Parent') { navigate('/login'); return; }
      setConfig(p);
      fetchChildren(p.userId);
      fetchMessages(p.userId);
    } catch { navigate('/login'); }
  }, [navigate]);

  useEffect(() => {
    if (!selectedChild) return;
    const fetchChildData = async () => {
      const { ID: studentId, schoolId } = selectedChild;
      const API = import.meta.env.VITE_API_URL;
      
      setLoadingDashboard(true);
      fetch(`${API}/api/dashboard/student/${studentId}?schoolId=${schoolId}`)
        .then(r => r.json())
        .then(d => setDashboardData(d || { classes: 0, avgScore: 0, unread: 0, chartData: [] }))
        .catch(console.error)
        .finally(() => setLoadingDashboard(false));
      
      setLoadingMarks(true);
      fetch(`${API}/api/marks/student/${studentId}?schoolId=${schoolId}`)
        .then(r => r.json())
        .then(d => setMarks(d || []))
        .catch(console.error)
        .finally(() => setLoadingMarks(false));

      setLoadingAttendance(true);
      fetch(`${API}/api/attendance?studentId=${studentId}&schoolId=${schoolId}`)
        .then(r => r.json())
        .then(d => setAttendance(d || []))
        .catch(console.error)
        .finally(() => setLoadingAttendance(false));

      setLoadingAssignments(true);
      fetch(`${API}/api/assignments?schoolId=${schoolId}&studentId=${studentId}`)
        .then(r => r.json())
        .then(d => setAssignments(d || []))
        .catch(console.error)
        .finally(() => setLoadingAssignments(false));

      fetch(`${API}/api/assignments/student-submissions?studentId=${studentId}`)
        .then(r => r.json())
        .then(d => {
          const map = {};
          if (Array.isArray(d)) {
            d.forEach(s => { map[s.assignmentId] = s; });
          }
          setStudentSubmissions(map);
        })
        .catch(console.error);
        
      fetch(`${API}/api/users?schoolId=${schoolId}&role=Teacher`)
        .then(r => r.json())
        .then(d => setTeachers(d || []))
        .catch(console.error);
    };
    fetchChildData();
  }, [selectedChild]);

  const handleLinkChild = async (e) => {
    e.preventDefault();
    setIsLinking(true); setLinkError(''); setLinkSuccess('');
    try {
      const API = import.meta.env.VITE_API_URL;
      const res = await fetch(`${API}/api/parents/link-child`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: config.userId, childEmail: linkChildEmail, childPass: linkChildPass })
      });
      if (!res.ok) throw new Error((await res.text()) || 'Failed to link');
      setLinkSuccess('Child linked successfully!');
      setLinkChildEmail(''); setLinkChildPass('');
      fetchChildren(config.userId);
      setTimeout(() => setLinkSuccess(''), 3000);
    } catch (err) {
      setLinkError(err.message);
    } finally {
      setIsLinking(false);
    }
  };

  const markRead = async (msgId) => {
    try {
      const API = import.meta.env.VITE_API_URL;
      await fetch(`${API}/api/messages/${msgId}/read`, { method: 'PUT' });
      setMessages(msgs => msgs.map(m => m.id === msgId ? { ...m, read: true } : m));
    } catch(err) { console.error(err); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!composeRecip || !composeSubject || !composeBody) return;
    setSendingMessage(true);
    try {
      const API = import.meta.env.VITE_API_URL;
      const payload = {
        schoolId: selectedChild.schoolId,
        senderId: config.userId,
        senderName: config.name,
        senderRole: 'Parent',
        recipientId: parseInt(composeRecip),
        subject: composeSubject,
        body: composeBody
      };
      const res = await fetch(`${API}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowCompose(false);
        setComposeSubject('');
        setComposeBody('');
        fetchMessages(config.userId);
      }
    } catch(err) { console.error(err); }
    finally { setSendingMessage(false); }
  };

  if (!config) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: '#f5f4f0' }}>
      <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
      <p style={{ color: '#9ca3af', fontSize: 14, fontFamily: 'system-ui' }}>Loading your portal...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  const accent = config.primaryColor || '#2563eb';
  const name = config.name || 'Parent';

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare },
    { id: 'grades', label: 'Grades', icon: Award },
    { id: 'messages', label: 'Messages', icon: Mail },
  ];

  const renderOverview = () => {
    const recentMarks = [...marks].reverse().slice(0, 5);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 8px' }}>Parent Portal</p>
          <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 38, fontWeight: 400, margin: 0, color: T.text }}>Hello, {name} 👋</h1>
          <p style={{ color: T.muted, margin: '8px 0 0', fontSize: 15 }}>Here's the latest update on {selectedChild.name}'s progress.</p>
        </div>
        
        {loadingDashboard ? <p style={{ color: T.muted }}>Loading dashboard...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { 
                label: "Child's Attendance", 
                value: attendance.length > 0 ? `${Math.round((attendance.filter(a => String(a.status).toLowerCase() === 'present' || String(a.status).toLowerCase() === 'late').length / attendance.length) * 100)}%` : 'No Record', 
                color: '#059669' 
              }, 
              { label: 'Current GPA', value: `${Number(dashboardData.avgScore || 0).toFixed(1)}/20`, color: accent }, 
              { label: 'Classes', value: dashboardData.classes || '0', color: '#d97706' }
            ].map(s => (
              <div key={s.label} style={{ ...cardStyle, borderTop: `3px solid ${s.color}` }}>
                <p style={{ color: T.muted, fontSize: 13, fontWeight: 500, margin: '0 0 10px' }}>{s.label}</p>
                <p style={{ fontFamily: T.fontSerif, fontSize: 42, margin: 0, color: T.text, lineHeight: 1 }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          <div style={cardStyle}>
            <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 16px', fontSize: 15 }}>Recent Activity</p>
            {loadingMarks ? <p style={{ color: T.muted }}>Loading activity...</p> : recentMarks.length === 0 ? <p style={{ color: T.muted, fontSize: 13 }}>No activity yet</p> : recentMarks.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < recentMarks.length - 1 ? `1px solid ${T.borderLight}` : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: rgba(accent, 0.1), color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={16} /></div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: T.text }}>Grade recorded: {m.className}</p>
                  <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Score: {m.score}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderAttendance = () => {
    const present = attendance.filter(a => a.status === 'Present').length;
    const absent = attendance.filter(a => a.status === 'Absent').length;
    const late = attendance.filter(a => a.status === 'Late').length;
    const total = attendance.length;
    const pct = total > 0 ? Math.round((present + late) / total * 100) : 0;

    const days = attendance.map(a => {
      const d = new Date(a.date);
      return { day: d.getDate(), status: a.status.toLowerCase() };
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Attendance</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Attendance Record</h1></div>
        {loadingAttendance ? <p style={{ color: T.muted }}>Loading attendance...</p> : attendance.length === 0 ? <p style={{color: T.muted}}>No attendance records yet</p> : (
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
              <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 16px' }}>Recorded Days</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {days.map(({ day, status }, i) => (
                  <div key={i} style={{ aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, background: status === 'absent' ? '#fef2f2' : status === 'late' ? '#fffbeb' : rgba(accent, 0.1), color: status === 'absent' ? '#dc2626' : status === 'late' ? '#d97706' : accent, border: `1px solid ${status === 'absent' ? '#fecaca' : status === 'late' ? '#fde68a' : rgba(accent, 0.2)}` }}>{day}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGrades = () => {
    const byClass = marks.reduce((acc, m) => {
      if (!acc[m.className]) acc[m.className] = { marks: [], total: 0 };
      acc[m.className].marks.push(m);
      acc[m.className].total += m.score;
      return acc;
    }, {});
    
    const rows = Object.keys(byClass).map(c => {
      const avg = (byClass[c].total / byClass[c].marks.length).toFixed(1);
      return {
        sub: c,
        latest: `Avg: ${avg}`,
        avg,
        pass: parseFloat(avg) >= 10
      };
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Academic Record</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Grades</h1></div>
        {loadingMarks ? <p style={{ color: T.muted }}>Loading grades...</p> : rows.length === 0 ? <p style={{color: T.muted}}>No grades yet for this child</p> : (
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans }}>
              <thead><tr style={{ background: '#faf9f7' }}>{['Subject', 'Term Average', 'Status'].map(h => <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.light, letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: T.text }}>{r.sub}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: T.text }}>{r.avg}</td>
                    <td style={{ padding: '14px 20px' }}><span style={r.pass ? badge('#15803d', '#f0fdf4') : badge('#dc2626', '#fef2f2')}>{r.pass ? 'Pass' : 'Fail'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderMessages = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Communications</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Messages</h1></div>
        {selectedChild && <button onClick={() => setShowCompose(true)} style={{ ...btnStyle(accent), display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> Compose Message</button>}
      </div>

      {showCompose && (
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontFamily: T.fontSans }}>New Message</h3>
            <button onClick={() => setShowCompose(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <select required value={composeRecip} onChange={e => setComposeRecip(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
              <option value="">Select Teacher</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input required type="text" placeholder="Subject" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} style={inputStyle} />
            <textarea required placeholder="Message body..." value={composeBody} onChange={e => setComposeBody(e.target.value)} style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} />
            <button disabled={sendingMessage} type="submit" style={{ ...btnStyle(accent), alignSelf: 'flex-start' }}>
              {sendingMessage ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      )}

      {loadingMessages ? <p style={{ color: T.muted }}>Loading messages...</p> : messages.length === 0 ? <p style={{color: T.muted}}>No messages yet.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg, i) => (
            <div key={i} onClick={() => { if(!msg.read) markRead(msg.id); }} style={{ ...cardStyle, display: 'flex', gap: 14, cursor: 'pointer', border: !msg.read ? `1.5px solid ${rgba(accent, 0.3)}` : `1px solid ${T.border}`, transition: 'box-shadow 0.15s' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: !msg.read ? rgba(accent, 0.1) : '#f9f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 18, color: accent, flexShrink: 0 }}>{(msg.senderName || '?').charAt(0)}</div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <strong style={{ color: T.text, fontSize: 14 }}>{msg.senderName}</strong>
                  <span style={{ fontSize: 12, color: T.light }}>{new Date(msg.createdAt).toLocaleDateString()}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: !msg.read ? T.text : T.muted, fontWeight: !msg.read ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.subject}</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>{msg.body}</p>
              </div>
              {!msg.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0, marginTop: 4 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAssignments = () => {
    const now = new Date();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Coursework</p>
          <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>{selectedChild.name}'s Assignments</h1>
          <p style={{ color: T.muted, fontSize: 14, margin: '6px 0 0' }}>Review assigned homework, teacher worksheets, turned-in files, and grading feedback.</p>
        </div>

        {loadingAssignments ? (
          <p style={{ color: T.muted }}>Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px' }}>
            <FileText size={36} style={{ color: T.light, marginBottom: 12 }} />
            <h3 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', margin: '0 0 6px', color: T.text }}>No Assignments Found</h3>
            <p style={{ color: T.muted, fontSize: 14 }}>No assignments are currently posted for {selectedChild.name}'s classes.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {assignments.map((a, i) => {
              const sub = studentSubmissions[a.id || a.ID];
              const isOverdue = new Date(a.dueDate) < now && !sub;
              const isGraded = sub && sub.status === 'graded';
              const isSubmitted = sub && sub.status === 'submitted';

              return (
                <div key={a.id || i} style={{ ...cardStyle, borderLeft: `4px solid ${isGraded ? '#10b981' : isSubmitted ? '#3b82f6' : isOverdue ? '#ef4444' : accent}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={badge(accent, rgba(accent, 0.1))}>{a.className || 'Class'}</span>
                      {isGraded ? (
                        <span style={badge('#15803d', '#dcfce7')}>Score: {sub.grade}/{a.maxPoints || 20}</span>
                      ) : isSubmitted ? (
                        <span style={badge('#1d4ed8', '#dbeafe')}>✓ Turned In</span>
                      ) : isOverdue ? (
                        <span style={badge('#dc2626', '#fee2e2')}>Overdue</span>
                      ) : (
                        <span style={badge('#d97706', '#fef9c3')}>Due {new Date(a.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>

                    <h3 style={{ fontFamily: T.fontSans, fontWeight: 700, fontSize: 16, margin: '8px 0 4px', color: T.text }}>{a.title}</h3>
                    <p style={{ color: T.muted, fontSize: 12, margin: '0 0 10px' }}>Teacher: {a.teacherName || 'Instructor'} | Max: {a.maxPoints || 20} pts</p>
                    <p style={{ color: T.text, fontSize: 14, lineHeight: 1.5, margin: '0 0 12px' }}>{a.description}</p>

                    {/* Teacher Attached Worksheet */}
                    {a.fileUrl && (
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                          <Paperclip size={14} color={accent} style={{ flexShrink: 0 }} />
                          <div style={{ overflow: 'hidden' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '170px' }}>
                              {a.fileName || 'Teacher Worksheet'}
                            </span>
                            {a.fileSize > 0 && <span style={{ fontSize: 11, color: T.muted }}>{formatFileSize(a.fileSize)}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => setViewingDoc({ url: a.fileUrl, fileName: a.fileName, fileSize: a.fileSize, fileType: a.fileType })}
                            style={{ ...btnStyle(accent, true), padding: '4px 8px', fontSize: 11, borderRadius: 4 }}
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerFileDownload(a.fileUrl, a.fileName)}
                            style={{ ...btnStyle(accent), padding: '4px 8px', fontSize: 11, borderRadius: 4 }}
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Teacher Feedback Callout */}
                    {isGraded && sub.feedback && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', margin: '0 0 12px' }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#15803d' }}>Teacher's Feedback:</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#166534', fontStyle: 'italic' }}>"{sub.feedback}"</p>
                      </div>
                    )}

                    {/* Child's Submission Preview */}
                    {sub && (
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', margin: '0 0 8px', fontSize: 12 }}>
                        {sub.content && (
                          <div style={{ color: '#64748b', marginBottom: sub.fileUrl ? 8 : 0 }}>
                            <strong style={{ color: T.text }}>Submitted Work:</strong> {sub.content.length > 80 ? sub.content.slice(0, 80) + '...' : sub.content}
                          </div>
                        )}
                        {sub.fileUrl && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                              <FileCheck size={14} color="#16a34a" />
                              <span style={{ fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                {sub.fileName || 'Student Submission'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button
                                type="button"
                                onClick={() => setViewingDoc({ url: sub.fileUrl, fileName: sub.fileName, fileSize: sub.fileSize, fileType: sub.fileType })}
                                style={{ ...btnStyle(accent, true), padding: '2px 6px', fontSize: 11, borderRadius: 4 }}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => triggerFileDownload(sub.fileUrl, sub.fileName)}
                                style={{ ...btnStyle(accent), padding: '2px 6px', fontSize: 11, borderRadius: 4 }}
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (children.length === 0) return <div style={{ padding: '44px 52px' }}><p style={{color: T.muted}}>Select a child from the sidebar or link a new child</p></div>;
    if (!selectedChild) return <div style={{ padding: '44px 52px' }}><p style={{color: T.muted}}>Select a child from the sidebar</p></div>;

    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'assignments': return renderAssignments();
      case 'attendance': return renderAttendance();
      case 'grades': return renderGrades();
      case 'messages': return renderMessages();
      default: return renderOverview();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: T.pageBg, fontFamily: T.fontSans }}>

      {/* MOBILE HEADER */}
      <div className="portal-mobile-header print-hide">
        <button className="portal-mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle navigation">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <img src="/logo.png" alt="Edvance Logo" style={{ height: 28, objectFit: 'contain' }} />
        <span className="portal-mobile-role-badge">Parent</span>
      </div>

      {sidebarOpen && <div
        className={`portal-sidebar print-hide portal-sidebar--open`}
        style={{ width: 256, background: T.sidebarBg, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}
      >
        <button className="portal-sidebar-overlay-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">✕</button>

        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${T.borderLight}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <img src="/logo.png" alt="Edvance Logo" style={{ height: 48, objectFit: 'contain', alignSelf: 'flex-start' }} />
            <span style={{ fontSize: 11, color: T.light, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Parent Portal</span>
          </div>
        </div>

        {/* Child selector */}
        {children.length > 0 && (
          <div style={{ padding: '12px 12px', borderBottom: `1px solid ${T.borderLight}` }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase' }}>Child</p>
            {children.map(c => (
              <button key={c.id} onClick={() => { setSelectedChild(c); setSidebarOpen(false); }} style={{ ...navItemStyle(selectedChild?.id === c.id, accent), marginBottom: 2 }}>
                <User size={14} />{c.name}
              </button>
            ))}
          </div>
        )}

        <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} style={navItemStyle(activeTab === item.id, accent)}>
              <item.icon size={16} />{item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${T.borderLight}` }}>
          <button onClick={() => { localStorage.removeItem('edvance_school_config'); navigate('/login'); }} style={{ ...navItemStyle(false, '#ef4444'), color: '#ef4444' }}><LogOut size={16} />Sign Out</button>
        </div>
      </div>}
      {sidebarOpen && <div className="portal-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* MAIN */}
      <div className="print-main portal-main-content" style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <div className="portal-desktop-toolbar print-hide">
          <button className="portal-desktop-toggle-btn" onClick={() => setSidebarOpen(v => !v)} title={sidebarOpen ? 'Hide left sidebar' : 'Show left sidebar'}>
            {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
            <span>{sidebarOpen ? 'Hide Nav' : 'Show Nav'}</span>
          </button>
          <button className="portal-desktop-toggle-btn" onClick={() => setRightPanelOpen(v => !v)} title={rightPanelOpen ? 'Hide right panel' : 'Show right panel'}>
            {rightPanelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
            <span>{rightPanelOpen ? 'Hide Panel' : 'Show Panel'}</span>
          </button>
        </div>
        <div style={{ padding: '12px 52px 48px' }}>{renderContent()}</div>
      </div>

      {rightPanelOpen && <div className="portal-right-panel print-hide" style={{ width: 256, background: T.sidebarBg, borderLeft: `1px solid ${T.border}`, padding: '24px 18px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', paddingBottom: 16, borderBottom: `1px solid ${T.borderLight}` }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: rgba(accent, 0.1), border: `2px solid ${rgba(accent, 0.25)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 22, color: accent }}>{name.charAt(0)}</div>
          <p style={{ margin: '0 0 2px', fontWeight: 700, color: T.text, fontSize: 14 }}>{name}</p>
          <span style={badge(accent, rgba(accent, 0.1))}>Guardian</span>
        </div>
        {selectedChild && (
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '1px' }}>Viewing</p>
            <div style={{ padding: '10px 12px', background: rgba(accent, 0.06), borderRadius: 8, border: `1px solid ${rgba(accent, 0.15)}` }}>
              <p style={{ margin: 0, fontWeight: 600, color: T.text, fontSize: 13 }}>{selectedChild.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: T.muted }}>{selectedChild.class_name || 'Student'}</p>
            </div>
          </div>
        )}
      </div>}

      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal file={viewingDoc} onClose={() => setViewingDoc(null)} accent={accent} />
    </div>
  );
}

