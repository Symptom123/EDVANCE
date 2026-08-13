import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Award, Mail, LogOut, FileText, User } from 'lucide-react';
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

  const fetchChildren = async (parentId) => {
    try {
      const API = 'http://localhost:8080';
      const res = await fetch(`${API}/api/parents/${parentId}/children`);
      const data = await res.json();
      setChildren(data || []);
      if (data && data.length > 0) {
        setSelectedChild(data[0]);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const raw = localStorage.getItem('edvance_school_config');
    try {
      const p = JSON.parse(raw || '{}');
      if (p.userRole !== 'Parent') { navigate('/login'); return; }
      setConfig(p);
      fetchChildren(p.userId);
    } catch { navigate('/login'); }
  }, [navigate]);

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

  if (!config) return null;
  const accent = config.primaryColor || '#2563eb';
  const name = config.name || 'Parent';

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare },
    { id: 'grades', label: 'Grades', icon: Award },
    { id: 'messages', label: 'Messages', icon: Mail },
  ];

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 8px' }}>Parent Portal</p>
        <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 38, fontWeight: 400, margin: 0, color: T.text }}>Hello, {name} 👋</h1>
        <p style={{ color: T.muted, margin: '8px 0 0', fontSize: 15 }}>Here's the latest update on your child's progress.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[{ label: "Child's Attendance", value: '96%', color: '#059669' }, { label: 'Current GPA', value: '3.8', color: accent }, { label: 'Unread Messages', value: '2', color: '#d97706' }].map(s => (
          <div key={s.label} style={{ ...cardStyle, borderTop: `3px solid ${s.color}` }}>
            <p style={{ color: T.muted, fontSize: 13, fontWeight: 500, margin: '0 0 10px' }}>{s.label}</p>
            <p style={{ fontFamily: T.fontSerif, fontSize: 42, margin: 0, color: T.text, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={cardStyle}>
          <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 16px', fontSize: 15 }}>Recent Activity</p>
          {[{ title: 'Math Test 3 Graded', desc: 'Grade: A (92%)', time: '2 hours ago' }, { title: 'Science Lab Report', desc: 'Grade: A- (88%)', time: 'Yesterday' }, { title: 'Absent for Period 1', desc: 'Marked Late by Mrs. Adeyemi', time: 'Oct 8' }].map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < 2 ? `1px solid ${T.borderLight}` : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: rgba(accent, 0.1), color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={16} /></div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: T.text }}>{a.title}</p>
                <p style={{ margin: 0, fontSize: 12, color: T.muted }}>{a.desc}</p>
              </div>
              <span style={{ fontSize: 11, color: T.light }}>{a.time}</span>
            </div>
          ))}
        </div>
        <div style={cardStyle}>
          <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 16px', fontSize: 15 }}>Upcoming Events</p>
          {[{ title: 'Parent-Teacher Conference', date: 'Oct 15', time: '4:00 PM' }, { title: 'Science Fair', date: 'Oct 22', time: '10:00 AM' }, { title: 'End of Term Exams', date: 'Nov 1', time: 'All Week' }].map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 2 ? `1px solid ${T.borderLight}` : 'none' }}>
              <div style={{ background: rgba(accent, 0.08), color: accent, padding: '6px 10px', borderRadius: 8, textAlign: 'center', minWidth: 54 }}>
                <span style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{e.date.split(' ')[0]}</span>
                <span style={{ display: 'block', fontSize: 16, fontWeight: 700, fontFamily: T.fontSerif }}>{e.date.split(' ')[1]}</span>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: T.text }}>{e.title}</p>
                <p style={{ margin: 0, fontSize: 12, color: T.muted }}>{e.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => {
    const days = Array.from({ length: 23 }, (_, i) => ({ day: i + 1, status: [3].includes(i + 1) ? 'absent' : [7].includes(i + 1) ? 'late' : 'present' }));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Attendance</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Attendance Record</h1></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
          <div style={cardStyle}>
            <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 16px' }}>Summary</p>
            {[{ label: 'Present', value: 21, color: '#059669' }, { label: 'Absent', value: 1, color: '#dc2626' }, { label: 'Late', value: 1, color: '#d97706' }].map(s => (
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

  const renderGrades = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Academic Record</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Grades</h1></div>
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans }}>
          <thead><tr style={{ background: '#faf9f7' }}>{['Subject', 'Latest Grade', 'Term Average', 'Status'].map(h => <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.light, letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
          <tbody>
            {[{ sub: 'Mathematics', latest: 'A (92%)', avg: '91%', pass: true }, { sub: 'English Literature', latest: 'B+ (85%)', avg: '83%', pass: true }, { sub: 'Biology', latest: 'A (90%)', avg: '90%', pass: true }, { sub: 'History', latest: 'C (72%)', avg: '75%', pass: true }, { sub: 'Physical Education', latest: 'A+ (98%)', avg: '95%', pass: true }].map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                <td style={{ padding: '14px 20px', fontWeight: 600, color: T.text }}>{r.sub}</td>
                <td style={{ padding: '14px 20px', color: T.muted, fontSize: 13 }}>{r.latest}</td>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: T.text }}>{r.avg}</td>
                <td style={{ padding: '14px 20px' }}><span style={r.pass ? badge('#15803d', '#f0fdf4') : badge('#dc2626', '#fef2f2')}>{r.pass ? 'Pass' : 'Fail'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Communications</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Messages</h1></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[{ sender: 'School Admin', title: 'Parent-Teacher Conference Scheduling', time: '10:30 AM', unread: true }, { sender: 'Mrs. Adeyemi', title: 'Jane\'s progress in English Literature', time: 'Yesterday', unread: true }, { sender: 'School Admin', title: 'Term 1 Report Cards Available', time: 'Oct 05', unread: false }].map((msg, i) => (
          <div key={i} style={{ ...cardStyle, display: 'flex', gap: 14, cursor: 'pointer', border: msg.unread ? `1.5px solid ${rgba(accent, 0.3)}` : `1px solid ${T.border}`, transition: 'box-shadow 0.15s' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: msg.unread ? rgba(accent, 0.1) : '#f9f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 18, color: accent, flexShrink: 0 }}>{msg.sender.charAt(0)}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <strong style={{ color: T.text, fontSize: 14 }}>{msg.sender}</strong>
                <span style={{ fontSize: 12, color: T.light }}>{msg.time}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: msg.unread ? T.text : T.muted, fontWeight: msg.unread ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.title}</p>
            </div>
            {msg.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0, marginTop: 4 }} />}
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
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
