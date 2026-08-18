import React from 'react';
import { Printer, Edit3, Check, Download, Loader2 } from 'lucide-react';
import { btnStyle } from '../styles/portalTheme';

export default function ReportCardControls({ accent, onPrint, onExportPDF, exportingPDF, isEditing, onToggleEdit, customFields, onFieldChange }) {
  const editInputStyle = {
    border: '1.5px solid ' + accent,
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 13,
    fontFamily: 'inherit',
    background: '#fffbf0',
    color: '#1a1a2e',
    outline: 'none',
    width: '100%',
  };

  return (
    <>
      <style>{`
        @media print { .report-card-controls { display: none !important; } }
      `}</style>
      <div className="report-card-controls print-hide" style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        {/* Action Bar */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onToggleEdit}
            style={{
              ...btnStyle(isEditing ? '#10b981' : accent),
              background: isEditing ? '#10b981' : 'transparent',
              color: isEditing ? '#fff' : accent,
              border: `1.5px solid ${isEditing ? '#10b981' : accent}`,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {isEditing ? <><Check size={15} /> Finish Editing</> : <><Edit3 size={15} /> Customize Report</>}
          </button>
          <button
            onClick={onPrint}
            style={{ ...btnStyle(accent), display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Printer size={15} /> Print All
          </button>
          <button
            onClick={onExportPDF || onPrint}
            disabled={exportingPDF}
            style={{
              ...btnStyle('#1e293b'),
              background: '#1e293b',
              color: '#fff',
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: exportingPDF ? 0.75 : 1,
              cursor: exportingPDF ? 'wait' : 'pointer'
            }}
          >
            {exportingPDF ? (
              <><Loader2 size={15} className="spin" /> Generating PDF...</>
            ) : (
              <><Download size={15} /> Export PDF</>
            )}
          </button>
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>
            {exportingPDF ? '⏳ Generating multi-page high-resolution PDF, please wait...' : isEditing ? '✏️ Editing mode active — changes apply to all cards' : 'Click "Customize Report" to edit headers before printing or exporting'}
          </span>
        </div>

        {/* Inline Edit Fields (shown only when editing) */}
        {isEditing && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
            paddingTop: 12,
            borderTop: '1px solid #f1f5f9'
          }}>
            {[
              { key: 'schoolName', label: 'School Name' },
              { key: 'academicYear', label: 'Academic Year' },
              { key: 'termLabel', label: 'Term Label' },
              { key: 'classMaster', label: 'Class Master / Titulaire' },
              { key: 'principalName', label: 'Principal / Directeur' },
              { key: 'examSession', label: 'Exam Session' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                  {field.label}
                </label>
                <input
                  type="text"
                  value={customFields[field.key] || ''}
                  onChange={e => onFieldChange(field.key, e.target.value)}
                  style={editInputStyle}
                  placeholder={`Enter ${field.label}...`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
