import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Award, Mail, LogOut, FileText, Send, X, Plus } from 'lucide-react';
import { T, rgba, navItemStyle, cardStyle, badge, inputStyle, btnStyle } from '../styles/portalTheme';

export default function ParentPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
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
      const API = 'http://localhost:8080';
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
      const API = 'http://localhost:8080';
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
      const API = 'http://localhost:8080';
      
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
      const API = 'http://localhost:8080';
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
      const API = 'http://localhost:8080';
      await fetch(`${API}/api/messages/${msgId}/read`, { method: 'PUT' });
      setMessages(msgs => msgs.map(m => m.id === msgId ? { ...m, read: true } : m));
    } catch(err) { console.error(err); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!composeRecip || !composeSubject || !composeBody) return;
    setSendingMessage(true);
    try {
      const API = 'http://localhost:8080';
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

  if (!config) return null;
  const accent = config.primaryColor || '#2563eb';
  const name = config.name || 'Parent';

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
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
              { label: "Child's Attendance", value: 'See Tab', color: '#059669' }, 
              { label: 'Current GPA', value: dashboardData.avgScore?.toFixed(1) || '0', color: accent }, 
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

  const renderContent = () => {
    if (children.length === 0) return <div style={{ padding: '44px 52px' }}><p style={{color: T.muted}}>Select a child from the sidebar or link a new child</p></div>;
    if (!selectedChild) return <div style={{ padding: '44px 52px' }}><p style={{color: T.muted}}>Select a child from the sidebar</p></div>;

    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'attendance': return renderAttendance();
      case 'grades': return renderGrades();
      case 'messages': return renderMessages();
      default: return renderOverview();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: T.pageBg, fontFamily: T.fontSans }}>
      <div style={{ width: 252, background: T.sidebarBg, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${T.borderLight}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <img src="/logo.png" alt="Edvance Logo" style={{ height: 48, objectFit: 'contain', alignSelf: 'flex-start' }} />
            <span style={{ fontSize: 11, color: T.light, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Parent Portal</span>
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
      <div style={{ width: 280, background: T.sidebarBg, borderLeft: `1px solid ${T.border}`, padding: '24px 18px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 22, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', paddingBottom: 18, borderBottom: `1px solid ${T.borderLight}` }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: rgba(accent, 0.1), border: `2px solid ${rgba(accent, 0.25)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 24, color: accent }}>{name.charAt(0)}</div>
          <p style={{ margin: '0 0 4px', fontWeight: 700, color: T.text, fontSize: 14 }}>{name}</p>
          <span style={badge(accent, rgba(accent, 0.1))}>Parent</span>
        </div>

        <div>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '1px' }}>Your Children</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {children.length === 0 ? (
              <p style={{ color: T.muted, fontSize: 13 }}>No children linked yet.</p>
            ) : children.map(child => (
              <div key={child.ID} onClick={() => setSelectedChild(child)} style={{ ...cardStyle, background: selectedChild?.ID === child.ID ? '#faf9f7' : T.white, padding: '12px', border: `1.5px solid ${selectedChild?.ID === child.ID ? rgba(accent, 0.4) : T.borderLight}`, boxShadow: selectedChild?.ID === child.ID ? `0 2px 8px ${rgba(accent, 0.05)}` : 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: accent, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 16 }}>{child.name.charAt(0)}</div>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{child.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{child.schoolName}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ paddingTop: 18, borderTop: `1px solid ${T.borderLight}` }}>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '1px' }}>Link Another Child</p>
          {linkSuccess ? (
            <div style={{ padding: 12, background: '#f0fdf4', color: '#15803d', fontSize: 12, borderRadius: 8, fontWeight: 500 }}>{linkSuccess}</div>
          ) : (
            <form onSubmit={handleLinkChild} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="email" required value={linkChildEmail} onChange={e => setLinkChildEmail(e.target.value)} placeholder="Child's Temp Email" style={{ ...inputStyle, padding: '8px 12px', fontSize: 12 }} />
              <input type="text" required value={linkChildPass} onChange={e => setLinkChildPass(e.target.value)} placeholder="Temp Password" style={{ ...inputStyle, padding: '8px 12px', fontSize: 12 }} />
              {linkError && <p style={{ color: '#ef4444', fontSize: 11, margin: 0 }}>⚠️ {linkError}</p>}
              <button type="submit" disabled={isLinking} style={{ ...btnStyle(accent), padding: '8px', fontSize: 12 }}>{isLinking ? 'Linking...' : 'Link Child'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
