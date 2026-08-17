import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UserPlus, Users, GraduationCap, Settings,
  LogOut, Building2, CheckCircle2, AlertCircle, Loader2,
  Palette, Trash2, Plus, BookOpen, Shield, ToggleLeft,
  ToggleRight, X, School, FileSpreadsheet, Upload, Download, FileText,
  Menu, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen
} from 'lucide-react';
import { T, rgba, navItemStyle, cardStyle, inputStyle, btnStyle, badge } from '../styles/portalTheme';
import ReportCardControls from '../components/ReportCardControls';
import ReportCardView from '../components/ReportCardView';
import AdminReportCardGenerator from '../components/AdminReportCardGenerator';
import * as XLSX from 'xlsx';

const API = 'http://localhost:8080';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddSequence, setShowAddSequence] = useState(false);
  const [newSequenceName, setNewSequenceName] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('Teacher');
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [newClassYear, setNewClassYear] = useState('');
  const [newClassTeacher, setNewClassTeacher] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);
  const [settingsColor, setSettingsColor] = useState('#2563eb');
  const [features, setFeatures] = useState({ attendance: true, grading: true, assignments: true, messaging: true, enrollment: true, results: true });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [genParentStudentEmail, setGenParentStudentEmail] = useState('');
  const [genParentName, setGenParentName] = useState('');
  const [genParentSuccess, setGenParentSuccess] = useState(null);
  const [genParentError, setGenParentError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportCardsData, setReportCardsData] = useState([]);
  const [rcClassId, setRcClassId] = useState('');
  const [rcTermId, setRcTermId] = useState('T1');
  const [isFetchingRC, setIsFetchingRC] = useState(false);
  const [uploadRCStatus, setUploadRCStatus] = useState(null);
  const [isRCEditing, setIsRCEditing] = useState(false);
  const [rcCustomFields, setRcCustomFields] = useState({});
  const [dashboardStats, setDashboardStats] = useState({ teachers: 0, students: 0, classes: 0, marksEntered: 0, avgScore: '0' });
  const [enrollClassId, setEnrollClassId] = useState('');
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [enrollMsg, setEnrollMsg] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [msgRecipient, setMsgRecipient] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [messages, setMessages] = useState([]);
  const [msgSent, setMsgSent] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [rosterClass, setRosterClass] = useState(null);
  const [rosterEnrollments, setRosterEnrollments] = useState([]);
  const [rosterStudentId, setRosterStudentId] = useState('');
  const [rosterLoading, setRosterLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('edvance_school_config');
    if (!raw) { navigate('/login'); return; }
    try {
      const p = JSON.parse(raw);
      if (p.userRole !== 'Admin') { navigate('/login'); return; }
      setConfig(p);
      setSettingsColor(p.primaryColor || '#2563eb');
      if (p.features) setFeatures(p.features);
    } catch { navigate('/login'); }
  }, [navigate]);

  const fetchUsers = useCallback(async (role, setter) => {
    if (!config) return;
    try {
      const res = await fetch(`${API}/api/users?schoolId=${config.schoolId}&role=${role}`);
      setter(Array.isArray(await res.json()) ? await fetch(`${API}/api/users?schoolId=${config.schoolId}&role=${role}`).then(r => r.json()) : []);
    } catch { setter([]); }
  }, [config]);

  const fetchClasses = useCallback(async () => {
    if (!config) return;
    try {
      const data = await fetch(`${API}/api/classes?schoolId=${config.schoolId}`).then(r => r.json());
      setClasses(Array.isArray(data) ? data : []);
    } catch { setClasses([]); }
  }, [config]);

  const fetchSequences = useCallback(async () => {
    if (!config) return;
    try {
      const data = await fetch(`${API}/api/sequences?schoolId=${config.schoolId}`).then(r => r.json());
      setSequences(Array.isArray(data) ? data : []);
    } catch { setSequences([]); }
  }, [config]);

  useEffect(() => {
    if (!config) return;
    const load = async (role, setter) => {
      try {
        const data = await fetch(`${API}/api/users?schoolId=${config.schoolId}&role=${role}`).then(r => r.json());
        setter(Array.isArray(data) ? data : []);
      } catch { setter([]); }
    };
    load('Teacher', setTeachers);
    load('Student', setStudents);
    load('Admin', setAdmins);
    fetchClasses();
    fetchSequences();
    // Fetch real dashboard stats
    fetch(`${API}/api/dashboard/admin/${config.schoolId}`)
      .then(r => r.json()).then(d => setDashboardStats(d || {})).catch(() => {});
    // Fetch all users for messaging
    fetch(`${API}/api/users?schoolId=${config.schoolId}`)
      .then(r => r.json()).then(d => setAllUsers(Array.isArray(d) ? d : [])).catch(() => {});
    // Fetch admin inbox
    fetch(`${API}/api/messages?userId=${config.id}&box=inbox`)
      .then(r => r.json()).then(d => setMessages(Array.isArray(d) ? d : [])).catch(() => {});
  }, [config, fetchClasses, fetchSequences]);

  if (!config) return (
    <div style={{ background: '#f5f4f0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <Loader2 size={32} color="#999" style={{ animation: 'spin 1s linear infinite' }}/>
      <p style={{ color: '#999', fontSize: 14 }}>Loading dashboard...</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const accent = config.primaryColor || '#2563eb';

  const reload = (role) => {
    const load = async (r, setter) => {
      try { const d = await fetch(`${API}/api/users?schoolId=${config.schoolId}&role=${r}`).then(res => res.json()); setter(Array.isArray(d) ? d : []); } catch { setter([]); }
    };
    if (role === 'Teacher') load('Teacher', setTeachers);
    else if (role === 'Student') load('Student', setStudents);
    else load('Admin', setAdmins);
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setFormError(null); setFormSuccess(null);
    try {
      const res = await fetch(`${API}/api/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId: config.schoolId, name: newUserName, role: newUserRole }) });
      if (!res.ok) throw new Error('Registration failed');
      const data = await res.json();
      setFormSuccess({ email: data.email, password: data.tempPassword, name: newUserName });
      setNewUserName('');
      reload(newUserRole);
    } catch (err) { setFormError(err.message); } finally { setIsSubmitting(false); }
  };

  const handleDeleteUser = async (id, role) => {
    if (!window.confirm('Remove this user?')) return;
    try { await fetch(`${API}/api/users/${id}`, { method: 'DELETE' }); reload(role); } catch { alert('Delete failed'); }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setFormError(null);
    try {
      const teacher = teachers.find(t => t.name === newClassTeacher);
      const res = await fetch(`${API}/api/classes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId: config.schoolId, name: newClassName, subject: newClassSubject, year: newClassYear, teacherId: teacher ? teacher.id : 0 }) });
      if (!res.ok) throw new Error('Failed');
      setNewClassName(''); setNewClassSubject(''); setNewClassYear(''); setNewClassTeacher(''); setShowAddClass(false);
      fetchClasses();
    } catch (err) { setFormError(err.message); } finally { setIsSubmitting(false); }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Delete this class?')) return;
    await fetch(`${API}/api/classes/${id}`, { method: 'DELETE' }); fetchClasses();
  };

  const handleSaveSettings = async () => {
    try {
      await fetch(`${API}/api/schools/${config.schoolId}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ primaryColor: settingsColor, features }) });
      const updated = { ...config, primaryColor: settingsColor, features };
      localStorage.setItem('edvance_school_config', JSON.stringify(updated));
      setConfig(updated); setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 2500);
    } catch { alert('Save failed'); }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'teachers', label: 'Manage Teachers', icon: Users },
    { id: 'students', label: 'Manage Students', icon: GraduationCap },
    { id: 'admins', label: 'Manage Admins', icon: Shield },
    { id: 'parents', label: 'Parent Access', icon: Users },
    { id: 'classes', label: 'Manage Classes', icon: BookOpen },
    { id: 'enrollment', label: 'Enrollment', icon: UserPlus },
    { id: 'sequences', label: 'Manage Sequences', icon: ToggleRight },
    { id: 'messages', label: 'Messaging', icon: FileSpreadsheet },
    { id: 'reportcards', label: 'Report Cards', icon: FileText },
    { id: 'features', label: 'Feature Settings', icon: ToggleRight },
    { id: 'settings', label: 'School Settings', icon: Settings },
  ];

  const renderUserMgmt = (role, list) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>User Management</p>
        <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Manage {role}s</h1>
      </div>

      {/* Add User Form — inline (not a sub-component) to preserve focus */}
      {showAddUser && newUserRole === role && (
        <div style={{ ...cardStyle, border: `1.5px solid ${rgba(accent, 0.3)}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h4 style={{ fontFamily: T.fontSans, fontWeight: 700, color: T.text, margin: 0 }}>Register New {role}</h4>
            <button onClick={() => { setShowAddUser(false); setFormSuccess(null); setFormError(null); }} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}><X size={18} /></button>
          </div>
          {formSuccess ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, color: '#15803d' }}><CheckCircle2 size={20} /><strong>Account Created!</strong></div>
              <p style={{ color: T.muted, fontSize: 14, margin: '0 0 16px' }}>Share credentials securely with <strong style={{ color: T.text }}>{formSuccess.name}</strong>.</p>
              <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div><p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: 1 }}>Email</p><strong style={{ color: T.text }}>{formSuccess.email}</strong></div>
                <div><p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: 1 }}>Temp Password</p><strong style={{ color: T.text, fontFamily: 'monospace', fontSize: 15 }}>{formSuccess.password}</strong></div>
              </div>
              <button onClick={() => setFormSuccess(null)} style={{ ...btnStyle(accent), marginTop: 16 }}>Add Another</button>
            </div>
          ) : (
            <form onSubmit={handleRegisterUser} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Full Name</label>
                <input
                  type="text" required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  style={inputStyle}
                  autoFocus
                />
              </div>
              {formError && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{formError}</p>}
              <button type="submit" disabled={isSubmitting} style={btnStyle(accent)}>{isSubmitting ? <Loader2 size={14} /> : <><Plus size={14} />Create</>}</button>
            </form>
          )}
        </div>
      )}

      {/* Add button when form is closed */}
      {!showAddUser && (
        <div>
          <button onClick={() => { setNewUserRole(role); setShowAddUser(true); setFormSuccess(null); setFormError(null); }} style={btnStyle(accent)}>
            <Plus size={15} /> Add {role}
          </button>
        </div>
      )}

      {/* Users Table — inline (not a sub-component) to preserve focus */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${T.border}` }}>
          <h3 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 20, margin: 0, color: T.text }}>{role}s <span style={{ color: T.muted, fontStyle: 'normal', fontFamily: T.fontSans, fontSize: 14 }}>({list.length})</span></h3>
        </div>
        {list.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: T.muted }}>No {role.toLowerCase()}s registered yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans }}>
            <thead><tr style={{ background: '#faf9f7' }}>{['Name', 'Email', 'Status', ''].map(h => <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.light, letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
            <tbody>{list.map(u => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                <td style={{ padding: '14px 24px', fontWeight: 600, color: T.text }}>{u.name}</td>
                <td style={{ padding: '14px 24px', color: T.muted, fontSize: 13 }}>{u.email}</td>
                <td style={{ padding: '14px 24px' }}><span style={u.firstLogin ? badge('#d97706', '#fffbeb') : badge('#15803d', '#f0fdf4')}>{u.firstLogin ? 'Pending Login' : 'Active'}</span></td>
                <td style={{ padding: '14px 24px' }}><button onClick={() => handleDeleteUser(u.id, role)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500, fontFamily: T.fontSans }}><Trash2 size={13} /> Remove</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 8px' }}>Admin Dashboard</p>
        <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 38, fontWeight: 400, margin: 0, color: T.text }}>Welcome, {config.name || 'Admin'}</h1>
        <p style={{ color: T.muted, margin: '8px 0 0', fontSize: 15 }}>Here's what's happening at {config.schoolName} today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Teachers', value: dashboardStats.teachers ?? teachers.length, icon: Users, color: accent },
          { label: 'Students', value: dashboardStats.students ?? students.length, icon: GraduationCap, color: '#059669' },
          { label: 'Classes', value: dashboardStats.classes ?? classes.length, icon: BookOpen, color: '#d97706' },
          { label: 'Marks Entered', value: dashboardStats.marksEntered ?? 0, icon: Shield, color: '#7c3aed' }
        ].map(stat => (
          <div key={stat.label} style={{ ...cardStyle, borderTop: `3px solid ${stat.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ color: T.muted, margin: 0, fontSize: 13, fontWeight: 500 }}>{stat.label}</p>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: rgba(stat.color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}><stat.icon size={16} /></div>
            </div>
            <p style={{ fontFamily: T.fontSerif, fontSize: 42, margin: 0, color: T.text, lineHeight: 1 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Performance SVG Chart */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 4px', fontSize: 15 }}>School Performance Trend</p>
            <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Average academic performance per sequence</p>
          </div>
          {dashboardStats.avgScore && dashboardStats.avgScore !== '0' && dashboardStats.avgScore !== '0.0' && (
            <span style={{ fontSize: 13, fontWeight: 600, color: accent, background: rgba(accent, 0.1), padding: '4px 12px', borderRadius: 20 }}>
              Overall Avg: {dashboardStats.avgScore}/20
            </span>
          )}
        </div>

        {(!dashboardStats.chartData || dashboardStats.chartData.length === 0) ? (
          <div style={{ padding: '36px 0', textAlign: 'center', color: T.muted, fontStyle: 'italic', background: '#faf9f7', borderRadius: 8, border: `1px solid ${T.borderLight}` }}>
            No sequence grades entered yet to display school performance trend.
          </div>
        ) : (
          <div>
            <svg viewBox="0 0 700 160" style={{ width: '100%', display: 'block' }}>
              <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity="0.15" /><stop offset="100%" stopColor={accent} stopOpacity="0" /></linearGradient></defs>
              {[0, 40, 80, 120, 160].map((y, i) => <line key={i} x1="0" y1={y} x2="700" y2={y} stroke={T.border} strokeWidth="1" />)}
              {(() => {
                const maxAvg = Math.max(...(dashboardStats.chartData || []).map(d => d.avg || 0), 20);
                const points = dashboardStats.chartData.map((d, i) => {
                  const x = (i / Math.max(1, dashboardStats.chartData.length - 1)) * 700;
                  const y = 160 - (((d.avg || 0) / maxAvg) * 130);
                  return [x, y];
                });
                const pointsStr = points.map(p => p.join(',')).join(' ');
                const polyPoints = `0,160 ${pointsStr} 700,160`;
                return (
                  <>
                    <polygon fill="url(#ag)" points={polyPoints} />
                    <polyline fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pointsStr} />
                    {points.map(([x,y],i) => <circle key={i} cx={x} cy={y} r="5" fill={accent} stroke="white" strokeWidth="2" />)}
                  </>
                );
              })()}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {dashboardStats.chartData.map((d, i) => (
                <span key={i} style={{ color: T.light, fontSize: 11, fontWeight: 500 }}>
                  {d.name} ({Number(d.avg || 0).toFixed(1)})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 14px', fontSize: 15 }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {[{ label: 'Add Teacher', icon: Users, role: 'Teacher', view: 'teachers' }, { label: 'Add Student', icon: GraduationCap, role: 'Student', view: 'students' }, { label: 'Add Class', icon: BookOpen, view: 'classes' }].map(item => (
            <button key={item.label} onClick={() => { setActiveView(item.view); if (item.role) { setNewUserRole(item.role); setShowAddUser(true); } else setShowAddClass(true); }}
              style={{ ...cardStyle, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, border: `1.5px solid ${rgba(accent, 0.25)}`, transition: 'all 0.15s' }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: rgba(accent, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}><item.icon size={20} /></div>
              <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderClasses = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Curriculum</p>
          <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Manage Classes</h1>
        </div>
        <button onClick={() => { setShowAddClass(true); setFormError(null); }} style={btnStyle(accent)}><Plus size={15} /> New Class</button>
      </div>
      {showAddClass && (
        <div style={{ ...cardStyle, border: `1.5px solid ${rgba(accent, 0.3)}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
            <h4 style={{ fontFamily: T.fontSans, fontWeight: 700, color: T.text, margin: 0 }}>Create Class</h4>
            <button onClick={() => setShowAddClass(false)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}><X size={18} /></button>
          </div>
          <form onSubmit={handleCreateClass}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {[{ label: 'Class Name', val: newClassName, set: setNewClassName, ph: 'e.g. JSS 1A' }, { label: 'Subject', val: newClassSubject, set: setNewClassSubject, ph: 'e.g. Mathematics' }, { label: 'Year / Level', val: newClassYear, set: setNewClassYear, ph: 'e.g. Year 7' }].map(f => (
                <div key={f.label}><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>{f.label}</label><input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inputStyle} /></div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Assign Teacher</label>
                <select value={newClassTeacher} onChange={e => setNewClassTeacher(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                  <option value="">-- Select --</option>
                  {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            </div>
            {formError && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{formError}</p>}
            <button type="submit" disabled={isSubmitting} style={btnStyle(accent)}>{isSubmitting ? <Loader2 size={14} /> : <><Plus size={14} />Create Class</>}</button>
          </form>
        </div>
      )}
      {classes.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 24px', color: T.muted }}>
          <BookOpen size={40} style={{ marginBottom: 12, opacity: 0.3 }} /><p>No classes yet. Create your first class above!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {classes.map(cls => {
            const teacher = teachers.find(t => t.id === cls.teacherId);
            return (
              <div key={cls.ID} style={{ ...cardStyle, borderTop: `3px solid ${accent}`, position: 'relative' }}>
                <button onClick={() => handleDeleteClass(cls.ID)} style={{ position: 'absolute', top: 14, right: 14, background: '#fef2f2', border: 'none', borderRadius: 6, color: '#ef4444', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center' }}><Trash2 size={13} /></button>
                <h3 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 20, margin: '0 0 4px', color: T.text }}>{cls.name}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {cls.year && <div style={{ display: 'flex', justifyContent: 'space-between', color: T.muted, fontSize: 13 }}><span>Year</span><strong style={{ color: T.text }}>{cls.year}</strong></div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: T.muted, fontSize: 13 }}><span>Teacher</span><strong style={{ color: T.text }}>{teacher ? teacher.name : '—'}</strong></div>
                </div>
                <button
                  onClick={async () => {
                    const classId = cls.id || cls.ID;
                    setRosterClass(cls);
                    setRosterLoading(true);
                    try {
                      const res = await fetch(`${API}/api/enrollments?classId=${classId}&schoolId=${config.schoolId}`);
                      setRosterEnrollments(await res.json() || []);
                    } catch { setRosterEnrollments([]); }
                    finally { setRosterLoading(false); }
                  }}
                  style={{ ...btnStyle(accent, true), width: '100%', justifyContent: 'center', fontSize: 12, padding: '8px' }}
                >
                  <Users size={14} /> Manage Students / Roster
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ROSTER MODAL */}
      {rosterClass && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...cardStyle, width: '100%', maxWidth: 540, padding: 28, position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setRosterClass(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={20} /></button>
            <h2 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', margin: '0 0 4px', fontSize: 24, color: T.text }}>Class Roster: {rosterClass.name}</h2>
            <p style={{ color: accent, fontSize: 13, fontWeight: 600, margin: '0 0 20px' }}>{rosterClass.subject} ({rosterClass.year || 'No level'})</p>

            <div style={{ marginBottom: 20, background: '#faf9f7', padding: 14, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>Add Student to Class</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <select value={rosterStudentId} onChange={e => setRosterStudentId(e.target.value)} style={{ ...inputStyle, flex: 1, background: '#fff' }}>
                  <option value="">-- Choose Student --</option>
                  {students.filter(s => !rosterEnrollments.some(re => re.studentId === s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    if (!rosterStudentId) return;
                    const classId = rosterClass.id || rosterClass.ID;
                    await fetch(`${API}/api/enrollments`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ schoolId: config.schoolId, classId, studentId: rosterStudentId })
                    });
                    setRosterStudentId('');
                    const res = await fetch(`${API}/api/enrollments?classId=${classId}&schoolId=${config.schoolId}`);
                    setRosterEnrollments(await res.json() || []);
                  }}
                  style={btnStyle(accent)}
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            <h4 style={{ fontFamily: T.fontSans, fontWeight: 700, fontSize: 14, color: T.text, margin: '0 0 10px' }}>Enrolled Students ({rosterEnrollments.length})</h4>
            {rosterLoading ? <p style={{ fontSize: 13, color: T.muted }}>Loading roster...</p> : rosterEnrollments.length === 0 ? (
              <p style={{ fontSize: 13, color: T.muted, fontStyle: 'italic' }}>No students enrolled in this class yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rosterEnrollments.map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: '#fff', border: `1px solid ${T.borderLight}` }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{e.studentName}</span>
                    <button
                      onClick={async () => {
                        const classId = rosterClass.id || rosterClass.ID;
                        await fetch(`${API}/api/enrollments?classId=${classId}&studentId=${e.studentId}`, { method: 'DELETE' });
                        const res = await fetch(`${API}/api/enrollments?classId=${classId}&schoolId=${config.schoolId}`);
                        setRosterEnrollments(await res.json() || []);
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
  
  const handleCreateSequence = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setFormError(null);
    try {
      const res = await fetch(`${API}/api/sequences`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId: config.schoolId, name: newSequenceName }) });
      if (!res.ok) throw new Error('Failed');
      setNewSequenceName(''); setShowAddSequence(false);
      fetchSequences();
    } catch (err) { setFormError(err.message); } finally { setIsSubmitting(false); }
  };

  const handleToggleSequenceLock = async (id, currentLocked) => {
    try {
      await fetch(`${API}/api/sequences/lock`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isLocked: !currentLocked }) });
      fetchSequences();
    } catch { alert('Update failed'); }
  };

  const renderSequences = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Evaluation</p>
          <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Manage Sequences</h1>
        </div>
        <button onClick={() => { setShowAddSequence(true); setFormError(null); }} style={btnStyle(accent)}><Plus size={15} /> New Sequence</button>
      </div>
      {showAddSequence && (
        <div style={{ ...cardStyle, border: `1.5px solid ${rgba(accent, 0.3)}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
            <h4 style={{ fontFamily: T.fontSans, fontWeight: 700, color: T.text, margin: 0 }}>Create Sequence</h4>
            <button onClick={() => setShowAddSequence(false)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}><X size={18} /></button>
          </div>
          <form onSubmit={handleCreateSequence}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Sequence Name</label>
              <input value={newSequenceName} onChange={e => setNewSequenceName(e.target.value)} placeholder="e.g. First Sequence" style={inputStyle} required />
            </div>
            {formError && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{formError}</p>}
            <button type="submit" disabled={isSubmitting} style={btnStyle(accent)}>{isSubmitting ? <Loader2 size={14} /> : <><Plus size={14} />Create Sequence</>}</button>
          </form>
        </div>
      )}
      {sequences.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 24px', color: T.muted }}>
          <p>No sequences found. Please create one.</p>
        </div>
      ) : (
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans }}>
            <thead><tr style={{ background: '#faf9f7' }}>{['Sequence Name', 'Status', 'Action'].map(h => <th key={h} style={{ padding: '14px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.light, letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
            <tbody>{sequences.map(seq => (
              <tr key={seq.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                <td style={{ padding: '14px 24px', fontWeight: 600, color: T.text }}>{seq.name}</td>
                <td style={{ padding: '14px 24px' }}><span style={seq.isLocked ? badge('#dc2626', '#fef2f2') : badge('#15803d', '#f0fdf4')}>{seq.isLocked ? 'Locked' : 'Open'}</span></td>
                <td style={{ padding: '14px 24px' }}><button onClick={() => handleToggleSequenceLock(seq.id, seq.isLocked)} style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: T.fontSans }}>{seq.isLocked ? 'Unlock' : 'Lock'}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderFeatures = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Customization</p>
        <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Feature Settings</h1>
      </div>
      <div style={{ ...cardStyle, maxWidth: 560 }}>
        {Object.entries({ attendance: { label: 'Attendance Tracking', desc: 'Teachers take attendance; students view records.' }, grading: { label: 'Grading & Marks', desc: 'Teachers input grades; students view marks.' }, assignments: { label: 'Assignment System', desc: 'Teachers assign; students submit.' }, messaging: { label: 'Class Messaging', desc: 'Teachers send class-wide announcements.' }, enrollment: { label: 'Class Enrollment', desc: 'Students request to join classes.' }, results: { label: 'Results / Report Cards', desc: 'Students view full term results.' } }).map(([key, { label, desc }], idx, arr) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: idx < arr.length - 1 ? `1px solid ${T.borderLight}` : 'none' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: T.text, fontSize: 14, marginBottom: 3 }}>{label}</p>
              <p style={{ margin: 0, fontSize: 13, color: T.muted }}>{desc}</p>
            </div>
            <button onClick={() => setFeatures(f => ({ ...f, [key]: !f[key] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: features[key] ? accent : T.light, flexShrink: 0, marginLeft: 20 }}>
              {features[key] ? <ToggleRight size={34} /> : <ToggleLeft size={34} />}
            </button>
          </div>
        ))}
        <div style={{ paddingTop: 20, borderTop: `1px solid ${T.border}`, marginTop: 4 }}>
          <button onClick={handleSaveSettings} style={btnStyle(accent)}>{settingsSaved ? <><CheckCircle2 size={14} />Saved!</> : 'Save Feature Settings'}</button>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Configuration</p>
        <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>School Settings</h1>
      </div>
      <div style={{ ...cardStyle, maxWidth: 520 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>School Name</label><input style={{ ...inputStyle, background: '#f9f7f4', color: T.muted }} value={config.schoolName} readOnly /></div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 10 }}>Primary Accent Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: settingsColor, border: `1px solid ${T.border}`, position: 'relative', cursor: 'pointer', overflow: 'hidden' }}>
                <input type="color" value={settingsColor} onChange={e => setSettingsColor(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 15, color: T.text }}>{settingsColor.toUpperCase()}</p>
                <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Click swatch to change</p>
              </div>
              <div style={{ flex: 1, height: 3, borderRadius: 100, background: `linear-gradient(to right, ${settingsColor}, transparent)`, opacity: 0.5 }} />
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
            <button onClick={handleSaveSettings} style={btnStyle(settingsColor)}>{settingsSaved ? <><CheckCircle2 size={14} />Saved!</> : 'Save Settings'}</button>
          </div>
        </div>
      </div>
    </div>
  );

  const handleGenerateParent = async (e) => {
    e.preventDefault();
    setIsGenerating(true); setGenParentError(null); setGenParentSuccess(null);
    try {
      const res = await fetch(`${API}/api/parents/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentEmail: genParentStudentEmail, parentName: genParentName })
      });
      if (!res.ok) throw new Error((await res.text()) || 'Failed to generate');
      setGenParentSuccess(await res.json());
      setGenParentStudentEmail(''); setGenParentName('');
    } catch (err) {
      setGenParentError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderParents = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Access Control</p>
        <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Generate Parent Link</h1>
      </div>
      <div style={{ ...cardStyle, maxWidth: 520 }}>
        {genParentSuccess ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 20 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, color: '#15803d' }}><CheckCircle2 size={20} /><strong>Credentials Generated!</strong></div>
            <p style={{ color: T.muted, fontSize: 14, margin: '0 0 16px' }}>Give these temporary credentials to the parent. They will set a permanent email and password on their first login.</p>
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div><p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: 1 }}>Temp Email</p><strong style={{ color: T.text }}>{genParentSuccess.email}</strong></div>
              <div><p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: 1 }}>Temp Password</p><strong style={{ color: T.text, fontFamily: 'monospace', fontSize: 15 }}>{genParentSuccess.password}</strong></div>
            </div>
            <button onClick={() => setGenParentSuccess(null)} style={{ ...btnStyle(accent), marginTop: 16 }}>Generate Another</button>
          </div>
        ) : (
          <form onSubmit={handleGenerateParent} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: '0 0 8px', color: T.muted, fontSize: 14 }}>Link a parent to a student's account by providing the student's email and the parent's full name.</p>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Student's Email</label>
              <input type="email" required value={genParentStudentEmail} onChange={e => setGenParentStudentEmail(e.target.value)} placeholder="student@example.com" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Parent's Full Name</label>
              <input type="text" required value={genParentName} onChange={e => setGenParentName(e.target.value)} placeholder="e.g. Richard Doe" style={inputStyle} />
            </div>
            {genParentError && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>⚠️ {genParentError}</p>}
            <button type="submit" disabled={isGenerating} style={{ ...btnStyle(accent), alignSelf: 'flex-start' }}>{isGenerating ? <Loader2 size={14} /> : <><Users size={14} />Generate Credentials</>}</button>
          </form>
        )}
      </div>
    </div>
  );

  const handleFetchReportCards = async () => {
    if (!rcClassId || !rcTermId) return;
    setIsFetchingRC(true);
    try {
      const res = await fetch(`${API}/api/report-cards/class/${rcClassId}?term_id=${rcTermId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setReportCardsData(data || []);
    } catch {
      setReportCardsData([]);
    } finally {
      setIsFetchingRC(false);
    }
  };

  const handlePrintRC = () => {
    window.print();
  };

  const handleExcelTemplateDownload = () => {
    const ws = XLSX.utils.json_to_sheet([{ studentId: '', subject: '', mark: '', coefficient: '' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
    XLSX.writeFile(wb, "marks_template.xlsx");
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        setUploadRCStatus('Uploading...');
        const res = await fetch(`${API}/api/grades/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ marks: data, classId: rcClassId, termId: rcTermId })
        });
        if (res.ok) {
          setUploadRCStatus('Upload successful!');
          setTimeout(() => setUploadRCStatus(null), 3000);
          handleFetchReportCards();
        } else {
          setUploadRCStatus('Upload failed.');
        }
      } catch (err) {
        setUploadRCStatus('Error reading file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const renderReportCards = () => (
    <AdminReportCardGenerator config={config} accent={accent} />
  );

  const renderEnrollment = () => {
    const fetchClassEnrollments = async (classId) => {
      if (!classId) return;
      try {
        const data = await fetch(`${API}/api/enrollments?classId=${classId}&schoolId=${config.schoolId}`).then(r => r.json());
        setEnrollments(Array.isArray(data) ? data : []);
      } catch { setEnrollments([]); }
    };
    const handleEnroll = async () => {
      if (!enrollClassId || !enrollStudentId) { setEnrollMsg('Please select both a class and a student.'); return; }
      try {
        const res = await fetch(`${API}/api/enrollments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId: config.schoolId, classId: enrollClassId, studentId: enrollStudentId }) });
        if (!res.ok) throw new Error('Enrollment failed');
        setEnrollMsg('Student enrolled successfully!');
        fetchClassEnrollments(enrollClassId);
        setTimeout(() => setEnrollMsg(''), 3000);
      } catch (err) { setEnrollMsg('Error: ' + err.message); }
    };
    const handleUnenroll = async (classId, studentId) => {
      if (!window.confirm('Remove this student from the class?')) return;
      await fetch(`${API}/api/enrollments?classId=${classId}&studentId=${studentId}`, { method: 'DELETE' });
      fetchClassEnrollments(enrollClassId);
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Class Management</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Student Enrollment</h1></div>
        <div style={{ ...cardStyle }}>
          <p style={{ fontWeight: 600, color: T.text, margin: '0 0 16px' }}>Enroll a Student in a Class</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Select Class</label>
              <select value={enrollClassId} onChange={e => { setEnrollClassId(e.target.value); setTimeout(() => {}, 0); }} style={{ ...inputStyle, background: '#fff' }}>
                <option value="">-- Choose Class --</option>
                {classes.map(c => <option key={c.ID || c.id} value={c.ID || c.id}>{c.name} ({c.subject})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Select Student</label>
              <select value={enrollStudentId} onChange={e => setEnrollStudentId(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                <option value="">-- Choose Student --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button onClick={handleEnroll} style={btnStyle(accent)}><Plus size={15} />Enroll</button>
          </div>
          {enrollMsg && <p style={{ marginTop: 10, fontSize: 13, color: enrollMsg.includes('Error') ? '#ef4444' : '#15803d', fontWeight: 500 }}>{enrollMsg}</p>}
        </div>
        <div style={{ ...cardStyle }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontWeight: 600, color: T.text, margin: 0 }}>Current Enrollments</p>
            <select value={enrollClassId} onChange={e => { setEnrollClassId(e.target.value); fetchClassEnrollments(e.target.value); }} style={{ ...inputStyle, background: '#fff', maxWidth: 220 }}>
              <option value="">-- Select class to view --</option>
              {classes.map(c => <option key={c.ID || c.id} value={c.ID || c.id}>{c.name}</option>)}
            </select>
          </div>
          {enrollments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: T.muted }}>{enrollClassId ? 'No students enrolled in this class yet.' : 'Select a class to view enrollments.'}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans }}>
              <thead><tr style={{ background: '#faf9f7' }}>
                {['Student Name', 'Class', ''].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.light, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
              </tr></thead>
              <tbody>{enrollments.map(e => (
                <tr key={e.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: T.text }}>{e.studentName}</td>
                  <td style={{ padding: '12px 16px', color: T.muted, fontSize: 13 }}>{e.className}</td>
                  <td style={{ padding: '12px 16px' }}><button onClick={() => handleUnenroll(e.classId, e.studentId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: T.fontSans, display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 size={13} />Remove</button></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const renderMessages = () => {
    const handleSendMsg = async (e) => {
      e.preventDefault();
      if (!msgRecipient || !msgSubject || !msgBody) { return; }
      try {
        await fetch(`${API}/api/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId: config.schoolId, senderId: config.id, senderName: config.name, senderRole: 'Admin', recipientId: msgRecipient, subject: msgSubject, body: msgBody }) });
        setMsgSent(true); setMsgRecipient(''); setMsgSubject(''); setMsgBody('');
        setTimeout(() => setMsgSent(false), 3000);
      } catch { alert('Failed to send'); }
    };
    const handleMarkRead = async (id) => {
      await fetch(`${API}/api/messages/${id}/read`, { method: 'PUT' });
      setMessages(msgs => msgs.map(m => m.id === id ? { ...m, isRead: true } : m));
    };
    const unread = messages.filter(m => !m.isRead).length;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Communications</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Messaging {unread > 0 && <span style={{ fontSize: 16, fontFamily: T.fontSans, background: '#ef4444', color: '#fff', borderRadius: '100px', padding: '2px 10px', marginLeft: 8 }}>{unread}</span>}</h1></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ ...cardStyle }}>
            <p style={{ fontWeight: 700, color: T.text, margin: '0 0 16px', fontFamily: T.fontSans }}>Compose Message</p>
            {msgSent ? <div style={{ background: '#f0fdf4', color: '#15803d', padding: 14, borderRadius: 8, fontWeight: 500 }}>✓ Message sent!</div> : (
              <form onSubmit={handleSendMsg} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Recipient</label>
                  <select value={msgRecipient} onChange={e => setMsgRecipient(e.target.value)} style={{ ...inputStyle, background: '#fff' }} required>
                    <option value="">-- Select User --</option>
                    {allUsers.filter(u => u.id !== config.id).map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select></div>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Subject</label><input value={msgSubject} onChange={e => setMsgSubject(e.target.value)} placeholder="Subject" style={inputStyle} required /></div>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Message</label><textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={4} placeholder="Write your message..." style={{ ...inputStyle, resize: 'vertical' }} required /></div>
                <button type="submit" style={btnStyle(accent)}>Send Message</button>
              </form>
            )}
          </div>
          <div style={{ ...cardStyle }}>
            <p style={{ fontWeight: 700, color: T.text, margin: '0 0 16px', fontFamily: T.fontSans }}>Inbox {unread > 0 && <span style={{ fontSize: 12, background: '#ef4444', color: '#fff', borderRadius: '100px', padding: '1px 8px', marginLeft: 6 }}>{unread}</span>}</p>
            {messages.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: T.muted }}>No messages yet.</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {messages.map(msg => (
                  <div key={msg.id} onClick={() => { setSelectedMessage(msg); if (!msg.isRead) handleMarkRead(msg.id); }} style={{ padding: '12px 14px', borderRadius: 8, border: `1.5px solid ${msg.isRead ? T.borderLight : rgba(accent, 0.3)}`, cursor: 'pointer', background: msg.isRead ? '#fff' : rgba(accent, 0.03), transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong style={{ fontSize: 13, color: T.text }}>{msg.senderName}</strong>
                      <span style={{ fontSize: 11, color: T.light }}>{msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: msg.isRead ? T.muted : T.text, fontWeight: msg.isRead ? 400 : 600 }}>{msg.subject}</p>
                    {!msg.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, marginTop: 6 }} />}
                  </div>
                ))}
              </div>
            )}
            {selectedMessage && (
              <div style={{ marginTop: 16, padding: '16px', borderRadius: 8, background: '#faf9f7', border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><strong style={{ color: T.text }}>{selectedMessage.subject}</strong><button onClick={() => setSelectedMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={15} /></button></div>
                <p style={{ fontSize: 12, color: T.muted, margin: '0 0 10px' }}>From: {selectedMessage.senderName} ({selectedMessage.senderRole})</p>
                <p style={{ fontSize: 14, color: T.text, lineHeight: 1.6, margin: 0 }}>{selectedMessage.body}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeView) {
      case 'overview': return renderOverview();
      case 'teachers': return renderUserMgmt('Teacher', teachers);
      case 'students': return renderUserMgmt('Student', students);
      case 'admins': return renderUserMgmt('Admin', admins);
      case 'parents': return renderParents();
      case 'classes': return renderClasses();
      case 'enrollment': return renderEnrollment();
      case 'sequences': return renderSequences();
      case 'messages': return renderMessages();
      case 'reportcards': return renderReportCards();
      case 'features': return renderFeatures();
      case 'settings': return renderSettings();
      default: return renderOverview();
    }
  };


  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: T.pageBg, fontFamily: T.fontSans }}>

      {/* MOBILE HEADER (only visible on mobile) */}
      <div className="portal-mobile-header print-hide">
        <button
          className="portal-mobile-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <img src="/logo.png" alt="Edvance Logo" style={{ height: 28, objectFit: 'contain' }} />
        <span className="portal-mobile-role-badge">Admin</span>
      </div>

      {/* SIDEBAR */}
      {sidebarOpen && <div
        className={`portal-sidebar print-hide portal-sidebar--open`}
        style={{ width: 256, background: T.sidebarBg, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}
      >
        <button className="portal-sidebar-overlay-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">✕</button>

        <div style={{ padding: '28px 20px 24px', borderBottom: `1px solid ${T.borderLight}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <img src="/logo.png" alt="Edvance Logo" style={{ height: 48, objectFit: 'contain', alignSelf: 'flex-start' }} />
            <span style={{ fontSize: 11, color: T.light, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin Portal</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                setShowAddUser(false);
                setShowAddClass(false);
                setSidebarOpen(false);
              }}
              style={navItemStyle(activeView === item.id, accent)}
            >
              <item.icon size={17} /> {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 12px', borderTop: `1px solid ${T.borderLight}` }}>
          <button onClick={() => { localStorage.removeItem('edvance_school_config'); navigate('/login'); }} style={{ ...navItemStyle(false, '#ef4444'), color: '#ef4444' }}><LogOut size={17} /> Sign Out</button>
        </div>
      </div>}
      {/* Mobile overlay backdrop */}
      {sidebarOpen && <div className="portal-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* MAIN */}
      <div className="print-main portal-main-content" style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {/* Desktop sidebar toggle toolbar */}
        <div className="portal-desktop-toolbar print-hide">
          <button
            className="portal-desktop-toggle-btn"
            onClick={() => setSidebarOpen(v => !v)}
            title={sidebarOpen ? 'Hide left sidebar' : 'Show left sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
            <span>{sidebarOpen ? 'Hide Nav' : 'Show Nav'}</span>
          </button>
          <button
            className="portal-desktop-toggle-btn"
            onClick={() => setRightPanelOpen(v => !v)}
            title={rightPanelOpen ? 'Hide right panel' : 'Show right panel'}
          >
            {rightPanelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
            <span>{rightPanelOpen ? 'Hide Panel' : 'Show Panel'}</span>
          </button>
        </div>
        <div style={{ padding: '12px 52px 48px' }}>{renderContent()}</div>
      </div>

      {/* RIGHT PANEL */}
      {rightPanelOpen && <div className="portal-right-panel print-hide" style={{ width: 264, background: T.sidebarBg, borderLeft: `1px solid ${T.border}`, padding: '28px 20px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', paddingBottom: 20, borderBottom: `1px solid ${T.borderLight}` }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: rgba(accent, 0.1), border: `2px solid ${rgba(accent, 0.3)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 26, color: accent }}>{(config.name || 'A').charAt(0)}</div>
          <p style={{ margin: '0 0 4px', fontWeight: 700, color: T.text, fontSize: 15 }}>{config.name || 'Admin'}</p>
          <span style={badge(accent, rgba(accent, 0.1))}>Super Admin</span>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: T.light }}>{config.email || ''}</p>
        </div>
        <div>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '1px' }}>School Stats</p>
          {[{ label: 'Teachers', value: teachers.length }, { label: 'Students', value: students.length }, { label: 'Classes', value: classes.length }].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.borderLight}` }}>
              <span style={{ color: T.muted, fontSize: 13 }}>{s.label}</span>
              <strong style={{ color: T.text }}>{s.value}</strong>
            </div>
          ))}
        </div>
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '1px' }}>Accent Color</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: accent, border: `1px solid ${T.border}` }} />
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: T.muted }}>{accent.toUpperCase()}</span>
          </div>
        </div>
      </div>}
    </div>
  );
}
