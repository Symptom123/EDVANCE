import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, GraduationCap, FileText, UserPlus, Megaphone, User, LogOut, Plus, Loader2, CheckCircle2, X, Mail, Trash2, Download, BookOpen, Users, Menu, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { T, rgba, navItemStyle, cardStyle, inputStyle, btnStyle, badge } from '../styles/portalTheme';
import * as XLSX from 'xlsx';
import TeacherMarkEntryForm from '../components/TeacherMarkEntryForm';

export default function TeacherPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [config, setConfig] = useState(null);

  // Common data
  const [myClasses, setMyClasses] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [allSchoolStudents, setAllSchoolStudents] = useState([]);

  // Classes Management Tab
  const [selectedManageClass, setSelectedManageClass] = useState(null);
  const [classRoster, setClassRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [addRosterStudentId, setAddRosterStudentId] = useState('');
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [newClassYear, setNewClassYear] = useState('');
  const [createClassLoading, setCreateClassLoading] = useState(false);
  const [classSuccess, setClassSuccess] = useState('');
  
  // Dashboard
  const [dashData, setDashData] = useState({ classes: 0, students: 0, avgScore: 0, pendingAssignments: 0, chartData: [] });
  const [dashLoading, setDashLoading] = useState(true);

  // Attendance
  const [attClassId, setAttClassId] = useState('');
  const [attDate, setAttDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attStudents, setAttStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [attLoading, setAttLoading] = useState(false);
  const [attSuccess, setAttSuccess] = useState('');

  // Grading
  const [gradingClassId, setGradingClassId] = useState('');
  const [gradingSequenceId, setGradingSequenceId] = useState('');
  const [gradStudents, setGradStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [gradLoading, setGradLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  // Assignments
  const [assignClassId, setAssignClassId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newAssign, setNewAssign] = useState({ title: '', description: '', dueDate: '', maxPoints: 20 });
  const [selectedAssignForGrading, setSelectedAssignForGrading] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [gradingModalData, setGradingModalData] = useState(null);
  const [saveGradeLoading, setSaveGradeLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState('');

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [annClassId, setAnnClassId] = useState('');
  const [annText, setAnnText] = useState('');
  const [annLoading, setAnnLoading] = useState(false);

  // Messages
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgUsers, setMsgUsers] = useState([]);
  const [newMsg, setNewMsg] = useState({ recipientId: '', subject: '', body: '' });

  // Initialization
  useEffect(() => {
    const raw = localStorage.getItem('edvance_school_config');
    try {
      const p = JSON.parse(raw || '{}');
      if (p.userRole !== 'Teacher') { navigate('/login'); return; }
      setConfig(p);
    } catch { navigate('/login'); }
  }, [navigate]);

  useEffect(() => {
    if (!config) return;
    const tid = config.id || config.userId || '';
    const sid = config.schoolId || '';
    
    // Fetch dashboard
    fetch(`http://localhost:8080/api/dashboard/teacher/${tid}?schoolId=${sid}`)
      .then(r => r.json())
      .then(d => {
        setDashData(d || { classes: 0, students: 0, avgScore: 0, chartData: [] });
        setDashLoading(false);
      }).catch(() => setDashLoading(false));

    // Fetch classes
    fetch(`http://localhost:8080/api/classes?schoolId=${sid}`)
      .then(r => r.json())
      .then(c => {
        const mine = (c || []).filter(cls => !cls.teacherId || cls.teacherId === tid || cls.teacherId === config.name || String(cls.teacherId) === String(tid));
        setMyClasses(mine.length > 0 ? mine : (c || []));
        if (mine.length > 0) {
          setAttClassId(mine[0].id || mine[0].ID);
          setGradingClassId(mine[0].id || mine[0].ID);
          setAssignClassId(mine[0].id || mine[0].ID);
          setAnnClassId(mine[0].id || mine[0].ID);
        }
      });

    // Fetch sequences
    fetch(`http://localhost:8080/api/sequences?schoolId=${config.schoolId}`)
      .then(r => r.json())
      .then(s => setSequences(s || []));

    // Fetch users for messages
    fetch(`http://localhost:8080/api/users?schoolId=${config.schoolId}`)
      .then(r => r.json())
      .then(u => {
        setMsgUsers((u || []).filter(user => user.id !== config.id));
      });

    // Fetch all students for class enrollment management
    fetch(`http://localhost:8080/api/users?schoolId=${config.schoolId}&role=Student`)
      .then(r => r.json())
      .then(s => setAllSchoolStudents(s || []));

  }, [config]);

  // Handle Attendance tab
  useEffect(() => {
    if (!config || activeTab !== 'attendance' || !attClassId) return;
    setAttLoading(true);
    
    Promise.all([
      fetch(`http://localhost:8080/api/enrollments?schoolId=${config.schoolId}&classId=${attClassId}`).then(r => r.json()),
      fetch(`http://localhost:8080/api/attendance?schoolId=${config.schoolId}&classId=${attClassId}&date=${attDate}`).then(r => r.json())
    ]).then(([enr, att]) => {
      setAttStudents(enr || []);
      const attMap = {};
      (att || []).forEach(record => {
        if (record.records) {
          Object.assign(attMap, record.records);
        }
      });
      // Initialize default
      const defaultMap = { ...attMap };
      (enr || []).forEach(s => {
        if (!defaultMap[s.studentId]) defaultMap[s.studentId] = 'present';
      });
      setAttendance(defaultMap);
      setAttLoading(false);
    });
  }, [config, activeTab, attClassId, attDate]);

  const handleSaveAttendance = () => {
    setAttSuccess('');
    const tid = config.id || config.userId || '';
    fetch(`http://localhost:8080/api/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: config.schoolId,
        classId: attClassId,
        teacherId: tid,
        date: attDate,
        records: attendance
      })
    }).then(async r => {
      if (r.ok) {
        setAttSuccess(`Attendance saved successfully for ${Object.keys(attendance).length} students!`);
        setTimeout(() => setAttSuccess(''), 4000);
      } else {
        const txt = await r.text();
        alert('Failed to save attendance: ' + txt);
      }
    }).catch(err => alert('Network error: ' + err.message));
  };

  // Handle Grading tab
  useEffect(() => {
    if (!config || activeTab !== 'grading' || !gradingClassId || !gradingSequenceId) return;
    setGradLoading(true);

    Promise.all([
      fetch(`http://localhost:8080/api/enrollments?schoolId=${config.schoolId}&classId=${gradingClassId}`).then(r => r.json()),
      fetch(`http://localhost:8080/api/marks?schoolId=${config.schoolId}&classId=${gradingClassId}&sequenceId=${gradingSequenceId}`).then(r => r.json())
    ]).then(([enr, marksData]) => {
      setGradStudents(enr || []);
      const m = {};
      (marksData || []).forEach(mk => {
        m[mk.studentId] = mk.score;
      });
      setMarks(m);
      setGradLoading(false);
    });
  }, [config, activeTab, gradingClassId, gradingSequenceId]);

  const handleSaveMarks = () => {
    const selectedCls = myClasses.find(c => (c.id || c.ID) === gradingClassId);
    if (!selectedCls) return;
    
    const promises = gradStudents.map(s => {
      const score = marks[s.studentId];
      if (score === undefined || score === '') return Promise.resolve();
      
      return fetch(`http://localhost:8080/api/marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: config.schoolId,
          studentId: s.studentId,
          classId: gradingClassId,
          subjectId: selectedCls.subject || selectedCls.name,
          sequenceId: gradingSequenceId,
          score: Number(score),
          teacherId: config.id
        })
      });
    });

    Promise.all(promises).then(() => {
      alert('All marks saved successfully');
    });
  };

  const handleExcelTemplateDownload = () => {
    if (!gradingClassId || !gradingSequenceId) { alert("Please select a class and sequence first."); return; }
    const templateData = gradStudents.map(s => ({
      studentId: s.studentId,
      studentName: s.studentName,
      score: marks[s.studentId] !== undefined ? marks[s.studentId] : ''
    }));
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
    XLSX.writeFile(wb, "marks_template.xlsx");
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !gradingClassId || !gradingSequenceId) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        const newMarks = { ...marks };
        data.forEach(r => {
          if (r.studentId && r.score !== undefined) {
            newMarks[r.studentId] = Number(r.score);
          }
        });
        setMarks(newMarks);
        alert("Marks imported from Excel. Don't forget to click 'Save All Marks'.");
      } catch (err) {
        alert('Error reading file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Handle Assignments tab
  const fetchAssignments = () => {
    if (!assignClassId) return;
    setAssignLoading(true);
    fetch(`http://localhost:8080/api/assignments?schoolId=${config.schoolId}&classId=${assignClassId}`)
      .then(r => r.json())
      .then(d => { setAssignments(d || []); setAssignLoading(false); })
      .catch(() => setAssignLoading(false));
  };
  useEffect(() => {
    if (activeTab === 'assignments' && assignClassId) fetchAssignments();
  }, [activeTab, assignClassId]);

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    const tid = config.id || config.userId || '';
    fetch(`http://localhost:8080/api/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: config.schoolId,
        classId: assignClassId,
        teacherId: tid,
        teacherName: config.name,
        title: newAssign.title,
        description: newAssign.description,
        dueDate: newAssign.dueDate,
        maxPoints: Number(newAssign.maxPoints) || 20
      })
    }).then(r => {
      if (r.ok) {
        setShowAssignModal(false);
        setNewAssign({ title: '', description: '', dueDate: '', maxPoints: 20 });
        setAssignSuccess('Assignment created and dispatched to students!');
        setTimeout(() => setAssignSuccess(''), 4000);
        fetchAssignments();
      }
    });
  };

  const handleOpenSubmissions = (assign) => {
    setSelectedAssignForGrading(assign);
    setSubmissionsLoading(true);
    setAssignSuccess('');
    fetch(`http://localhost:8080/api/assignments/${assign.id || assign.ID}/submissions`)
      .then(r => r.json())
      .then(d => {
        setSubmissions(Array.isArray(d) ? d : []);
        setSubmissionsLoading(false);
      })
      .catch(() => setSubmissionsLoading(false));
  };

  const handleSaveGrade = (submissionId, gradeVal, feedbackVal) => {
    setSaveGradeLoading(true);
    fetch(`http://localhost:8080/api/assignments/submissions/${submissionId}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grade: parseFloat(gradeVal),
        feedback: feedbackVal
      })
    })
      .then(r => r.json())
      .then(() => {
        setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, grade: parseFloat(gradeVal), feedback: feedbackVal, status: 'graded' } : s));
        setGradingModalData(null);
        setAssignSuccess('Grade and feedback saved successfully!');
        setTimeout(() => setAssignSuccess(''), 3000);
      })
      .catch(err => alert('Error saving grade: ' + err.message))
      .finally(() => setSaveGradeLoading(false));
  };

  // Handle Announcements tab
  const fetchAnnouncements = () => {
    setAnnLoading(true);
    fetch(`http://localhost:8080/api/announcements?schoolId=${config.schoolId}`)
      .then(r => r.json())
      .then(d => { setAnnouncements(d || []); setAnnLoading(false); })
      .catch(() => setAnnLoading(false));
  };
  useEffect(() => {
    if (activeTab === 'announcements') fetchAnnouncements();
  }, [activeTab]);

  const handleCreateAnnouncement = () => {
    if (!annText.trim() || !annClassId) return;
    fetch(`http://localhost:8080/api/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: config.schoolId,
        classId: annClassId,
        teacherId: config.id,
        teacherName: config.name,
        message: annText
      })
    }).then(r => {
      if (r.ok) {
        setAnnText('');
        fetchAnnouncements();
      }
    });
  };

  const handleDeleteAnnouncement = (id) => {
    fetch(`http://localhost:8080/api/announcements/${id}`, { method: 'DELETE' })
      .then(r => { if(r.ok) fetchAnnouncements(); });
  };

  // Handle Messages tab
  const fetchMessages = () => {
    setMsgLoading(true);
    fetch(`http://localhost:8080/api/messages?userId=${config.id}&box=inbox`)
      .then(r => r.json())
      .then(d => { setMessages(d || []); setMsgLoading(false); })
      .catch(() => setMsgLoading(false));
  };
  useEffect(() => {
    if (activeTab === 'messages') fetchMessages();
  }, [activeTab]);

  const handleReadMessage = (msg) => {
    if (!msg.isRead) {
      fetch(`http://localhost:8080/api/messages/${msg.id || msg.ID}/read`, { method: 'PUT' })
        .then(() => fetchMessages());
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    fetch(`http://localhost:8080/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: config.schoolId,
        senderId: config.id,
        senderName: config.name,
        senderRole: 'Teacher',
        recipientId: newMsg.recipientId,
        subject: newMsg.subject,
        body: newMsg.body
      })
    }).then(r => {
      if (r.ok) {
        setShowMsgModal(false);
        setNewMsg({ recipientId: '', subject: '', body: '' });
      }
    });
  };

  if (!config) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: '#f5f4f0' }}>
      <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
      <p style={{ color: '#9ca3af', fontSize: 14, fontFamily: 'system-ui' }}>Loading your portal...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  const accent = config.primaryColor || '#2563eb';
  const name = config.name || 'Teacher';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'classes', label: 'My Classes', icon: BookOpen },
    { id: 'attendance', label: 'Take Attendance', icon: ClipboardCheck },
    { id: 'grading', label: 'Grading', icon: GraduationCap },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'messages', label: 'Messages', icon: Mail },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const renderDashboard = () => {
    let maxAvg = Math.max(...(dashData.chartData || []).map(d => d.avg || 0), 20);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 8px' }}>Teacher Dashboard</p>
          <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 38, fontWeight: 400, margin: 0, color: T.text }}>Good morning, {name} 👋</h1>
          <p style={{ color: T.muted, margin: '8px 0 0', fontSize: 15 }}>Here's your accurate academic and classroom overview for today.</p>
        </div>
        
        {dashLoading ? <div style={{ display: 'flex', gap: 8, color: T.muted }}><Loader2 size={16} className="spin" /> Loading stats...</div> : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { label: 'Total Students', value: dashData.students || 0, color: accent, icon: Users }, 
                { label: 'Total Classes', value: dashData.classes || myClasses.length, color: '#059669', icon: BookOpen }, 
                { label: 'Avg Class Score', value: `${Number(dashData.avgScore || 0).toFixed(1)}/20`, color: '#d97706', icon: GraduationCap },
                { label: 'Pending Submissions', value: dashData.pendingAssignments || 0, color: '#dc2626', icon: FileText }
              ].map(s => (
                <div key={s.label} style={{ ...cardStyle, borderTop: `3px solid ${s.color}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <p style={{ color: T.muted, fontSize: 13, fontWeight: 600, margin: 0 }}>{s.label}</p>
                    <s.icon size={18} style={{ color: s.color, opacity: 0.8 }} />
                  </div>
                  <p style={{ fontFamily: T.fontSerif, fontSize: 36, margin: 0, color: T.text, lineHeight: 1 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions Bar */}
            <div style={{ ...cardStyle, padding: 18, background: '#faf9f7', border: `1px solid ${T.border}` }}>
              <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: T.light }}>Quick Actions</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={() => { setActiveTab('classes'); setShowCreateClassModal(true); }} style={{ ...btnStyle(accent), fontSize: 13, padding: '8px 14px' }}>
                  <Plus size={14} /> Create New Class
                </button>
                <button onClick={() => setActiveTab('attendance')} style={{ ...btnStyle(accent, true), fontSize: 13, padding: '8px 14px' }}>
                  <ClipboardCheck size={14} /> Take Daily Attendance
                </button>
                <button onClick={() => setActiveTab('grading')} style={{ ...btnStyle(accent, true), fontSize: 13, padding: '8px 14px' }}>
                  <GraduationCap size={14} /> Enter Multi-Sequence Marks
                </button>
                <button onClick={() => { setActiveTab('assignments'); setShowAssignModal(true); }} style={{ ...btnStyle(accent, true), fontSize: 13, padding: '8px 14px' }}>
                  <FileText size={14} /> Post Assignment
                </button>
              </div>
            </div>

            <div style={cardStyle}>
              <p style={{ fontFamily: T.fontSans, fontWeight: 600, color: T.text, margin: '0 0 4px', fontSize: 15 }}>Class Performance Over Time</p>
              <p style={{ color: T.muted, fontSize: 13, margin: '0 0 20px' }}>Average score per sequence / term</p>
              
              {(!dashData.chartData || dashData.chartData.length === 0) ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: T.muted, fontStyle: 'italic' }}>No marks entered yet to plot performance curve.</div>
              ) : (
                <svg viewBox="0 0 700 160" style={{ width: '100%', display: 'block' }}>
                  <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity="0.15" /><stop offset="100%" stopColor={accent} stopOpacity="0" /></linearGradient></defs>
                  {[0,40,80,120,160].map((y,i) => <line key={i} x1="0" y1={y} x2="700" y2={y} stroke={T.border} strokeWidth="1" />)}
                  
                  {(() => {
                    const points = dashData.chartData.map((d, i) => {
                      const x = (i / Math.max(1, dashData.chartData.length - 1)) * 700;
                      const y = 160 - (((d.avg || 0) / maxAvg) * 130); 
                      return [x, y];
                    });
                    const pointsStr = points.map(p => p.join(',')).join(' ');
                    const polyPoints = `0,160 ${pointsStr} 700,160`;
                    
                    return (
                      <>
                        <polyline fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pointsStr} />
                        <polygon fill="url(#tg)" points={polyPoints} />
                        {points.map(([x,y],i) => <circle key={i} cx={x} cy={y} r="5" fill={accent} stroke="white" strokeWidth="2" />)}
                      </>
                    );
                  })()}
                </svg>
              )}
              {dashData.chartData && dashData.chartData.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  {dashData.chartData.map((d, i) => <span key={i} style={{ color: T.light, fontSize: 11, fontWeight: 500 }}>{d.name} ({Number(d.avg || 0).toFixed(1)})</span>)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderAttendanceView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Daily Record</p>
        <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Take Attendance</h1>
      </div>

      {attSuccess && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> {attSuccess}
        </div>
      )}
      
      <div style={{ ...cardStyle, maxWidth: 680 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Select Class</label>
            <select value={attClassId} onChange={e => setAttClassId(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
              {myClasses.map(c => <option key={c.id || c.ID} value={c.id || c.ID}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Date</label>
            <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} style={{ ...inputStyle, background: '#fff' }} />
          </div>
        </div>

        {/* Quick bulk action buttons */}
        {attStudents.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.borderLight}`, marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>{attStudents.length} Students in Roster</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  const allP = {};
                  attStudents.forEach(s => allP[s.studentId] = 'present');
                  setAttendance(allP);
                }}
                style={{ ...btnStyle(accent, true), padding: '4px 10px', fontSize: 11 }}
              >
                Mark All Present
              </button>
              <button
                onClick={() => {
                  const allA = {};
                  attStudents.forEach(s => allA[s.studentId] = 'absent');
                  setAttendance(allA);
                }}
                style={{ ...btnStyle('#ef4444', true), padding: '4px 10px', fontSize: 11 }}
              >
                Mark All Absent
              </button>
            </div>
          </div>
        )}

        {attLoading ? <div style={{ color: T.muted, padding: '20px 0' }}><Loader2 size={16} className="spin" /> Loading students...</div> : 
         attStudents.length === 0 ? (
          <div style={{ padding: '30px 0', textAlign: 'center' }}>
            <p style={{ color: T.muted, fontSize: 14, margin: '0 0 12px' }}>No students enrolled in this class roster yet.</p>
            <button onClick={() => {
              const cls = myClasses.find(c => (c.id || c.ID) === attClassId);
              if (cls) handleFetchClassRoster(cls);
              setActiveTab('classes');
            }} style={btnStyle(accent)}>
              <Users size={14} /> Open Roster & Enroll Students
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', divideY: `1px solid ${T.borderLight}` }}>
              {attStudents.map((s) => (
                <div key={s.studentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${T.borderLight}` }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: rgba(accent, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontSerif, fontStyle: 'italic', color: accent }}>{(s.studentName || '?').charAt(0)}</div>
                    <div>
                      <strong style={{ fontSize: 14, color: T.text, display: 'block' }}>{s.studentName}</strong>
                      <span style={{ fontSize: 11, color: T.light }}>ID: {s.studentId}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['present', 'absent', 'late'].map(st => (
                      <button key={st} onClick={() => setAttendance(a => ({ ...a, [s.studentId]: st }))}
                        style={{ padding: '6px 14px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: T.fontSans, background: attendance[s.studentId] === st ? (st === 'present' ? '#dcfce7' : st === 'absent' ? '#fee2e2' : '#fef9c3') : T.borderLight, color: attendance[s.studentId] === st ? (st === 'present' ? '#15803d' : st === 'absent' ? '#dc2626' : '#d97706') : T.muted, transition: 'all 0.15s', textTransform: 'capitalize' }}>
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleSaveAttendance} style={{ ...btnStyle(accent), marginTop: 20, width: '100%', justifyContent: 'center', padding: '12px' }}>
              <CheckCircle2 size={16} /> Save Attendance Record
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderGrading = () => {
    return (
      <TeacherMarkEntryForm config={config} myClasses={myClasses} accent={accent} />
    );
  };

  const renderAssignments = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Coursework & Grading</p>
          <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Assignments & Submissions</h1>
        </div>
        <button onClick={() => setShowAssignModal(true)} style={btnStyle(accent)}>
          <Plus size={15} /> Create Assignment
        </button>
      </div>

      {assignSuccess && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> {assignSuccess}
        </div>
      )}
      
      <div style={{ maxWidth: 400 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Filter by Class</label>
        <select value={assignClassId} onChange={e => setAssignClassId(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
          {myClasses.map(c => <option key={c.id || c.ID} value={c.id || c.ID}>{c.name}</option>)}
        </select>
      </div>

      {assignLoading ? <div style={{ color: T.muted }}><Loader2 size={16} className="spin" /> Loading assignments...</div> : assignments.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '50px 20px' }}>
          <FileText size={36} style={{ color: T.light, marginBottom: 12 }} />
          <h3 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', margin: '0 0 6px', color: T.text }}>No Assignments for this Class</h3>
          <p style={{ color: T.muted, fontSize: 14, margin: '0 0 16px' }}>Create an assignment to assign coursework, review submitted work, and return grades to your students.</p>
          <button onClick={() => setShowAssignModal(true)} style={btnStyle(accent)}>
            <Plus size={15} /> Create First Assignment
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {assignments.map((a, i) => (
            <div key={a.id || i} style={{ ...cardStyle, borderLeft: `4px solid ${accent}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <h3 style={{ fontFamily: T.fontSans, fontWeight: 700, fontSize: 16, margin: 0, color: T.text }}>{a.title}</h3>
                  <span style={badge(accent, rgba(accent, 0.1))}>Max: {a.maxPoints || 20} pts</span>
                </div>
                <p style={{ color: T.muted, fontSize: 12, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>📅 Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                </p>
                <p style={{ color: T.text, fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>{a.description}</p>
              </div>
              
              <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => handleOpenSubmissions(a)}
                  style={{ ...btnStyle(accent), justifyContent: 'center', padding: '8px 12px', fontSize: 13 }}
                >
                  <Users size={14} /> View Submissions ({a.submissionCount || 0}) & Grade
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => window.print()} style={{ ...btnStyle(accent, true), flex: 1, justifyContent: 'center', padding: '6px 8px', fontSize: 12 }}>
                    <Download size={13}/> Print PDF
                  </button>
                  <button onClick={() => {
                    if (window.confirm('Delete this assignment?')) {
                      fetch(`http://localhost:8080/api/assignments/${a.id || a.ID}`, { method: 'DELETE' }).then(() => fetchAssignments());
                    }
                  }} style={{ ...btnStyle('#ef4444', true), flex: 1, justifyContent: 'center', padding: '6px 8px', fontSize: 12 }}>
                    <Trash2 size={13}/> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ ...cardStyle, width: 440, maxWidth: '90%', position: 'relative' }}>
            <button onClick={() => setShowAssignModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={18} /></button>
            <h2 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', margin: '0 0 16px', fontSize: 22, color: T.text }}>Create Assignment</h2>
            <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>Assignment Title</label>
                <input required type="text" value={newAssign.title} onChange={e => setNewAssign(a => ({ ...a, title: e.target.value }))} placeholder="e.g. Chapter 4 Calculus Problem Set" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>Instructions / Description</label>
                <textarea required value={newAssign.description} onChange={e => setNewAssign(a => ({ ...a, description: e.target.value }))} rows={4} placeholder="Describe the task and expectations for the students..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>Due Date</label>
                  <input required type="date" value={newAssign.dueDate} onChange={e => setNewAssign(a => ({ ...a, dueDate: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>Max Points</label>
                  <input required type="number" min="1" max="100" value={newAssign.maxPoints} onChange={e => setNewAssign(a => ({ ...a, maxPoints: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="submit" style={{ ...btnStyle(accent), flex: 1, justifyContent: 'center' }}>Publish to Class</button>
                <button type="button" onClick={() => setShowAssignModal(false)} style={{ ...btnStyle('#6b7280'), flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW SUBMISSIONS & GRADING MODAL */}
      {selectedAssignForGrading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ ...cardStyle, width: 650, maxWidth: '95%', maxHeight: '88vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setSelectedAssignForGrading(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={20} /></button>
            <h2 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', margin: '0 0 4px', fontSize: 24, color: T.text }}>
              Submissions: {selectedAssignForGrading.title}
            </h2>
            <p style={{ color: T.muted, fontSize: 13, margin: '0 0 18px' }}>
              Max Points: <strong>{selectedAssignForGrading.maxPoints || 20}</strong> | Due: {new Date(selectedAssignForGrading.dueDate).toLocaleDateString()}
            </p>

            {submissionsLoading ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: T.muted }}><Loader2 size={16} className="spin" /> Loading student submissions...</div>
            ) : submissions.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', background: '#faf9f7', borderRadius: 8, border: `1px solid ${T.border}` }}>
                <p style={{ color: T.muted, margin: 0, fontSize: 14, fontStyle: 'italic' }}>No students have submitted work for this assignment yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {submissions.map((sub, i) => (
                  <div key={sub.id || i} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, background: sub.status === 'graded' ? '#f0fdf4' : '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <strong style={{ fontSize: 15, color: T.text }}>{sub.studentName || 'Student'}</strong>
                        <span style={{ fontSize: 12, color: T.light, display: 'block', marginTop: 2 }}>Submitted: {new Date(sub.submittedAt).toLocaleString()}</span>
                      </div>
                      <span style={sub.status === 'graded' ? badge('#15803d', '#dcfce7') : badge('#d97706', '#fef9c3')}>
                        {sub.status === 'graded' ? `Graded: ${sub.grade}/${selectedAssignForGrading.maxPoints || 20}` : 'Needs Grading'}
                      </span>
                    </div>

                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0', margin: '8px 0 12px', fontSize: 14, color: '#334155', whiteSpace: 'pre-wrap' }}>
                      {sub.content || '(No text content submitted)'}
                    </div>

                    {sub.feedback && (
                      <p style={{ fontSize: 13, color: '#0f766e', background: '#f0fdfa', padding: '8px 10px', borderRadius: 6, margin: '0 0 10px' }}>
                        <strong>Feedback:</strong> {sub.feedback}
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setGradingModalData({ submissionId: sub.id, studentName: sub.studentName, content: sub.content, grade: sub.grade !== null && sub.grade !== undefined ? sub.grade : '', feedback: sub.feedback || '' })}
                        style={{ ...btnStyle(accent), padding: '6px 14px', fontSize: 13 }}
                      >
                        {sub.status === 'graded' ? 'Edit Grade & Feedback' : 'Grade Submission'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* INDIVIDUAL GRADING MODAL */}
      {gradingModalData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ ...cardStyle, width: 440, maxWidth: '90%', position: 'relative' }}>
            <button onClick={() => setGradingModalData(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={18} /></button>
            <h3 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', margin: '0 0 6px', fontSize: 22, color: T.text }}>
              Grade: {gradingModalData.studentName}
            </h3>
            <p style={{ color: T.muted, fontSize: 12, margin: '0 0 16px' }}>Max scale: {selectedAssignForGrading?.maxPoints || 20} points</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>Score ({selectedAssignForGrading?.maxPoints || 20} pts max)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={selectedAssignForGrading?.maxPoints || 100}
                  value={gradingModalData.grade}
                  onChange={e => setGradingModalData(d => ({ ...d, grade: e.target.value }))}
                  placeholder={`e.g. 18.5`}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>Teacher Feedback / Comments</label>
                <textarea
                  value={gradingModalData.feedback}
                  onChange={e => setGradingModalData(d => ({ ...d, feedback: e.target.value }))}
                  rows={3}
                  placeholder="Well done, excellent working out on step 3..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  disabled={saveGradeLoading || gradingModalData.grade === ''}
                  onClick={() => handleSaveGrade(gradingModalData.submissionId, gradingModalData.grade, gradingModalData.feedback)}
                  style={{ ...btnStyle(accent), flex: 1, justifyContent: 'center' }}
                >
                  {saveGradeLoading ? 'Saving...' : 'Save & Return Grade'}
                </button>
                <button type="button" onClick={() => setGradingModalData(null)} style={{ ...btnStyle('#6b7280'), flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnnouncements = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Communications</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Announcements</h1></div>
      <div style={{ ...cardStyle, maxWidth: 560 }}>
        <p style={{ fontFamily: T.fontSans, fontWeight: 700, fontSize: 15, color: T.text, margin: '0 0 16px' }}>New Announcement</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Select Class</label>
            <select value={annClassId} onChange={e => setAnnClassId(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
              {myClasses.map(c => <option key={c.id || c.ID} value={c.id || c.ID}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Message</label>
            <textarea value={annText} onChange={e => setAnnText(e.target.value)} rows={4} placeholder="Write your announcement here…" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <button onClick={handleCreateAnnouncement} style={btnStyle(accent)}><Megaphone size={15} />Send to Class</button>
        </div>
      </div>
      
      {annLoading ? <div style={{ color: T.muted }}>Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {announcements.length === 0 ? <p style={{ color: T.muted }}>No announcements found.</p> : announcements.map((a, i) => {
            const cls = myClasses.find(c => (c.id || c.ID) === a.classId) || { name: 'Class ' + a.classId };
            return (
              <div key={a.id || i} style={{ ...cardStyle, borderLeft: `4px solid ${accent}`, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={badge(accent, rgba(accent, 0.1))}>{cls.name}</span>
                  <span style={{ fontSize: 12, color: T.light }}>{new Date(a.CreatedAt || Date.now()).toLocaleDateString()}</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: T.text, lineHeight: 1.6 }}>{a.message}</p>
                <button onClick={() => handleDeleteAnnouncement(a.id || a.ID)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderMessages = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Inbox</p><h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Messages</h1></div>
        <button onClick={() => setShowMsgModal(true)} style={btnStyle(accent)}><Plus size={15} />Compose Message</button>
      </div>

      {msgLoading ? <div style={{ color: T.muted }}>Loading messages...</div> : messages.length === 0 ? <div style={{ color: T.muted }}>Inbox is empty.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((m, i) => (
            <div key={m.id || i} onClick={() => handleReadMessage(m)} style={{ ...cardStyle, cursor: 'pointer', borderLeft: `4px solid ${m.isRead ? T.borderLight : accent}`, background: m.isRead ? '#fff' : '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <strong style={{ color: T.text, fontSize: 15 }}>{m.subject}</strong>
                <span style={{ fontSize: 12, color: T.light }}>{new Date(m.CreatedAt || Date.now()).toLocaleString()}</span>
              </div>
              <p style={{ fontSize: 13, color: T.muted, margin: '0 0 8px' }}>From: {m.senderName} ({m.senderRole})</p>
              <p style={{ fontSize: 14, color: T.text, margin: 0 }}>{m.body}</p>
            </div>
          ))}
        </div>
      )}

      {showMsgModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...cardStyle, width: 400, maxWidth: '90%' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Compose Message</h2>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>To</label>
                <select required value={newMsg.recipientId} onChange={e => setNewMsg(m => ({ ...m, recipientId: e.target.value }))} style={{ ...inputStyle, background: '#fff' }}>
                  <option value="">-- Select Recipient --</option>
                  {msgUsers.map(u => <option key={u.id || u.ID} value={u.id || u.ID}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>Subject</label>
                <input required type="text" value={newMsg.subject} onChange={e => setNewMsg(m => ({ ...m, subject: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>Body</label>
                <textarea required value={newMsg.body} onChange={e => setNewMsg(m => ({ ...m, body: e.target.value }))} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="submit" style={{ ...btnStyle(accent), flex: 1 }}>Send</button>
                <button type="button" onClick={() => setShowMsgModal(false)} style={{ ...btnStyle('#6b7280'), flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const fetchClassesAgain = () => {
    const tid = config?.id || config?.userId || '';
    const sid = config?.schoolId || '';
    fetch(`http://localhost:8080/api/classes?schoolId=${sid}`)
      .then(r => r.json())
      .then(c => {
        const mine = (c || []).filter(cls => !cls.teacherId || cls.teacherId === tid || cls.teacherId === config.name || String(cls.teacherId) === String(tid));
        const list = mine.length > 0 ? mine : (c || []);
        setMyClasses(list);
        if (list.length > 0) {
          if (!attClassId) setAttClassId(list[0].id || list[0].ID);
          if (!gradingClassId) setGradingClassId(list[0].id || list[0].ID);
          if (!assignClassId) setAssignClassId(list[0].id || list[0].ID);
          if (!annClassId) setAnnClassId(list[0].id || list[0].ID);
        }
      });
  };

  const handleFetchClassRoster = (cls) => {
    setSelectedManageClass(cls);
    setRosterLoading(true);
    const classId = cls.id || cls.ID;
    fetch(`http://localhost:8080/api/enrollments?schoolId=${config.schoolId}&classId=${classId}`)
      .then(r => r.json())
      .then(d => { setClassRoster(d || []); setRosterLoading(false); })
      .catch(() => setRosterLoading(false));
  };

  const handleAddStudentToClass = () => {
    if (!addRosterStudentId || !selectedManageClass) return;
    const classId = selectedManageClass.id || selectedManageClass.ID;
    fetch(`http://localhost:8080/api/enrollments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: config.schoolId,
        classId: classId,
        studentId: addRosterStudentId
      })
    }).then(r => {
      if (r.ok) {
        setAddRosterStudentId('');
        handleFetchClassRoster(selectedManageClass);
      }
    });
  };

  const handleRemoveStudentFromClass = (studentId) => {
    if (!selectedManageClass || !window.confirm('Remove student from this class?')) return;
    const classId = selectedManageClass.id || selectedManageClass.ID;
    fetch(`http://localhost:8080/api/enrollments?classId=${classId}&studentId=${studentId}`, {
      method: 'DELETE'
    }).then(r => {
      if (r.ok) {
        handleFetchClassRoster(selectedManageClass);
      }
    });
  };

  const handleCreateNewClass = (e) => {
    e.preventDefault();
    if (!newClassName || !newClassSubject) return;
    setCreateClassLoading(true);
    setClassSuccess('');
    const tid = config.id || config.userId || '';
    fetch(`http://localhost:8080/api/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: config.schoolId,
        name: newClassName,
        subject: newClassSubject,
        year: newClassYear,
        teacherId: tid
      })
    }).then(async r => {
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(txt || 'Failed to create class');
      }
      return r.json();
    }).then(created => {
      setShowCreateClassModal(false);
      setNewClassName(''); setNewClassSubject(''); setNewClassYear('');
      setClassSuccess(`Class "${created.name || newClassName}" created successfully!`);
      fetchClassesAgain();
    }).catch(err => {
      alert('Error creating class: ' + err.message);
    }).finally(() => setCreateClassLoading(false));
  };

  const renderClassesTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Class Management</p>
          <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>My Classes ({myClasses.length})</h1>
        </div>
        <button onClick={() => setShowCreateClassModal(true)} style={btnStyle(accent)}>
          <Plus size={15} /> Create Class
        </button>
      </div>

      {classSuccess && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> {classSuccess}
        </div>
      )}

      {myClasses.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 24px' }}>
          <BookOpen size={36} style={{ color: T.light, marginBottom: 12 }} />
          <h3 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', margin: '0 0 6px', color: T.text }}>No Classes Assigned Yet</h3>
          <p style={{ color: T.muted, fontSize: 14, margin: '0 0 16px' }}>Create a new class above or ask your school admin to assign you to a class.</p>
          <button onClick={() => setShowCreateClassModal(true)} style={btnStyle(accent)}>
            <Plus size={15} /> Create Your First Class
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {myClasses.map((cls, i) => {
            const classId = cls.id || cls.ID;
            return (
              <div key={i} style={{ ...cardStyle, borderTop: `3px solid ${accent}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 22, margin: '0 0 4px', color: T.text }}>{cls.name}</h3>
                    <span style={badge(accent, rgba(accent, 0.1))}>{cls.subject}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: T.muted, marginTop: 12, marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Level / Year</span><strong style={{ color: T.text }}>{cls.year || 'All Levels'}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Assigned Teacher</span><strong style={{ color: T.text }}>{name}</strong></div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: `1px solid ${T.borderLight}`, paddingTop: 14 }}>
                  <button onClick={() => handleFetchClassRoster(cls)} style={{ ...btnStyle(accent), justifyContent: 'center', fontSize: 13, padding: '9px 12px' }}>
                    <Users size={14} /> Manage Student Roster
                  </button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { setGradingClassId(classId); setActiveTab('grading'); }}
                      style={{ ...btnStyle(accent, true), flex: 1, justifyContent: 'center', fontSize: 12, padding: '7px 8px' }}
                    >
                      <GraduationCap size={13} /> Enter Marks
                    </button>
                    <button
                      onClick={() => { setAttClassId(classId); setActiveTab('attendance'); }}
                      style={{ ...btnStyle(accent, true), flex: 1, justifyContent: 'center', fontSize: 12, padding: '7px 8px' }}
                    >
                      <ClipboardCheck size={13} /> Attendance
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {showCreateClassModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...cardStyle, width: '100%', maxWidth: 480, padding: 28, position: 'relative' }}>
            <button onClick={() => setShowCreateClassModal(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={20} /></button>
            <h2 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', margin: '0 0 18px', fontSize: 24, color: T.text }}>Create New Class</h2>
            <form onSubmit={handleCreateNewClass} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Class Name</label>
                <input required type="text" value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="e.g. Mathematics Grade 10" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Subject</label>
                <input required type="text" value={newClassSubject} onChange={e => setNewClassSubject(e.target.value)} placeholder="e.g. Mathematics" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Year / Level</label>
                <input type="text" value={newClassYear} onChange={e => setNewClassYear(e.target.value)} placeholder="e.g. Grade 10" style={inputStyle} />
              </div>
              <button disabled={createClassLoading} type="submit" style={{ ...btnStyle(accent), marginTop: 10, justifyContent: 'center' }}>
                {createClassLoading ? 'Creating...' : 'Create Class'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE ROSTER MODAL */}
      {selectedManageClass && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...cardStyle, width: '100%', maxWidth: 540, padding: 28, position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setSelectedManageClass(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={20} /></button>
            <h2 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', margin: '0 0 4px', fontSize: 24, color: T.text }}>Class Roster: {selectedManageClass.name}</h2>
            <p style={{ color: accent, fontSize: 13, fontWeight: 600, margin: '0 0 20px' }}>{selectedManageClass.subject} ({selectedManageClass.year || 'All Levels'})</p>

            {/* Add student section */}
            <div style={{ marginBottom: 20, background: '#faf9f7', padding: 14, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>Enroll Student into this Class</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <select value={addRosterStudentId} onChange={e => setAddRosterStudentId(e.target.value)} style={{ ...inputStyle, flex: 1, background: '#fff' }}>
                  <option value="">-- Choose Student --</option>
                  {allSchoolStudents.filter(s => !classRoster.some(cr => cr.studentId === s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
                <button onClick={handleAddStudentToClass} style={btnStyle(accent)}>
                  <Plus size={14} /> Enroll Student
                </button>
              </div>
            </div>

            {/* Roster list */}
            <h4 style={{ fontFamily: T.fontSans, fontWeight: 700, fontSize: 14, color: T.text, margin: '0 0 10px' }}>Enrolled Students ({classRoster.length})</h4>
            {rosterLoading ? <p style={{ fontSize: 13, color: T.muted }}>Loading roster...</p> : classRoster.length === 0 ? (
              <p style={{ fontSize: 13, color: T.muted, fontStyle: 'italic' }}>No students enrolled in this class yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {classRoster.map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: '#fff', border: `1px solid ${T.borderLight}` }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{e.studentName}</span>
                    <button onClick={() => handleRemoveStudentFromClass(e.studentId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
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
      case 'classes': return renderClassesTab();
      case 'attendance': return renderAttendanceView();
      case 'grading': return renderGrading();
      case 'assignments': return renderAssignments();
      case 'announcements': return renderAnnouncements();
      case 'messages': return renderMessages();
      case 'profile': return renderProfile();
      default: return renderDashboard();
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
        <span className="portal-mobile-role-badge">Teacher</span>
      </div>

      {sidebarOpen && <div
        className={`portal-sidebar print-hide portal-sidebar--open`}
        style={{ width: 252, background: T.sidebarBg, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}
      >
        <button className="portal-sidebar-overlay-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">✕</button>
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${T.borderLight}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <img src="/logo.png" alt="Edvance Logo" style={{ height: 48, objectFit: 'contain', alignSelf: 'flex-start' }} />
            <span style={{ fontSize: 11, color: T.light, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Teacher Portal</span>
          </div>
        </div>
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

      {rightPanelOpen && <div className="portal-right-panel print-hide" style={{ width: 256, background: T.sidebarBg, borderLeft: `1px solid ${T.border}`, padding: '24px 18px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 22, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', paddingBottom: 18, borderBottom: `1px solid ${T.borderLight}` }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: rgba(accent, 0.1), border: `2px solid ${rgba(accent, 0.25)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 24, color: accent }}>{name.charAt(0)}</div>
          <p style={{ margin: '0 0 4px', fontWeight: 700, color: T.text, fontSize: 14 }}>{name}</p>
          <span style={badge(accent, rgba(accent, 0.1))}>Teacher</span>
        </div>
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: T.light, textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Stats</p>
          {[{ label: 'Students', value: dashData.students || 0 }, { label: 'Classes', value: dashData.classes || 0 }].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${T.borderLight}` }}>
              <span style={{ color: T.muted, fontSize: 13 }}>{s.label}</span>
              <strong style={{ color: T.text }}>{s.value}</strong>
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
}


