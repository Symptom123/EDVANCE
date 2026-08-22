import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UserPlus, Users, GraduationCap, Settings,
  LogOut, Building2, CheckCircle2, AlertCircle, Loader2,
  Palette, Trash2, Plus, BookOpen, Shield, ToggleLeft,
  ToggleRight, X, School, FileSpreadsheet, Upload, Download, FileText,
  Menu, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Edit2, Check, Sparkles, Hash, Layers
} from 'lucide-react';
import { T, rgba, navItemStyle, cardStyle, inputStyle, btnStyle, badge } from '../styles/portalTheme';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import ReportCardControls from '../components/ReportCardControls';
import ReportCardView from '../components/ReportCardView';
import AdminReportCardGenerator from '../components/AdminReportCardGenerator';
import * as XLSX from 'xlsx';

const API = (import.meta.env.VITE_API_URL || 'https://edvance-1v00.onrender.com').replace(/\/+$/, '');

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isDark, T, cardStyle, inputStyle } = useTheme();
  const [config, setConfig] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [showAddSequence, setShowAddSequence] = useState(false);
  const [newSequenceName, setNewSequenceName] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('Teacher');
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassCapacity, setNewClassCapacity] = useState(45);
  const [newClassSubject, setNewClassSubject] = useState('');
  const [newClassYear, setNewClassYear] = useState('');
  const [newClassTeacher, setNewClassTeacher] = useState('');
  const [editClassName, setEditClassName] = useState('');
  const [editClassCode, setEditClassCode] = useState('');
  const [editClassCapacity, setEditClassCapacity] = useState(45);
  const [editClassTeacher, setEditClassTeacher] = useState('');
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
  // Enhanced enrollment view state
  const [enrollView, setEnrollView] = useState('classes'); // 'classes' | 'student'
  const [selectedEnrollClass, setSelectedEnrollClass] = useState(null);
  const [classEnrollments, setClassEnrollments] = useState({});  // { classId: [enrollment...] }
  const [enrollLoadingAll, setEnrollLoadingAll] = useState(false);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
  const [studentProfileData, setStudentProfileData] = useState({ marks: [], attendance: [], assignments: [] });
  const [studentProfileLoading, setStudentProfileLoading] = useState(false);
  const [moveStudentTarget, setMoveStudentTarget] = useState('');
  const [moveStudentMsg, setMoveStudentMsg] = useState('');
  const [editStudentMode, setEditStudentMode] = useState(false);
  const [editStudentName, setEditStudentName] = useState('');
  const [enrollSearchTerm, setEnrollSearchTerm] = useState('');

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
    if (!config?.schoolId) {
      setFormError('School ID is missing. Please log out and log back in.');
      setIsSubmitting(false);
      return;
    }
    try {
      const res = await fetch(`${API}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: config.schoolId, name: newUserName.trim(), role: newUserRole })
      });
      if (!res.ok) {
        let errTxt = 'Registration failed';
        try {
          const errData = await res.json();
          errTxt = errData.error || errData.message || JSON.stringify(errData);
        } catch {
          const txt = await res.text();
          if (txt) errTxt = txt;
        }
        throw new Error(errTxt);
      }
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
      const payload = {
        schoolId: config.schoolId,
        fullClassName: newClassName.trim(),
        name: newClassName.trim(),
        classCode: newClassCode.trim(),
        capacity: parseInt(newClassCapacity, 10) || 45,
        teacherId: teacher ? teacher.id : ''
      };
      const res = await fetch(`${API}/api/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errTxt = await res.text();
        throw new Error(errTxt || 'Failed to create class');
      }
      setNewClassName('');
      setNewClassCode('');
      setNewClassCapacity(45);
      setNewClassTeacher('');
      setShowAddClass(false);
      fetchClasses();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditClass = (cls) => {
    setEditingClass(cls);
    setEditClassName(cls.fullClassName || cls.name || '');
    setEditClassCode(cls.classCode || '');
    setEditClassCapacity(cls.capacity || 45);
    const teacher = teachers.find(t => t.id === cls.teacherId);
    setEditClassTeacher(teacher ? teacher.name : '');
    setFormError(null);
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    if (!editingClass) return;
    setIsSubmitting(true); setFormError(null);
    try {
      const teacher = teachers.find(t => t.name === editClassTeacher);
      const classId = editingClass.id || editingClass.ID;
      const payload = {
        fullClassName: editClassName.trim(),
        name: editClassName.trim(),
        classCode: editClassCode.trim(),
        capacity: parseInt(editClassCapacity, 10) || 45,
        teacherId: teacher ? teacher.id : (editClassTeacher ? editingClass.teacherId : '')
      };
      const res = await fetch(`${API}/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errTxt = await res.text();
        throw new Error(errTxt || 'Failed to update class');
      }
      setEditingClass(null);
      fetchClasses();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (id, className) => {
    if (!window.confirm(`Are you sure you want to delete class "${className || 'this class'}"?`)) return;
    try {
      const res = await fetch(`${API}/api/classes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errTxt = await res.text();
        alert(`Cannot delete class: ${errTxt}`);
        return;
      }
      fetchClasses();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
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

  const renderClasses = () => {
    const isCustom = config.classNamingType === 'CUSTOM';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: 0 }}>Curriculum & Structure</p>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: isCustom ? '#fef3c7' : '#dcfce7', color: isCustom ? '#b45309' : '#15803d' }}>
                {isCustom ? 'Custom Naming Mode' : 'Standard Naming Mode'}
              </span>
            </div>
            <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>
              Manage Classes <span style={{ color: T.muted, fontStyle: 'normal', fontFamily: T.fontSans, fontSize: 18 }}>({classes.length})</span>
            </h1>
          </div>
          <button onClick={() => { setShowAddClass(true); setEditingClass(null); setFormError(null); }} style={btnStyle(accent)}>
            <Plus size={15} /> + Add Class
          </button>
        </div>

        {/* CREATE CLASS FORM */}
        {showAddClass && (
          <div style={{ ...cardStyle, border: `1.5px solid ${rgba(accent, 0.3)}`, animation: 'fadeIn 0.2s ease-in-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h4 style={{ fontFamily: T.fontSans, fontWeight: 700, color: T.text, margin: 0, fontSize: 16 }}>Create New Class</h4>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: T.muted }}>
                  {isCustom ? 'Add your custom school class name, code, and capacity.' : 'Add a standard or custom parallel stream.'}
                </p>
              </div>
              <button onClick={() => setShowAddClass(false)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateClass}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Class Name *</label>
                  <input
                    required
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    placeholder="e.g. Form 1 - Science, Class 4 Advanced"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Class Code (Optional)</label>
                  <input
                    value={newClassCode}
                    onChange={e => setNewClassCode(e.target.value)}
                    placeholder="e.g. SS1S, F1-ADV (Auto if blank)"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={newClassCapacity}
                    onChange={e => setNewClassCapacity(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Assign Teacher (Optional)</label>
                  <select value={newClassTeacher} onChange={e => setNewClassTeacher(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                    <option value="">-- No Teacher Assigned --</option>
                    {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              {formError && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>⚠️ {formError}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={isSubmitting} style={btnStyle(accent)}>
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} />Save Class</>}
                </button>
                <button type="button" onClick={() => setShowAddClass(false)} style={btnStyle('#64748b', true)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* EDIT CLASS MODAL */}
        {editingClass && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
            <div style={{ ...cardStyle, width: '100%', maxWidth: 500, padding: 28, position: 'relative' }}>
              <button onClick={() => setEditingClass(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={20} /></button>
              <h2 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', margin: '0 0 4px', fontSize: 24, color: T.text }}>Edit Class</h2>
              <p style={{ color: T.muted, fontSize: 13, margin: '0 0 20px' }}>Update class details and settings</p>

              <form onSubmit={handleUpdateClass}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Class Name *</label>
                    <input
                      required
                      value={editClassName}
                      onChange={e => setEditClassName(e.target.value)}
                      placeholder="e.g. Form 1 - Science"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Class Code</label>
                      <input
                        value={editClassCode}
                        onChange={e => setEditClassCode(e.target.value)}
                        placeholder="e.g. SS1S"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Capacity</label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={editClassCapacity}
                        onChange={e => setEditClassCapacity(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Assign Teacher</label>
                    <select value={editClassTeacher} onChange={e => setEditClassTeacher(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                      <option value="">-- No Teacher Assigned --</option>
                      {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                {formError && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>⚠️ {formError}</p>}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setEditingClass(null)} style={btnStyle('#64748b', true)}>Cancel</button>
                  <button type="submit" disabled={isSubmitting} style={btnStyle(accent)}>
                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CLASSES TABLE */}
        {classes.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 24px', color: T.muted }}>
            <BookOpen size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <h3 style={{ margin: '0 0 6px', color: T.text, fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 20 }}>No classes created yet</h3>
            <p style={{ margin: '0 0 16px', fontSize: 14 }}>
              {isCustom ? 'Add your custom school classes using the "+ Add Class" button above.' : 'Create your first class to start organizing students and curriculum.'}
            </p>
            <button onClick={() => setShowAddClass(true)} style={btnStyle(accent)}><Plus size={14} /> Create First Class</button>
          </div>
        ) : (
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans, minWidth: 640 }}>
                <thead>
                  <tr style={{ background: '#faf9f7', borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Class Name</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Code</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capacity</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Enrolled</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Teacher</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map(cls => {
                    const classId = cls.id || cls.ID;
                    const displayName = cls.fullClassName || cls.name || 'Unnamed Class';
                    const teacher = teachers.find(t => t.id === cls.teacherId);
                    const enrolledCount = cls.studentCount !== undefined ? cls.studentCount : 0;
                    const cap = cls.capacity || 45;
                    const isFull = enrolledCount >= cap;

                    return (
                      <tr key={classId} style={{ borderBottom: `1px solid ${T.borderLight}`, transition: 'background 0.15s' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, background: rgba(accent, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
                              <BookOpen size={17} />
                            </div>
                            <div>
                              <strong style={{ color: T.text, fontSize: 15, display: 'block' }}>{displayName}</strong>
                              <span style={{ fontSize: 12, color: T.muted }}>
                                {cls.createdByType === 'CUSTOM_MANUAL' ? 'Custom' : 'Standard'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 16px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13, background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, color: '#334155' }}>
                            {cls.classCode || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 16px', textAlign: 'center', fontSize: 14, color: T.text, fontWeight: 500 }}>
                          {cap}
                        </td>
                        <td style={{ padding: '16px 16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                            background: isFull ? '#fee2e2' : (enrolledCount > 0 ? '#dcfce7' : '#f1f5f9'),
                            color: isFull ? '#dc2626' : (enrolledCount > 0 ? '#15803d' : '#64748b')
                          }}>
                            {enrolledCount} / {cap}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: 14, color: teacher ? T.text : T.muted }}>
                          {teacher ? teacher.name : '—'}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                            <button
                              title="Manage Roster"
                              onClick={async () => {
                                setRosterClass(cls);
                                setRosterLoading(true);
                                try {
                                  const res = await fetch(`${API}/api/enrollments?classId=${classId}&schoolId=${config.schoolId}`);
                                  setRosterEnrollments(await res.json() || []);
                                } catch { setRosterEnrollments([]); }
                                finally { setRosterLoading(false); }
                              }}
                              style={{ ...btnStyle(accent, true), padding: '6px 10px', fontSize: 12 }}
                            >
                              <Users size={13} /> Roster
                            </button>
                            <button
                              title="Edit Class"
                              onClick={() => startEditClass(cls)}
                              style={{ ...btnStyle('#475569', true), padding: '6px 8px', fontSize: 12 }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              title="Delete Class"
                              onClick={() => handleDeleteClass(classId, displayName)}
                              style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 6, color: '#ef4444', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ROSTER MODAL */}
        {rosterClass && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
            <div style={{ ...cardStyle, width: '100%', maxWidth: 540, padding: 28, position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}>
              <button onClick={() => setRosterClass(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={20} /></button>
              <h2 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', margin: '0 0 4px', fontSize: 24, color: T.text }}>Class Roster: {rosterClass.fullClassName || rosterClass.name}</h2>
              <p style={{ color: accent, fontSize: 13, fontWeight: 600, margin: '0 0 20px' }}>{rosterClass.classCode ? `Code: ${rosterClass.classCode}` : ''} ({rosterClass.year || 'Standard level'})</p>

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
                      fetchClasses();
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
                          fetchClasses();
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
  };
  
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
    const schoolId = config.schoolId;

    const loadAllClassEnrollments = async () => {
      setEnrollLoadingAll(true);
      const result = {};
      await Promise.all(classes.map(async (cls) => {
        const id = cls.ID || cls.id;
        try {
          const data = await fetch(`${API}/api/enrollments?classId=${id}&schoolId=${schoolId}`).then(r => r.json());
          result[id] = Array.isArray(data) ? data : [];
        } catch { result[id] = []; }
      }));
      setClassEnrollments(result);
      setEnrollLoadingAll(false);
    };

    const openStudentProfile = async (student, enrolledClass) => {
      setSelectedStudentProfile({ ...student, enrolledClass });
      setEnrollView('student');
      setStudentProfileLoading(true);
      setMoveStudentTarget('');
      setMoveStudentMsg('');
      setEditStudentMode(false);
      setEditStudentName(student.studentName || student.name || '');
      try {
        const [marksRes, attRes] = await Promise.all([
          fetch(`${API}/api/marks?schoolId=${schoolId}&studentId=${student.studentId || student.id}`).then(r => r.json()).catch(() => []),
          fetch(`${API}/api/attendance?schoolId=${schoolId}&studentId=${student.studentId || student.id}`).then(r => r.json()).catch(() => []),
        ]);
        setStudentProfileData({
          marks: Array.isArray(marksRes) ? marksRes : [],
          attendance: Array.isArray(attRes) ? attRes : [],
          assignments: []
        });
      } catch { setStudentProfileData({ marks: [], attendance: [], assignments: [] }); }
      setStudentProfileLoading(false);
    };

    const handleAddToClass = async (classId, studentId) => {
      if (!classId || !studentId) { setEnrollMsg('Select both class and student.'); return; }
      try {
        const res = await fetch(`${API}/api/enrollments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId, classId, studentId }) });
        if (!res.ok) throw new Error('Enrollment failed');
        setEnrollMsg('Student added to class!');
        await loadAllClassEnrollments();
        setTimeout(() => setEnrollMsg(''), 3000);
      } catch (err) { setEnrollMsg('Error: ' + err.message); }
    };

    const handleRemoveFromClass = async (classId, studentId) => {
      if (!window.confirm('Remove this student from the class?')) return;
      await fetch(`${API}/api/enrollments?classId=${classId}&studentId=${studentId}`, { method: 'DELETE' });
      setClassEnrollments(prev => ({
        ...prev,
        [classId]: (prev[classId] || []).filter(e => (e.studentId || e.id) !== studentId)
      }));
      if (selectedStudentProfile && (selectedStudentProfile.studentId === studentId || selectedStudentProfile.id === studentId)) {
        setEnrollView('classes');
        setSelectedStudentProfile(null);
      }
    };

    const handleMoveStudent = async () => {
      if (!moveStudentTarget || !selectedStudentProfile) return;
      const oldClassId = selectedStudentProfile.enrolledClass?.ID || selectedStudentProfile.enrolledClass?.id || selectedStudentProfile.classId;
      const studentId = selectedStudentProfile.studentId || selectedStudentProfile.id;
      try {
        // Remove from old class, add to new
        await fetch(`${API}/api/enrollments?classId=${oldClassId}&studentId=${studentId}`, { method: 'DELETE' });
        const res = await fetch(`${API}/api/enrollments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId, classId: moveStudentTarget, studentId }) });
        if (!res.ok) throw new Error('Move failed');
        setMoveStudentMsg('✓ Student moved successfully!');
        await loadAllClassEnrollments();
        // Update selected student's enrolled class
        const newClass = classes.find(c => (c.ID || c.id) === moveStudentTarget);
        setSelectedStudentProfile(prev => ({ ...prev, enrolledClass: newClass, classId: moveStudentTarget, className: newClass?.fullClassName || newClass?.name }));
        setTimeout(() => setMoveStudentMsg(''), 3000);
      } catch (err) { setMoveStudentMsg('Error: ' + err.message); }
    };

    const handleSaveStudentName = async () => {
      if (!editStudentName.trim() || !selectedStudentProfile) return;
      const studentId = selectedStudentProfile.studentId || selectedStudentProfile.id;
      try {
        await fetch(`${API}/api/users/${studentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editStudentName.trim() }) });
        setSelectedStudentProfile(prev => ({ ...prev, studentName: editStudentName.trim(), name: editStudentName.trim() }));
        setEditStudentMode(false);
        // Refresh student list
        const data = await fetch(`${API}/api/users?schoolId=${schoolId}&role=Student`).then(r => r.json());
        setStudents(Array.isArray(data) ? data : []);
        await loadAllClassEnrollments();
      } catch { alert('Failed to update student name'); }
    };

    const allEnrolledStudents = Object.values(classEnrollments).flat();
    const unenrolledStudents = students.filter(s => !allEnrolledStudents.some(e => (e.studentId || e.id) === s.id));

    // filtered classes + search
    const filteredClasses = classes.filter(cls => {
      if (!enrollSearchTerm) return true;
      const term = enrollSearchTerm.toLowerCase();
      const clsName = (cls.fullClassName || cls.name || '').toLowerCase();
      if (clsName.includes(term)) return true;
      const enrolled = classEnrollments[cls.ID || cls.id] || [];
      return enrolled.some(e => (e.studentName || '').toLowerCase().includes(term));
    });

    // ──────────── STUDENT PROFILE VIEW ────────────
    if (enrollView === 'student' && selectedStudentProfile) {
      const sp = selectedStudentProfile;
      const marks = studentProfileData.marks;
      const attendance = studentProfileData.attendance;
      const presentCount = attendance.filter(a => a.status === 'Present' || a.status === 'present').length;
      const absentCount = attendance.filter(a => a.status === 'Absent' || a.status === 'absent').length;
      const avgScore = marks.length > 0 ? (marks.reduce((s, m) => s + (Number(m.score) || 0), 0) / marks.length).toFixed(1) : 'N/A';
      const studentId = sp.studentId || sp.id;
      const currentClassId = sp.enrolledClass ? (sp.enrolledClass.ID || sp.enrolledClass.id) : sp.classId;
      const otherClasses = classes.filter(c => (c.ID || c.id) !== currentClassId);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => { setEnrollView('classes'); setSelectedStudentProfile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accent, fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
              ← Back to Classes
            </button>
            <span style={{ color: T.light }}>/</span>
            <span style={{ color: T.muted, fontSize: 14 }}>{sp.studentName || sp.name}</span>
          </div>

          {/* Profile Header */}
          <div style={{ ...cardStyle, display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${rgba(accent, 0.15)}, ${rgba(accent, 0.3)})`, border: `2px solid ${rgba(accent, 0.4)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 28, color: accent, flexShrink: 0 }}>
              {(sp.studentName || sp.name || '?').charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              {editStudentMode ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <input value={editStudentName} onChange={e => setEditStudentName(e.target.value)} style={{ ...inputStyle, maxWidth: 260, padding: '8px 12px' }} />
                  <button onClick={handleSaveStudentName} style={btnStyle(accent)}>Save</button>
                  <button onClick={() => setEditStudentMode(false)} style={{ ...btnStyle('#6b7280'), marginLeft: 4 }}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <h2 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 26, fontWeight: 400, margin: 0, color: T.text }}>{sp.studentName || sp.name}</h2>
                  <button onClick={() => setEditStudentMode(true)} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: T.muted, fontFamily: T.fontSans }}><Edit2 size={11} /> Edit</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span style={badge(accent, rgba(accent, 0.1))}>Student</span>
                <span style={{ fontSize: 13, color: T.muted }}><strong style={{ color: T.text }}>Class:</strong> {sp.enrolledClass?.fullClassName || sp.enrolledClass?.name || sp.className || 'Unassigned'}</span>
                <span style={{ fontSize: 13, color: T.muted }}><strong style={{ color: T.text }}>Email:</strong> {sp.email || 'N/A'}</span>
              </div>
            </div>
            {/* Stats mini row */}
            <div style={{ display: 'flex', gap: 16 }}>
              {[{ label: 'Avg Score', val: avgScore }, { label: 'Present', val: presentCount }, { label: 'Absent', val: absentCount }].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '12px 16px', borderRadius: 10, background: isDark ? '#0f172a' : '#f9f7f4', border: `1px solid ${T.border}` }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: accent }}>{s.val}</p>
                  <p style={{ margin: 0, fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Move to Class + Remove */}
          <div style={{ ...cardStyle }}>
            <p style={{ fontWeight: 700, color: T.text, margin: '0 0 14px', fontSize: 14 }}>Class Assignment</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6, textTransform: 'uppercase' }}>Move to Class</label>
                <select value={moveStudentTarget} onChange={e => setMoveStudentTarget(e.target.value)} style={{ ...inputStyle, background: isDark ? '#0f172a' : '#fff' }}>
                  <option value="">-- Select target class --</option>
                  {otherClasses.map(c => <option key={c.ID || c.id} value={c.ID || c.id}>{c.fullClassName || c.name}</option>)}
                </select>
              </div>
              <button onClick={handleMoveStudent} disabled={!moveStudentTarget} style={{ ...btnStyle(accent), opacity: moveStudentTarget ? 1 : 0.5 }}>↔ Move</button>
              <button onClick={() => handleRemoveFromClass(currentClassId, studentId)} style={{ ...btnStyle('#ef4444', true), borderColor: '#ef4444' }}><Trash2 size={14} /> Remove from Class</button>
            </div>
            {moveStudentMsg && <p style={{ marginTop: 10, fontSize: 13, color: moveStudentMsg.includes('Error') ? '#ef4444' : '#15803d', fontWeight: 500 }}>{moveStudentMsg}</p>}
          </div>

          {/* Grades */}
          <div style={{ ...cardStyle }}>
            <p style={{ fontWeight: 700, color: T.text, margin: '0 0 16px', fontSize: 14 }}>Grades & Marks</p>
            {studentProfileLoading ? <div style={{ padding: 20, textAlign: 'center', color: T.muted }}>Loading...</div> :
              marks.length === 0 ? <div style={{ padding: '24px', textAlign: 'center', color: T.muted }}>No marks recorded yet.</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans, fontSize: 13 }}>
                <thead><tr style={{ background: isDark ? '#151f30' : '#faf9f7' }}>
                  {['Subject', 'Sequence', 'Score', 'Grade'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
                </tr></thead>
                <tbody>{marks.map((m, i) => {
                  const score = Number(m.score) || 0;
                  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';
                  const gradeColor = score >= 70 ? '#15803d' : score >= 55 ? '#d97706' : '#ef4444';
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                      <td style={{ padding: '10px 14px', color: T.text, fontWeight: 500 }}>{m.subjectName || m.subject || '—'}</td>
                      <td style={{ padding: '10px 14px', color: T.muted }}>{m.sequenceName || m.sequence || '—'}</td>
                      <td style={{ padding: '10px 14px', color: T.text, fontWeight: 600 }}>{m.score}</td>
                      <td style={{ padding: '10px 14px' }}><span style={badge(gradeColor, gradeColor + '18')}>{grade}</span></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            )}
          </div>

          {/* Attendance */}
          <div style={{ ...cardStyle }}>
            <p style={{ fontWeight: 700, color: T.text, margin: '0 0 16px', fontSize: 14 }}>Attendance Record</p>
            {studentProfileLoading ? <div style={{ padding: 20, textAlign: 'center', color: T.muted }}>Loading...</div> :
              attendance.length === 0 ? <div style={{ padding: '24px', textAlign: 'center', color: T.muted }}>No attendance recorded yet.</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontSans, fontSize: 13 }}>
                <thead><tr style={{ background: isDark ? '#151f30' : '#faf9f7' }}>
                  {['Date', 'Status', 'Class'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
                </tr></thead>
                <tbody>{attendance.map((a, i) => {
                  const isPresent = (a.status || '').toLowerCase() === 'present';
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                      <td style={{ padding: '10px 14px', color: T.text }}>{a.date ? new Date(a.date).toLocaleDateString() : a.date}</td>
                      <td style={{ padding: '10px 14px' }}><span style={badge(isPresent ? '#15803d' : '#ef4444', isPresent ? '#f0fdf4' : '#fef2f2')}>{a.status}</span></td>
                      <td style={{ padding: '10px 14px', color: T.muted }}>{a.className || '—'}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            )}
          </div>
        </div>
      );
    }

    // ──────────── CLASSES VIEW (default) ────────────
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Class Management</p>
            <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Student Enrollment</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              placeholder="Search class or student..."
              value={enrollSearchTerm}
              onChange={e => setEnrollSearchTerm(e.target.value)}
              style={{ ...inputStyle, maxWidth: 240, padding: '9px 14px' }}
            />
            <button onClick={loadAllClassEnrollments} style={{ ...btnStyle(accent), gap: 6 }}>
              {enrollLoadingAll ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Users size={14} />}
              Load All Classes
            </button>
          </div>
        </div>

        {/* Quick Add to Class */}
        <div style={{ ...cardStyle }}>
          <p style={{ fontWeight: 700, color: T.text, margin: '0 0 14px', fontSize: 14 }}>Add Student to a Class</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6, textTransform: 'uppercase' }}>Select Class</label>
              <select value={enrollClassId} onChange={e => setEnrollClassId(e.target.value)} style={{ ...inputStyle, background: isDark ? '#0f172a' : '#fff' }}>
                <option value="">-- Choose Class --</option>
                {classes.map(c => <option key={c.ID || c.id} value={c.ID || c.id}>{c.fullClassName || c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6, textTransform: 'uppercase' }}>Select Student</label>
              <select value={enrollStudentId} onChange={e => setEnrollStudentId(e.target.value)} style={{ ...inputStyle, background: isDark ? '#0f172a' : '#fff' }}>
                <option value="">-- Choose Student --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button onClick={() => handleAddToClass(enrollClassId, enrollStudentId)} style={btnStyle(accent)}><Plus size={15} /> Add</button>
          </div>
          {enrollMsg && <p style={{ marginTop: 10, fontSize: 13, color: enrollMsg.includes('Error') ? '#ef4444' : '#15803d', fontWeight: 500 }}>{enrollMsg}</p>}
        </div>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: 40, color: T.muted }}>No classes created yet. Create classes first.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
            {filteredClasses.map(cls => {
              const classId = cls.ID || cls.id;
              const enrolled = classEnrollments[classId] || [];
              const isExpanded = selectedEnrollClass === classId;
              return (
                <div key={classId} style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                  {/* Class Header */}
                  <div
                    onClick={() => setSelectedEnrollClass(isExpanded ? null : classId)}
                    style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? rgba(accent, 0.06) : 'transparent', borderBottom: isExpanded ? `1px solid ${T.border}` : 'none', transition: 'background 0.15s' }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: T.text, fontSize: 15 }}>{cls.fullClassName || cls.name}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>{enrolled.length} student{enrolled.length !== 1 ? 's' : ''} enrolled {cls.capacity ? `/ ${cls.capacity} capacity` : ''}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ ...badge(accent, rgba(accent, 0.12)), fontSize: 13, fontWeight: 700 }}>{enrolled.length}</span>
                      <span style={{ color: T.muted, fontSize: 18, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}>›</span>
                    </div>
                  </div>

                  {/* Expanded Student List */}
                  {isExpanded && (
                    <div>
                      {enrolled.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: T.muted, fontSize: 13 }}>No students enrolled in this class.</div>
                      ) : (
                        enrolled.filter(e => !enrollSearchTerm || (e.studentName || '').toLowerCase().includes(enrollSearchTerm.toLowerCase())).map((enr, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: `1px solid ${T.borderLight}`, justifyContent: 'space-between' }}>
                            <button
                              onClick={() => openStudentProfile(enr, cls)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: 0, textAlign: 'left' }}
                            >
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: rgba(accent, 0.12), border: `1.5px solid ${rgba(accent, 0.25)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: accent, flexShrink: 0 }}>
                                {(enr.studentName || '?').charAt(0)}
                              </div>
                              <div>
                                <p style={{ margin: 0, fontWeight: 600, color: T.text, fontSize: 13 }}>{enr.studentName}</p>
                                <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{enr.email || 'Click to view profile'}</p>
                              </div>
                            </button>
                            <button
                              onClick={() => handleRemoveFromClass(classId, enr.studentId || enr.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: T.fontSans }}
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Unenrolled Students */}
        {unenrolledStudents.length > 0 && (
          <div style={{ ...cardStyle }}>
            <p style={{ fontWeight: 700, color: T.text, margin: '0 0 14px', fontSize: 14 }}>
              Unenrolled Students <span style={badge('#d97706', '#fffbeb')}>{unenrolledStudents.length}</span>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {unenrolledStudents.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: isDark ? '#1e293b' : '#fafaf9' }}>
                  <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{s.name}</span>
                  <select
                    onChange={async (e) => { if (e.target.value) await handleAddToClass(e.target.value, s.id); e.target.value = ''; }}
                    style={{ fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 6, padding: '3px 6px', background: isDark ? '#0f172a' : '#fff', color: T.text, cursor: 'pointer' }}
                  >
                    <option value="">Assign to class...</option>
                    {classes.map(c => <option key={c.ID || c.id} value={c.ID || c.id}>{c.fullClassName || c.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMessages = () => {
    const handleSendMsg = async (e) => {
      e.preventDefault();
      if (!msgRecipient || !msgSubject || !msgBody) { return; }
      try {
        const res = await fetch(`${API}/api/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolId: config.schoolId,
            senderId: config.id || config.userId,
            senderName: config.name || 'Admin',
            senderRole: 'Admin',
            recipientId: String(msgRecipient),
            subject: msgSubject,
            body: msgBody
          })
        });
        if (!res.ok) throw new Error(await res.text() || 'Failed to send');
        setMsgSent(true); setMsgRecipient(''); setMsgSubject(''); setMsgBody('');
        setTimeout(() => setMsgSent(false), 3000);
        fetch(`${API}/api/messages?userId=${config.id || config.userId}&box=inbox`)
          .then(r => r.json()).then(d => setMessages(Array.isArray(d) ? d : [])).catch(() => {});
      } catch (err) { alert('Failed to send message: ' + err.message); }
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
    <div className="portal-layout-wrapper" style={{ minHeight: '100vh', display: 'flex', background: T.pageBg, fontFamily: T.fontSans }}>

      {/* MOBILE HEADER (only visible on mobile) */}
      <div className="portal-mobile-header print-hide">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="portal-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <img src="/logo.png" alt="Edvance Logo" style={{ height: 30, objectFit: 'contain' }} />
          <span className="portal-mobile-role-badge">Admin</span>
        </div>
        <ThemeToggle compact />
      </div>

      {/* MOBILE SLIDING DRAWER & BACKDROP */}
      {mobileMenuOpen && (
        <>
          <div className="portal-mobile-drawer print-hide">
            <button className="portal-sidebar-overlay-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">✕</button>
            <div style={{ padding: '24px 20px', borderBottom: `1px solid ${T.borderLight}` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <img src="/logo.png" alt="Edvance Logo" style={{ height: 44, objectFit: 'contain', alignSelf: 'flex-start' }} />
                <span style={{ fontSize: 11, color: T.light, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin Portal</span>
              </div>
            </div>
            <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setShowAddUser(false);
                    setShowAddClass(false);
                    setMobileMenuOpen(false);
                  }}
                  style={navItemStyle(activeView === item.id, accent, isDark)}
                >
                  <item.icon size={17} /> {item.label}
                </button>
              ))}
            </nav>
            <div style={{ padding: '16px 12px', borderTop: `1px solid ${T.borderLight}` }}>
              <button onClick={() => { localStorage.removeItem('edvance_school_config'); navigate('/login'); }} style={{ ...navItemStyle(false, '#ef4444', isDark), color: '#ef4444' }}>
                <LogOut size={17} /> Sign Out
              </button>
            </div>
          </div>
          <div className="portal-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
        </>
      )}

      {/* DESKTOP PERMANENT SIDEBAR */}
      {sidebarOpen && (
        <aside
          className="portal-desktop-sidebar print-hide"
          style={{ width: 256, background: T.sidebarBg, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', zIndex: 20 }}
        >
          <div style={{ padding: '24px 20px', borderBottom: `1px solid ${T.borderLight}` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <img src="/logo.png" alt="Edvance Logo" style={{ height: 44, objectFit: 'contain', alignSelf: 'flex-start' }} />
              <span style={{ fontSize: 11, color: T.light, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin Portal</span>
            </div>
          </div>
          <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setShowAddUser(false);
                  setShowAddClass(false);
                }}
                style={navItemStyle(activeView === item.id, accent, isDark)}
              >
                <item.icon size={17} /> {item.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: '16px 12px', borderTop: `1px solid ${T.borderLight}` }}>
            <button onClick={() => { localStorage.removeItem('edvance_school_config'); navigate('/login'); }} style={{ ...navItemStyle(false, '#ef4444', isDark), color: '#ef4444' }}>
              <LogOut size={17} /> Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* MAIN CONTENT */}
      <div className="print-main portal-main-content" style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {/* Desktop sidebar toggle toolbar */}
        <div className="portal-desktop-toolbar print-hide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
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
          <ThemeToggle showLabel={true} />
        </div>
        <div className="portal-inner-content">{renderContent()}</div>
      </div>

      {/* DESKTOP RIGHT PANEL */}
      {rightPanelOpen && (
        <aside className="portal-right-panel print-hide" style={{ width: 264, background: T.sidebarBg, borderLeft: `1px solid ${T.border}`, padding: '24px 18px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', zIndex: 10 }}>
          <div style={{ textAlign: 'center', paddingBottom: 18, borderBottom: `1px solid ${T.borderLight}` }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: rgba(accent, 0.1), border: `2px solid ${rgba(accent, 0.3)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 24, color: accent }}>{(config?.name || 'A').charAt(0)}</div>
            <p style={{ margin: '0 0 4px', fontWeight: 700, color: T.text, fontSize: 15 }}>{config?.name || 'Admin'}</p>
            <span style={badge(accent, rgba(accent, 0.1))}>Super Admin</span>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: T.light }}>{config?.email || ''}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '1px' }}>School Stats</p>
            {[{ label: 'Teachers', value: teachers.length }, { label: 'Students', value: students.length }, { label: 'Classes', value: classes.length }].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.borderLight}` }}>
                <span style={{ color: T.muted, fontSize: 13 }}>{s.label}</span>
                <strong style={{ color: T.text }}>{s.value}</strong>
              </div>
            ))}
          </div>
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '1px' }}>Accent Color</p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: accent, border: `1px solid ${T.border}` }} />
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: T.muted }}>{accent.toUpperCase()}</span>
            </div>
          </div>
        </aside>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="portal-bottom-nav print-hide">
        <button
          className={`portal-bottom-nav-item ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => { setActiveView('overview'); setMobileMenuOpen(false); }}
        >
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </button>
        <button
          className={`portal-bottom-nav-item ${activeView === 'teachers' ? 'active' : ''}`}
          onClick={() => { setActiveView('teachers'); setMobileMenuOpen(false); }}
        >
          <Users size={18} />
          <span>Teachers</span>
        </button>
        <button
          className={`portal-bottom-nav-item ${activeView === 'students' ? 'active' : ''}`}
          onClick={() => { setActiveView('students'); setMobileMenuOpen(false); }}
        >
          <GraduationCap size={18} />
          <span>Students</span>
        </button>
        <button
          className={`portal-bottom-nav-item ${activeView === 'classes' ? 'active' : ''}`}
          onClick={() => { setActiveView('classes'); setMobileMenuOpen(false); }}
        >
          <BookOpen size={18} />
          <span>Classes</span>
        </button>
        <button
          className={`portal-bottom-nav-item ${activeView === 'reportcards' ? 'active' : ''}`}
          onClick={() => { setActiveView('reportcards'); setMobileMenuOpen(false); }}
        >
          <FileText size={18} />
          <span>Reports</span>
        </button>
      </div>
    </div>
  );
}
