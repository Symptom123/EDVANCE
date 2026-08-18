import React, { useState, useEffect, useRef } from 'react';
import { Download, FileText, CheckCircle2, AlertCircle, Loader2, Printer } from 'lucide-react';
import { T, cardStyle, inputStyle, btnStyle } from '../styles/portalTheme';
import ReportCardView from './ReportCardView';
import ReportCardControls from './ReportCardControls';

// Helper to dynamically load html2pdf from CDN when needed (bypasses bundler ESM resolution issues)
const loadHtml2Pdf = () => {
  if (typeof window !== 'undefined' && window.html2pdf) {
    return Promise.resolve(window.html2pdf);
  }
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('html2pdf-cdn');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.html2pdf));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = 'html2pdf-cdn';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => resolve(window.html2pdf);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export default function AdminReportCardGenerator({ config, accent }) {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [term, setTerm] = useState('1');
  const [academicYear, setAcademicYear] = useState('2026-2027');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [reportCards, setReportCards] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [view, setView] = useState('list'); // 'list' or 'bulletin'
  const [selectedCard, setSelectedCard] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [customFields, setCustomFields] = useState({});
  const [exportingPDF, setExportingPDF] = useState(false);
  const printRootRef = useRef(null);

  useEffect(() => {
    if (!config) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/classes?schoolId=${config.schoolId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setClasses(data); });
  }, [config]);

  // --- High-fidelity direct PDF download using html2pdf without browser freeze ---
  const handleExportPDF = async () => {
    const el = printRootRef.current;
    if (!el) return;
    setExportingPDF(true);
    try {
      const html2pdf = await loadHtml2Pdf();
      const selectedClass = classes.find(c => String(c.id || c.ID) === String(classId));
      const selectedClassName = selectedClass?.name || 'ReportCards';
      const classNameClean = (selectedClassName || 'ReportCards').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${classNameClean}_Term_${term}_${academicYear}.pdf`;
      const opt = {
        margin: [5, 5, 5, 5],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };
      await html2pdf().set(opt).from(el).save();
    } catch (err) {
      console.error('PDF Export Error:', err);
      window.print();
    } finally {
      setExportingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const fetchReportCards = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/report-cards/list?schoolId=${config.schoolId}&classId=${classId}&term=${term}&academicYear=${encodeURIComponent(academicYear)}`
      );
      const data = await res.json();
      // The list returns { id, studentId, studentName, termAverage, rank, status, data: ReportCardFull }
      // Extract the nested data for ReportCardView compatibility
      const cards = Array.isArray(data) ? data.map(rc => ({
        ...(rc.data || {}),
        id: rc.id,
        studentId: rc.studentId,
        studentName: rc.studentName,
        termAverage: rc.termAverage,
        classAverage: rc.classAverage,
        rank: rc.rank,
        status: rc.status,
        totalStudents: data.length,
      })) : [];
      setReportCards(cards);
    } catch (e) {
      setMessage({ text: 'Failed to load report cards', type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReportCards();
  }, [classId, term, academicYear]);

  const handleGenerateBulk = async () => {
    if (!classId) { setMessage({ text: 'Please select a class first', type: 'error' }); return; }
    setGenerating(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/report-cards/generate-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: config.schoolId,
          classId,
          term: parseInt(term),
          academicYear,
          adminId: config.id
        })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Generation failed');
      }
      const data = await res.json();
      setMessage({ text: `Generated ${data.generated} report cards successfully`, type: 'success' });
      await fetchReportCards();
    } catch (e) {
      setMessage({ text: `Error: ${e.message}`, type: 'error' });
    }
    setGenerating(false);
  };

  const handlePublish = async (id) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/report-cards/${id}/publish`, { method: 'PUT' });
      fetchReportCards();
    } catch (e) {
      console.error(e);
    }
  };

  const selectedClassName = classes.find(c => (c.id || c.ID) === classId)?.name || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* Header */}
      <div className="no-print">
        <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.light, margin: '0 0 6px' }}>Administration</p>
        <h1 style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 34, fontWeight: 400, margin: 0, color: T.text }}>Report Card Generation</h1>
      </div>

      {/* Controls */}
      <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 16 }} className="no-print">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Academic Year</label>
            <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} style={{ ...inputStyle, width: 130, background: '#fff' }} />
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
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Class</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} style={{ ...inputStyle, background: '#fff', minWidth: 220 }}>
              <option value="">-- Choose Class --</option>
              {classes.map(c => <option key={c.ID || c.id} value={c.ID || c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button
              onClick={handleGenerateBulk}
              disabled={!classId || generating}
              style={{ ...btnStyle(accent), opacity: (!classId || generating) ? 0.65 : 1 }}
            >
              {generating
                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }}/> Generating...</>
                : <><FileText size={15}/> Generate / Refresh Cards</>}
            </button>
          </div>
        </div>

        {message.text && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: message.type === 'error' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${message.type === 'error' ? '#fca5a5' : '#86efac'}` }}>
            {message.type === 'error' ? <AlertCircle size={15} color="#ef4444"/> : <CheckCircle2 size={15} color="#10b981"/>}
            <span style={{ fontSize: 13, fontWeight: 600, color: message.type === 'error' ? '#dc2626' : '#059669' }}>{message.text}</span>
          </div>
        )}
      </div>

      {/* Report Card List Table */}
      {classId && view === 'list' && (
        <div style={{ ...cardStyle }} className="no-print">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: T.text }}>
              {selectedClassName} — Term {term} — {academicYear}
              {reportCards.length > 0 && <span style={{ fontWeight: 400, color: T.muted, fontSize: 13 }}> ({reportCards.length} students)</span>}
            </h3>
            {reportCards.length > 0 && (
              <button
                onClick={() => { setSelectedCard(null); setView('bulletin'); }}
                style={{ ...btnStyle('#1e3a8a'), background: 'transparent', color: '#1e3a8a', border: '1px solid #1e3a8a' }}
              >
                <Printer size={14}/> View All Bulletins
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px', display: 'block' }}/>
              Loading report cards...
            </div>
          ) : reportCards.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: T.muted, background: T.background, borderRadius: 8 }}>
              No report cards generated yet. Click <strong>Generate / Refresh Cards</strong> above to compute averages and ranks from entered marks.
            </div>
          ) : (
            <div>
              {/* Column Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1fr 1.5fr', gap: 10, paddingBottom: 10, borderBottom: `2px solid ${T.borderLight}`, fontWeight: 700, color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span>Student Name</span>
                <span>Average</span>
                <span>Rank</span>
                <span>Class Avg</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                {reportCards.map((rc, idx) => {
                  const avg = rc.termAverage ?? 0;
                  const isPassing = avg >= 10;
                  return (
                    <div
                      key={rc.id || rc.studentId}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1fr 1.5fr',
                        gap: 10,
                        padding: '11px 0',
                        borderBottom: `1px solid ${T.borderLight}`,
                        alignItems: 'center',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
                      }}
                    >
                      <strong style={{ fontSize: 14, color: T.text }}>{rc.studentName}</strong>
                      <span style={{ fontSize: 15, fontWeight: 700, color: isPassing ? '#15803d' : '#dc2626' }}>
                        {avg > 0 ? avg.toFixed(2) : '—'}<span style={{ fontWeight: 400, fontSize: 11, color: T.muted }}>/20</span>
                      </span>
                      <span style={{ fontSize: 14 }}>
                        {rc.rank}/{reportCards.length}
                      </span>
                      <span style={{ fontSize: 13, color: T.muted }}>
                        {rc.classAverage > 0 ? rc.classAverage.toFixed(2) : '—'}
                      </span>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        background: rc.status === 'published' ? '#dcfce7' : '#fef3c7',
                        color: rc.status === 'published' ? '#15803d' : '#92400e',
                      }}>
                        {rc.status === 'published' ? '✓ Published' : '● Draft'}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => { setSelectedCard(rc); setView('bulletin'); }}
                          style={{ ...btnStyle('#4f46e5'), padding: '4px 10px', fontSize: 12, background: 'transparent', color: '#4f46e5', border: '1px solid #4f46e5' }}
                        >
                          View
                        </button>
                        {rc.status !== 'published' && (
                          <button
                            onClick={() => handlePublish(rc.id)}
                            style={{ ...btnStyle('#10b981'), padding: '4px 10px', fontSize: 12, background: 'transparent', color: '#10b981', border: '1px solid #10b981' }}
                          >
                            Publish
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulletin View */}
      {view === 'bulletin' && (
        <div className="print-root">
          <div className="no-print" style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' }}>
            <button
              onClick={() => { setView('list'); setSelectedCard(null); }}
              style={{ ...btnStyle('#64748b'), background: 'transparent', color: '#64748b', border: '1px solid #64748b' }}
            >
              ← Back to List
            </button>
            <span style={{ color: T.muted, fontSize: 13 }}>
              {selectedCard ? `Viewing: ${selectedCard.studentName}` : `All ${reportCards.length} students`}
            </span>
          </div>

          <ReportCardControls
            accent={accent}
            onPrint={handlePrint}
            onExportPDF={handleExportPDF}
            exportingPDF={exportingPDF}
            isEditing={isEditing}
            onToggleEdit={() => setIsEditing(v => !v)}
            customFields={customFields}
            onFieldChange={(key, val) => setCustomFields(prev => ({ ...prev, [key]: val }))}
          />

          <div className="print-main" ref={printRootRef} style={{ marginTop: 16 }}>
            <ReportCardView
              reportCards={selectedCard ? [selectedCard] : reportCards}
              accent={accent}
              config={config}
              isEditing={isEditing}
              customFields={customFields}
              onFieldChange={(key, val) => setCustomFields(prev => ({ ...prev, [key]: val }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
